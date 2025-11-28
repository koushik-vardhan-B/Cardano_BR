import os
import torch
import torch.nn as nn
from torchvision import models, transforms
from PIL import Image
import numpy as np
import cv2
from pytorch_grad_cam import GradCAM
from pytorch_grad_cam.utils.image import show_cam_on_image
import warnings

# --- CONFIGURATION ---
# 1. SETUP DEVICE
DEVICE = torch.device("cuda" if torch.cuda.is_available() else "cpu")
print(f"✅ Running on: {DEVICE}")

# 2. SUPPRESS WARNINGS (Keeps terminal clean)
warnings.filterwarnings("ignore")

# 3. DEFINE PREPROCESSING (Standard for ResNet)
preprocess = transforms.Compose([
    transforms.Resize((224, 224)),
    transforms.ToTensor(),
    transforms.Normalize(mean=[0.485, 0.456, 0.406], std=[0.229, 0.224, 0.225])
])

# --- PART A: LOAD THE MODEL ---
def load_model(model_path):
    print(f"🚀 Loading model from: {model_path}")
    
    if not os.path.exists(model_path):
        print(f"❌ Error: File '{model_path}' not found!")
        return None

    try:
        # Try Method 1: Full Model Load (Trust Mode)
        model = torch.load(model_path, map_location=DEVICE, weights_only=False)
        print("✅ Success: Loaded as Full Model.")
    except Exception as e:
        # Try Method 2: Fallback (Rebuild Architecture)
        print(f"⚠️ Direct load failed. Switching to backup method...")
        model = models.resnet50(weights=None)
        model.fc = nn.Linear(model.fc.in_features, 5) # 5 Classes for DR
        
        state_dict = torch.load(model_path, map_location=DEVICE, weights_only=False)
        model.load_state_dict(state_dict)
        print("✅ Success: Loaded via State Dictionary.")

    model = model.to(DEVICE)
    model.eval() # Set to evaluation mode (no learning)
    return model

# --- PART B: PREDICT HEALTH ---
def predict_disease(image_path, model):
    if model is None: return None, 0.0

    try:
        # Load and convert image
        original_image = Image.open(image_path).convert('RGB')
        
        # Preprocess for AI
        img_tensor = preprocess(original_image).unsqueeze(0).to(DEVICE)

        # Get Prediction
        with torch.no_grad():
            outputs = model(img_tensor)
            probs = torch.nn.functional.softmax(outputs, dim=1)

        # Interpret Results
        probs_np = probs.cpu().numpy()[0]
        pred_index = np.argmax(probs_np)
        confidence = probs_np[pred_index] * 100
        
        classes = ["No DR", "Mild", "Moderate", "Severe", "Proliferative"]
        diagnosis = classes[pred_index]

        return diagnosis, confidence, original_image, img_tensor

    except Exception as e:
        print(f"❌ Error processing image: {e}")
        return None, 0.0, None, None

# --- PART C: GENERATE HEATMAP (The Wow Factor) ---
def save_heatmap(model, img_tensor, original_image, output_name="heatmap.jpg"):
    try:
        # 1. Target the last layer of ResNet
        target_layers = [model.layer4[-1]]
        cam = GradCAM(model=model, target_layers=target_layers)

        # 2. Generate Map
        grayscale_cam = cam(input_tensor=img_tensor, targets=None)
        grayscale_cam = grayscale_cam[0, :]

        # 3. Overlay on Original Image
        # Resize original to 224x224 for visualization
        img_resized = np.array(original_image.resize((224, 224)))
        img_float = np.float32(img_resized) / 255
        
        heatmap_overlay = show_cam_on_image(img_float, grayscale_cam, use_rgb=True)
        
        # 4. Save to Disk
        # Convert RGB to BGR for OpenCV saving
        cv2.imwrite(output_name, cv2.cvtColor(heatmap_overlay, cv2.COLOR_RGB2BGR))
        print(f"🔥 Heatmap saved to: {output_name}")
        return output_name

    except Exception as e:
        print(f"❌ Error generating heatmap: {e}")
        return None

# --- PART D: MAIN EXECUTION (Runs when you press Play) ---
if __name__ == "__main__":
    # 1. SETUP PATHS
    # Make sure your .pth file is in the same folder!
    MODEL_FILE = "ResNet50-APTOS-DR/diabetic_retinopathy_full_model.pth" 
    TEST_IMAGE = "test_eye.png" # Put a real image name here

    # 2. LOAD
    ai_brain = load_model(MODEL_FILE)

    # 3. RUN
    if ai_brain:
        diagnosis, confidence, orig_img, img_tensor = predict_disease(TEST_IMAGE, ai_brain)
        
        if diagnosis:
            print("\n" + "="*40)
            print(f"👁️  DIAGNOSIS:  {diagnosis}")
            print(f"📊  CONFIDENCE: {confidence:.2f}%")
            print("="*40 + "\n")

            # 4. CREATE HEATMAP
            save_heatmap(ai_brain, img_tensor, orig_img)