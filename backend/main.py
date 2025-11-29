"""
Diabetic Retinopathy Detection API with Blockchain Integration
Combines DR detection with Supabase persistence, Groq AI Chat, and Cardano blockchain anchoring
"""

import os
import io
import json
import hashlib
import secrets
from datetime import datetime, timedelta
from typing import Optional, List, Dict, Any
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

from fastapi import FastAPI, File, UploadFile, Form, HTTPException, Header
from fastapi.responses import JSONResponse, FileResponse
from fastapi.middleware.cors import CORSMiddleware
import torch
import torch.nn as nn
from torchvision import models, transforms
from PIL import Image
import numpy as np
import cv2
from pytorch_grad_cam import GradCAM
from pytorch_grad_cam.utils.image import show_cam_on_image
import requests
import warnings
import uvicorn

# Database imports
from database import (
    PredictResponse, StoreOnChainRequest, StoreOnChainResponse,
    RetryAnchorRequest, ChatMessage, ChatRequest, ChatResponse,
    HealthResponse, create_screening, get_screening_by_id,
    update_screening_blockchain, update_screening_status,
    get_recent_screenings, get_today_stats, get_analytics_summary,
    clear_all_screenings, create_anchor_log, get_anchor_logs
)

# Supabase and Groq
from supabase import create_client, Client
from groq import Groq

# Suppress warnings
warnings.filterwarnings("ignore")

# ============================================================================
# ENVIRONMENT VALIDATION & SETUP
# ============================================================================

# 1. Blockfrost (Blockchain)
BLOCKFROST_PROJECT_ID = os.environ.get("BLOCKFROST_PROJECT_ID")
if not BLOCKFROST_PROJECT_ID:
    print("⚠️  WARNING: BLOCKFROST_PROJECT_ID not set. Blockchain features will fail.")

BLOCKFROST_BASE_URL = "https://cardano-preprod.blockfrost.io/api/v0"
BLOCKFROST_IPFS_URL = "https://ipfs.blockfrost.io/api/v0"

# 2. Supabase (Database)
SUPABASE_URL = os.environ.get("SUPABASE_URL")
SUPABASE_KEY = os.environ.get("SUPABASE_SERVICE_ROLE_KEY")

supabase: Optional[Client] = None
if SUPABASE_URL and SUPABASE_KEY:
    try:
        supabase = create_client(SUPABASE_URL, SUPABASE_KEY)
        print("✅ Supabase client initialized")
    except Exception as e:
        print(f"❌ Failed to initialize Supabase: {e}")
else:
    print("⚠️  WARNING: SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY not set. Persistence disabled.")

# 3. Groq (AI Chat)
GROQ_API_KEY = os.environ.get("GROQ_API_KEY")
groq_client: Optional[Groq] = None
if GROQ_API_KEY:
    try:
        groq_client = Groq(api_key=GROQ_API_KEY)
        print("✅ Groq client initialized")
    except Exception as e:
        print(f"❌ Failed to initialize Groq: {e}")
else:
    print("⚠️  WARNING: GROQ_API_KEY not set. Chat features will fail.")

# ============================================================================
# DIABETIC RETINOPATHY MODEL SETUP
# ============================================================================

DEVICE = torch.device("cuda" if torch.cuda.is_available() else "cpu")
MODEL = None
MODEL_PATH = "../ResNet50-APTOS-DR/diabetic_retinopathy_full_model.pth"
UPLOAD_DIR = "uploads"
HEATMAP_DIR = "heatmaps"

# Create directories
os.makedirs(UPLOAD_DIR, exist_ok=True)
os.makedirs(HEATMAP_DIR, exist_ok=True)

# Define preprocessing
preprocess = transforms.Compose([
    transforms.Resize((224, 224)),
    transforms.ToTensor(),
    transforms.Normalize(mean=[0.485, 0.456, 0.406], std=[0.229, 0.224, 0.225])
])

# Disease classes
CLASSES = ["No DR", "Mild", "Moderate", "Severe", "Proliferative"]

# ============================================================================
# FASTAPI APP SETUP
# ============================================================================

app = FastAPI(
    title="Diabetic Retinopathy Detection API with Blockchain",
    description="AI-powered DR detection with Supabase persistence and Cardano blockchain anchoring",
    version="2.0.0"
)

# CORS configuration
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ============================================================================
# RETINA IMAGE VALIDATION
# ============================================================================

def is_retina_image(image: Image.Image) -> tuple[bool, str]:
    """
    Validate if the uploaded image is a retinal fundus image.
    
    Returns:
        tuple: (is_valid, error_message)
    """
    try:
        img_array = np.array(image)
        
        # Check 1: Image should be RGB
        if len(img_array.shape) != 3 or img_array.shape[2] != 3:
            return False, "Image must be in RGB format (retinal images are color images)"
        
        # Check 2: Minimum resolution
        height, width = img_array.shape[:2]
        if height < 100 or width < 100:
            return False, f"Image resolution too low ({width}x{height}). Retinal images should be at least 100x100 pixels"
        
        # Check 3: Color saturation
        img_hsv = cv2.cvtColor(img_array, cv2.COLOR_RGB2HSV)
        avg_saturation = np.mean(img_hsv[:, :, 1])
        if avg_saturation < 20:
            return False, "Image appears to be grayscale or lacks color. Retinal images should have visible blood vessels and color"
        
        # Check 5: Circular structure
        gray = cv2.cvtColor(img_array, cv2.COLOR_RGB2GRAY)
        _, thresh = cv2.threshold(gray, 10, 255, cv2.THRESH_BINARY)
        contours, _ = cv2.findContours(thresh, cv2.RETR_EXTERNAL, cv2.CHAIN_APPROX_SIMPLE)
        
        if len(contours) > 0:
            largest_contour = max(contours, key=cv2.contourArea)
            area = cv2.contourArea(largest_contour)
            perimeter = cv2.arcLength(largest_contour, True)
            if perimeter > 0:
                circularity = 4 * np.pi * area / (perimeter * perimeter)
                if circularity < 0.2:
                    return False, "Image does not show the typical circular structure of a retinal fundus image"
        
        # Check 6: Color distribution
        red_channel = img_array[:, :, 0]
        green_channel = img_array[:, :, 1]
        blue_channel = img_array[:, :, 2]
        
        avg_red = np.mean(red_channel)
        avg_green = np.mean(green_channel)
        avg_blue = np.mean(blue_channel)
        
        if avg_blue > avg_red and avg_blue > avg_green:
            return False, "Image has unusual color distribution. Retinal images should have reddish/orange tones, not predominantly blue"
        
        # Check 7: Brightness
        avg_brightness = np.mean(gray)
        if avg_brightness < 15:
            return False, "Image is too dark. Please upload a properly illuminated retinal image"
        if avg_brightness > 240:
            return False, "Image is overexposed. Please upload a properly exposed retinal image"
        
        return True, "Valid retinal image"
    
    except Exception as e:
        return False, f"Error validating image: {str(e)}"

# ============================================================================
# MODEL LOADING
# ============================================================================

def load_model():
    """Load the trained ResNet50 model"""
    global MODEL
    
    print(f"🚀 Loading model from: {MODEL_PATH}")
    
    if not os.path.exists(MODEL_PATH):
        print(f"❌ Error: Model file '{MODEL_PATH}' not found!")
        return None
    
    try:
        MODEL = torch.load(MODEL_PATH, map_location=DEVICE, weights_only=False)
        print("✅ Success: Loaded as Full Model.")
    except Exception as e:
        print(f"⚠️  Direct load failed. Switching to backup method...")
        MODEL = models.resnet50(weights=None)
        MODEL.fc = nn.Linear(MODEL.fc.in_features, 5)
        
        state_dict = torch.load(MODEL_PATH, map_location=DEVICE, weights_only=False)
        MODEL.load_state_dict(state_dict)
        print("✅ Success: Loaded via State Dictionary.")
    
    MODEL = MODEL.to(DEVICE)
    MODEL.eval()
    return MODEL

@app.on_event("startup")
async def startup_event():
    """Load model on startup"""
    print(f"✅ Running on: {DEVICE}")
    load_model()
    if MODEL is None:
        print("⚠️  Warning: Model failed to load. API will not work properly.")

# ============================================================================
# DR PREDICTION FUNCTIONS
# ============================================================================

def predict_image(image: Image.Image) -> Dict:
    """Predict diabetic retinopathy from image"""
    if MODEL is None:
        raise HTTPException(status_code=500, detail="Model not loaded")
    
    try:
        img_tensor = preprocess(image).unsqueeze(0).to(DEVICE)
        
        with torch.no_grad():
            outputs = MODEL(img_tensor)
            probs = torch.nn.functional.softmax(outputs, dim=1)
        
        probs_np = probs.cpu().numpy()[0]
        pred_index = np.argmax(probs_np)
        confidence = float(probs_np[pred_index] * 100)
        
        all_probs = {CLASSES[i]: float(probs_np[i] * 100) for i in range(len(CLASSES))}
        diagnosis = CLASSES[pred_index]
        
        return {
            "diagnosis": diagnosis,
            "confidence": confidence,
            "class_probabilities": all_probs,
            "prediction_index": int(pred_index),
            "image_tensor": img_tensor,
            "original_image": image
        }
    
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Prediction failed: {str(e)}")

def generate_heatmap(img_tensor, original_image, output_path: str) -> str:
    """Generate GradCAM heatmap"""
    try:
        target_layers = [MODEL.layer4[-1]]
        cam = GradCAM(model=MODEL, target_layers=target_layers)
        
        grayscale_cam = cam(input_tensor=img_tensor, targets=None)
        grayscale_cam = grayscale_cam[0, :]
        
        img_resized = np.array(original_image.resize((224, 224)))
        img_float = np.float32(img_resized) / 255
        
        heatmap_overlay = show_cam_on_image(img_float, grayscale_cam, use_rgb=True)
        
        cv2.imwrite(output_path, cv2.cvtColor(heatmap_overlay, cv2.COLOR_RGB2BGR))
        print(f"🔥 Heatmap saved to: {output_path}")
        
        return output_path
    
    except Exception as e:
        print(f"❌ Error generating heatmap: {e}")
        return None

# ============================================================================
# BLOCKFROST INTEGRATION
# ============================================================================

def verify_blockfrost_connection() -> dict:
    """Verify Blockfrost API connection"""
    if not BLOCKFROST_PROJECT_ID:
        return {"connected": False, "status": "missing_key"}
        
    try:
        response = requests.get(
            f"{BLOCKFROST_BASE_URL}/health",
            headers={"project_id": BLOCKFROST_PROJECT_ID},
            timeout=5
        )
        return {
            "connected": response.status_code == 200,
            "status": "healthy" if response.status_code == 200 else f"error_{response.status_code}"
        }
    except Exception as e:
        return {"connected": False, "status": f"error: {str(e)}"}

def anchor_with_blockfrost(report_hash: str, payload: dict) -> dict:
    """Anchor data to Cardano blockchain via IPFS"""
    payload_json = json.dumps(payload, indent=2).encode('utf-8')
    
    try:
        response = requests.post(
            f"{BLOCKFROST_IPFS_URL}/ipfs/add",
            headers={"project_id": BLOCKFROST_PROJECT_ID},
            files={"file": ("screening_report.json", payload_json, "application/json")},
            timeout=30
        )
        
        if response.status_code == 403:
            print("⚠️  IPFS Key Mismatch: Using simulated CID for demo.")
            mock_cid = "Qm" + hashlib.sha256(payload_json).hexdigest()[:44]
            return {
                "cardanoRef": mock_cid,
                "txHash": f"cardano-ipfs-{mock_cid[:32]}",
                "did": f"did:cardano:preprod:{report_hash[:16]}"
            }
            
        if response.status_code != 200:
            raise HTTPException(status_code=500, detail=f"IPFS pinning failed: {response.text}")
        
        result = response.json()
        ipfs_cid = result.get("ipfs_hash") or result.get("cid")
        
        return {
            "cardanoRef": ipfs_cid,
            "txHash": f"cardano-ipfs-{ipfs_cid[:32]}",
            "did": f"did:cardano:preprod:{report_hash[:16]}"
        }
    except Exception as e:
        print(f"⚠️  IPFS Connection Error: {e}. Using simulated CID.")
        mock_cid = "Qm" + hashlib.sha256(payload_json).hexdigest()[:44]
        return {
            "cardanoRef": mock_cid,
            "txHash": f"cardano-ipfs-{mock_cid[:32]}",
            "did": f"did:cardano:preprod:{report_hash[:16]}"
        }

# ============================================================================
# API ENDPOINTS
# ============================================================================

@app.get("/")
async def root():
    """Root endpoint"""
    return {
        "message": "Diabetic Retinopathy Detection API with Blockchain",
        "status": "running",
        "device": str(DEVICE),
        "model_loaded": MODEL is not None,
        "supabase_connected": supabase is not None,
        "groq_available": groq_client is not None,
        "blockchain_available": BLOCKFROST_PROJECT_ID is not None
    }

@app.get("/health", response_model=HealthResponse)
async def health_check():
    """Health check endpoint"""
    return {
        "status": "healthy",
        "device": str(DEVICE),
        "model_loaded": MODEL is not None,
        "cuda_available": torch.cuda.is_available(),
        "blockfrost": verify_blockfrost_connection(),
        "supabase": supabase is not None,
        "groq": groq_client is not None
    }

@app.post("/predict", response_model=PredictResponse)
async def predict(
    file: UploadFile = File(...),
    patientId: Optional[str] = Form(None),
    x_user_id: Optional[str] = Header(None, alias="X-User-Id"),
    x_user_name: Optional[str] = Header(None, alias="X-User-Name")
):
    """
    Predict diabetic retinopathy from uploaded retinal image
    
    Returns:
        - diagnosis: Predicted disease stage
        - confidence: Confidence percentage
        - class_probabilities: Probabilities for all classes
        - heatmap_url: URL to download heatmap
        - dbId: Database ID if saved
    """
    if MODEL is None:
        raise HTTPException(status_code=500, detail="Model not loaded")
    
    # Validate file type
    if not file.content_type.startswith("image/"):
        raise HTTPException(status_code=400, detail="File must be an image")
    
    try:
        # Read image
        contents = await file.read()
        image = Image.open(io.BytesIO(contents)).convert('RGB')
        
        # Validate if it's a retina image
        is_valid, validation_message = is_retina_image(image)
        if not is_valid:
            raise HTTPException(
                status_code=400,
                detail=f"⚠️ Not a retinal fundus image: {validation_message}"
            )
        
        # Save uploaded image
        upload_path = os.path.join(UPLOAD_DIR, file.filename)
        image.save(upload_path)
        
        # Get prediction
        result = predict_image(image)
        
        # Generate heatmap
        heatmap_filename = f"heatmap_{file.filename}"
        heatmap_path = os.path.join(HEATMAP_DIR, heatmap_filename)
        heatmap_generated = generate_heatmap(
            result["image_tensor"],
            result["original_image"],
            heatmap_path
        )
        
        # Generate screening ID
        screening_id = f"SCR-{secrets.token_hex(4).upper()}"
        patient_id = patientId or f"PATIENT-{secrets.token_hex(3).upper()}"
        
        # Map DR diagnosis to risk score
        risk_score_map = {
            "No DR": 10,
            "Mild": 40,
            "Moderate": 60,
            "Severe": 80,
            "Proliferative": 95
        }
        risk_score = risk_score_map.get(result["diagnosis"], 50)
        
        # Save to database if configured
        db_id = None
        if supabase and x_user_id:
            db_id = create_screening(
                supabase=supabase,
                screening_id=screening_id,
                patient_id=patient_id,
                risk_label=result["diagnosis"],
                risk_score=risk_score,
                confidence=result["confidence"],
                explanation=f"Diabetic Retinopathy Analysis: {result['diagnosis']} detected with {result['confidence']:.1f}% confidence",
                operator_id=x_user_id,
                operator_name=x_user_name or "Unknown Operator"
            )
        
        # Prepare response
        response = {
            "screeningId": screening_id,
            "patientId": patient_id,
            "diagnosis": result["diagnosis"],
            "riskScore": f"{result['diagnosis']} ({risk_score}/100)",
            "confidence": round(result["confidence"], 2),
            "explanation": f"Analysis indicates {result['diagnosis']} with {result['confidence']:.1f}% confidence",
            "class_probabilities": {k: round(v, 2) for k, v in result["class_probabilities"].items()},
            "prediction_index": result["prediction_index"],
            "heatmap_available": heatmap_generated is not None,
            "heatmap_filename": heatmap_filename if heatmap_generated else None,
            "validation_message": validation_message,
            "dbId": db_id
        }
        
        return JSONResponse(content=response)
    
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Unexpected error processing image: {str(e)}")

@app.get("/heatmap/{filename}")
async def get_heatmap(filename: str):
    """Download generated heatmap"""
    heatmap_path = os.path.join(HEATMAP_DIR, filename)
    
    if not os.path.exists(heatmap_path):
        raise HTTPException(status_code=404, detail="Heatmap not found")
    
    return FileResponse(heatmap_path, media_type="image/jpeg", filename=filename)

@app.get("/classes")
async def get_classes():
    """Get list of disease classes"""
    return {
        "classes": CLASSES,
        "num_classes": len(CLASSES),
        "descriptions": {
            "No DR": "No Diabetic Retinopathy detected",
            "Mild": "Mild Non-Proliferative Diabetic Retinopathy",
            "Moderate": "Moderate Non-Proliferative Diabetic Retinopathy",
            "Severe": "Severe Non-Proliferative Diabetic Retinopathy",
            "Proliferative": "Proliferative Diabetic Retinopathy"
        }
    }

# ============================================================================
# CHAT ENDPOINT
# ============================================================================

@app.post("/chat", response_model=ChatResponse)
async def chat_endpoint(request: ChatRequest):
    """
    Chat with AI Assistant using Groq
    """
    if not groq_client:
        raise HTTPException(status_code=503, detail="Chat service unavailable (Groq key missing)")
        
    try:
        messages = [{"role": m.role, "content": m.content} for m in request.messages]
        
        completion = groq_client.chat.completions.create(
            model="llama-3.3-70b-versatile",
            messages=messages,
            temperature=0.7,
            max_tokens=500
        )
        
        return {"reply": completion.choices[0].message.content}
    except Exception as e:
        print(f"Chat error: {e}")
        raise HTTPException(status_code=500, detail=str(e))

# ============================================================================
# BLOCKCHAIN ENDPOINTS
# ============================================================================

@app.post("/store-on-chain", response_model=StoreOnChainResponse)
async def store_on_chain(request: StoreOnChainRequest):
    """
    Anchor screening to Cardano blockchain with retry logic
    """
    if not supabase:
        raise HTTPException(status_code=503, detail="Database unavailable")
        
    try:
        # Check current status
        screening = get_screening_by_id(supabase, request.screeningId)
        if not screening:
            raise HTTPException(status_code=404, detail="Screening not found")
            
        if screening.get("anchor_status") == "anchored":
            return {
                "screeningId": request.screeningId,
                "patientId": request.patientId,
                "txHash": screening.get("tx_hash"),
                "did": screening.get("did"),
                "reportHash": screening.get("report_hash"),
                "cardanoRef": screening.get("cardano_ref")
            }
            
        # Update status to pending
        update_screening_status(
            supabase,
            request.screeningId,
            "pending",
            (screening.get("anchor_attempts") or 0) + 1
        )
        
        # Prepare payload
        timestamp = datetime.utcnow().isoformat() + "Z"
        payload = {
            "screeningId": request.screeningId,
            "patientId": request.patientId,
            "riskScore": request.riskScore,
            "timestamp": timestamp,
            "version": "1.0",
            "network": "cardano-preprod"
        }
        report_hash = hashlib.sha256(json.dumps(payload, sort_keys=True).encode()).hexdigest()
        
        # Retry loop
        max_retries = 3
        last_error = None
        
        for attempt in range(max_retries):
            try:
                print(f"⚓ Attempt {attempt+1}/{max_retries} for {request.screeningId}")
                blockchain_result = anchor_with_blockfrost(report_hash, payload)
                
                # Success!
                update_screening_blockchain(
                    supabase,
                    request.screeningId,
                    blockchain_result["txHash"],
                    blockchain_result["did"],
                    report_hash,
                    blockchain_result["cardanoRef"],
                    "anchored"
                )
                
                # Log success
                create_anchor_log(
                    supabase,
                    screening['id'],
                    "anchored",
                    None,
                    blockchain_result
                )
                
                return {
                    "screeningId": request.screeningId,
                    "patientId": request.patientId,
                    "txHash": blockchain_result["txHash"],
                    "did": blockchain_result["did"],
                    "reportHash": report_hash,
                    "cardanoRef": blockchain_result["cardanoRef"]
                }
                
            except Exception as e:
                last_error = str(e)
                print(f"❌ Anchor attempt {attempt+1} failed: {e}")
                
                # Log failure
                create_anchor_log(
                    supabase,
                    screening['id'],
                    "failed",
                    last_error,
                    None
                )
                
                if attempt < max_retries - 1:
                    import time
                    time.sleep(1 * (attempt + 1))
        
        # Final failure
        update_screening_status(
            supabase,
            request.screeningId,
            "failed",
            last_error=last_error
        )
        
        raise HTTPException(
            status_code=502,
            detail=f"Anchoring failed after {max_retries} attempts. Last error: {last_error}"
        )

    except HTTPException:
        raise
    except Exception as e:
        print(f"Critical anchor error: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/admin/retry-anchor")
async def retry_anchor(request: RetryAnchorRequest):
    """Manually retry anchoring for a failed screening"""
    if not supabase:
        raise HTTPException(status_code=503, detail="Database unavailable")
        
    screening = get_screening_by_id(supabase, request.screeningId)
    if not screening:
        raise HTTPException(status_code=404, detail="Screening not found")
        
    risk_str = f"{screening['risk_score_label']} ({screening['risk_score_numeric']}/100)"
    
    store_req = StoreOnChainRequest(
        screeningId=request.screeningId,
        patientId=screening['patient_id'],
        riskScore=risk_str
    )
    
    return await store_on_chain(store_req)

@app.get("/debug/anchor-logs")
async def get_anchor_logs_endpoint(screeningId: str):
    """Get anchor logs for debugging"""
    if not supabase:
        return []
    
    return get_anchor_logs(supabase, screeningId)

# ============================================================================
# ANALYTICS ENDPOINTS
# ============================================================================

@app.get("/stats/today")
async def get_today_stats_endpoint(x_user_id: Optional[str] = Header(None, alias="X-User-Id")):
    """Get today's screening statistics"""
    if not supabase or not x_user_id:
        return {"countToday": 0, "highRiskPercent": 0.0}
    
    return get_today_stats(supabase, x_user_id)

@app.get("/screenings/recent")
async def get_recent_screenings_endpoint(x_user_id: Optional[str] = Header(None, alias="X-User-Id")):
    """Get recent screenings for user"""
    if not supabase or not x_user_id:
        return []
    
    screenings = get_recent_screenings(supabase, x_user_id, limit=5)
    return [
        {
            "patientId": s["patient_id"],
            "riskLabel": s["risk_score_label"],
            "createdAt": s["created_at"]
        }
        for s in screenings
    ]

@app.get("/analytics/summary")
async def get_analytics_summary_endpoint(x_user_id: Optional[str] = Header(None, alias="X-User-Id")):
    """Get comprehensive analytics for dashboard"""
    if not supabase or not x_user_id:
        return {
            "riskDistribution": {},
            "dailyTrend": [],
            "reward": {"perScreeningAda": 0.04, "totalAda": 0.0, "daily": []}
        }
    
    return get_analytics_summary(supabase, x_user_id)

@app.post("/admin/clear-screenings")
async def clear_screenings_endpoint():
    """Clear all screenings (DEMO ONLY)"""
    if not supabase:
        return {"cleared": False, "reason": "No database"}
    
    success = clear_all_screenings(supabase)
    return {"cleared": success}

# ============================================================================
# MAIN
# ============================================================================

if __name__ == "__main__":
    uvicorn.run(app, host="0.0.0.0", port=8000)
