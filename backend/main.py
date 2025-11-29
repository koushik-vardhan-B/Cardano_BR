from fastapi import FastAPI, File, UploadFile, HTTPException
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
import io
import os
import warnings
from typing import Dict
import uvicorn

# Suppress warnings
warnings.filterwarnings("ignore")

# Initialize FastAPI app
app = FastAPI(
    title="Diabetic Retinopathy Detection API",
    description="AI-powered API for detecting diabetic retinopathy from retinal images",
    version="1.0.0"
)

# Add CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Global variables
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


def load_model():
    """Load the trained ResNet50 model"""
    global MODEL
    
    print(f"🚀 Loading model from: {MODEL_PATH}")
    
    if not os.path.exists(MODEL_PATH):
        print(f"❌ Error: Model file '{MODEL_PATH}' not found!")
        return None
    
    try:
        # Try loading full model
        MODEL = torch.load(MODEL_PATH, map_location=DEVICE, weights_only=False)
        print("✅ Success: Loaded as Full Model.")
    except Exception as e:
        # Fallback: Rebuild architecture
        print(f"⚠️ Direct load failed. Switching to backup method...")
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
        print("⚠️ Warning: Model failed to load. API will not work properly.")


@app.get("/")
async def root():
    """Root endpoint"""
    return {
        "message": "Diabetic Retinopathy Detection API",
        "status": "running",
        "device": str(DEVICE),
        "model_loaded": MODEL is not None
    }


@app.get("/health")
async def health_check():
    """Health check endpoint"""
    return {
        "status": "healthy",
        "device": str(DEVICE),
        "model_loaded": MODEL is not None,
        "cuda_available": torch.cuda.is_available()
    }


def predict_image(image: Image.Image) -> Dict:
    """Predict diabetic retinopathy from image"""
    if MODEL is None:
        raise HTTPException(status_code=500, detail="Model not loaded")
    
    try:
        # Preprocess image
        img_tensor = preprocess(image).unsqueeze(0).to(DEVICE)
        
        # Get prediction
        with torch.no_grad():
            outputs = MODEL(img_tensor)
            probs = torch.nn.functional.softmax(outputs, dim=1)
        
        # Interpret results
        probs_np = probs.cpu().numpy()[0]
        pred_index = np.argmax(probs_np)
        confidence = float(probs_np[pred_index] * 100)
        
        # Get all class probabilities
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
        # Target the last layer of ResNet
        target_layers = [MODEL.layer4[-1]]
        cam = GradCAM(model=MODEL, target_layers=target_layers)
        
        # Generate heatmap
        grayscale_cam = cam(input_tensor=img_tensor, targets=None)
        grayscale_cam = grayscale_cam[0, :]
        
        # Overlay on original image
        img_resized = np.array(original_image.resize((224, 224)))
        img_float = np.float32(img_resized) / 255
        
        heatmap_overlay = show_cam_on_image(img_float, grayscale_cam, use_rgb=True)
        
        # Save heatmap
        cv2.imwrite(output_path, cv2.cvtColor(heatmap_overlay, cv2.COLOR_RGB2BGR))
        print(f"🔥 Heatmap saved to: {output_path}")
        
        return output_path
    
    except Exception as e:
        print(f"❌ Error generating heatmap: {e}")
        return None


@app.post("/predict")
async def predict(file: UploadFile = File(...)):
    """
    Predict diabetic retinopathy from uploaded image
    
    Returns:
        - diagnosis: Predicted disease stage
        - confidence: Confidence percentage
        - class_probabilities: Probabilities for all classes
        - heatmap_url: URL to download heatmap
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
        
        # Prepare response
        response = {
            "diagnosis": result["diagnosis"],
            "confidence": round(result["confidence"], 2),
            "class_probabilities": {k: round(v, 2) for k, v in result["class_probabilities"].items()},
            "prediction_index": result["prediction_index"],
            "heatmap_available": heatmap_generated is not None,
            "heatmap_filename": heatmap_filename if heatmap_generated else None
        }
        
        return JSONResponse(content=response)
    
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error processing image: {str(e)}")


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


if __name__ == "__main__":
    uvicorn.run(app, host="0.0.0.0", port=8000, reload=True)
