# 🩺 Diabetic Retinopathy Detection System

AI-powered system for detecting diabetic retinopathy from retinal images using ResNet50 deep learning model.

## 📋 Project Structure

```
pro/
├── backend/                    # FastAPI backend
│   ├── main.py                # API server
│   ├── requirements.txt       # Backend dependencies
│   ├── uploads/               # Uploaded images (auto-created)
│   └── heatmaps/              # Generated heatmaps (auto-created)
├── frontend/                   # Streamlit interface
│   ├── app.py                 # Streamlit app
│   └── requirements.txt       # Frontend dependencies
├── ResNet50-APTOS-DR/         # Model directory
│   └── diabetic_retinopathy_full_model.pth
├── dr_inference.py            # Original inference script
├── setup.py                   # Model setup script
└── test_eye.png              # Sample test image
```

## 🚀 Quick Start

### Prerequisites

- Python 3.8+
- pip
- Git LFS (for model files)

### 1️⃣ Install Dependencies

**Backend:**
```bash
cd backend
pip install -r requirements.txt
```

**Frontend:**
```bash
cd frontend
pip install -r requirements.txt
```

### 2️⃣ Start the Backend API

```bash
cd backend
python main.py
```

The API will start on `http://localhost:8000`

### 3️⃣ Launch the Streamlit Interface

In a new terminal:

```bash
cd frontend
streamlit run app.py
```

The interface will open in your browser at `http://localhost:8501`

## 🔌 API Endpoints

### Health Check
```bash
GET /health
```
Returns API status and model information.

### Get Disease Classes
```bash
GET /classes
```
Returns list of disease classes and descriptions.

### Predict
```bash
POST /predict
```
Upload an image for diabetic retinopathy detection.

**Request:**
- Method: POST
- Content-Type: multipart/form-data
- Body: image file

**Response:**
```json
{
  "diagnosis": "No DR",
  "confidence": 95.67,
  "class_probabilities": {
    "No DR": 95.67,
    "Mild": 2.31,
    "Moderate": 1.45,
    "Severe": 0.42,
    "Proliferative": 0.15
  },
  "prediction_index": 0,
  "heatmap_available": true,
  "heatmap_filename": "heatmap_test_eye.png"
}
```

### Get Heatmap
```bash
GET /heatmap/{filename}
```
Download the generated GradCAM heatmap.

## 🧪 Testing with cURL

```bash
# Health check
curl http://localhost:8000/health

# Get classes
curl http://localhost:8000/classes

# Predict (replace with your image path)
curl -X POST -F "file=@test_eye.png" http://localhost:8000/predict

# Download heatmap
curl http://localhost:8000/heatmap/heatmap_test_eye.png --output heatmap.jpg
```

## 🧪 Testing with Python

```python
import requests

# Upload and predict
with open('test_eye.png', 'rb') as f:
    files = {'file': f}
    response = requests.post('http://localhost:8000/predict', files=files)
    result = response.json()
    print(f"Diagnosis: {result['diagnosis']}")
    print(f"Confidence: {result['confidence']}%")

# Download heatmap
if result['heatmap_available']:
    heatmap_url = f"http://localhost:8000/heatmap/{result['heatmap_filename']}"
    heatmap_response = requests.get(heatmap_url)
    with open('heatmap.jpg', 'wb') as f:
        f.write(heatmap_response.content)
```

## 📊 Disease Classes

| Class | Description | Severity |
|-------|-------------|----------|
| **No DR** | No Diabetic Retinopathy | 🟢 None |
| **Mild** | Mild Non-Proliferative DR | 🟡 Low |
| **Moderate** | Moderate Non-Proliferative DR | 🟠 Medium |
| **Severe** | Severe Non-Proliferative DR | 🔴 High |
| **Proliferative** | Proliferative DR | ⚫ Critical |

## 🔥 Features

- ✅ **FastAPI Backend** - High-performance REST API
- ✅ **Streamlit Interface** - User-friendly web interface
- ✅ **Retinal Image Validation** - Automatically rejects non-retinal images
- ✅ **GradCAM Heatmaps** - Visual explanation of predictions
- ✅ **Multi-class Classification** - 5 disease stages
- ✅ **Confidence Scores** - Probability for each class
- ✅ **CORS Enabled** - Ready for frontend integration
- ✅ **GPU Support** - Automatic CUDA detection

## 🔍 Retinal Image Validation

The system automatically validates uploaded images to ensure they are genuine retinal fundus photographs. The validation checks for:

1. **RGB Color Format** - Retinal images must be in color
2. **Minimum Resolution** - At least 100x100 pixels
3. **Aspect Ratio** - Roughly square (0.7 to 1.5 ratio)
4. **Color Saturation** - Sufficient color (not grayscale)
5. **Circular Structure** - Typical circular field of view
6. **Color Distribution** - Reddish/orange tones (not predominantly blue)
7. **Proper Exposure** - Not too dark or overexposed

**Invalid images will be rejected with a helpful error message** explaining why the image doesn't appear to be a retinal fundus photograph.

## 🛠️ Model Information

- **Architecture:** ResNet50
- **Dataset:** APTOS 2019 Blindness Detection
- **Input Size:** 224x224 RGB
- **Output Classes:** 5 (No DR, Mild, Moderate, Severe, Proliferative)
- **Framework:** PyTorch

## 📝 Notes

- The model file is ~100MB and stored via Git LFS
- First run will take longer as the model loads into memory
- GPU acceleration is automatic if CUDA is available
- Heatmaps show which areas the model focused on for predictions

## ⚠️ Medical Disclaimer

This tool is for **educational and research purposes only**. It should not be used as a substitute for professional medical diagnosis. Always consult qualified healthcare professionals for medical advice.

## 🐛 Troubleshooting

**Model not loading:**
- Ensure the model file exists at `ResNet50-APTOS-DR/diabetic_retinopathy_full_model.pth`
- Run `python setup.py` to download the model

**API connection error:**
- Make sure the backend is running on port 8000
- Check firewall settings

**CUDA errors:**
- The system will automatically fall back to CPU if CUDA is unavailable
- No action needed

## 📄 License

This project uses the APTOS 2019 dataset and ResNet50 architecture.
