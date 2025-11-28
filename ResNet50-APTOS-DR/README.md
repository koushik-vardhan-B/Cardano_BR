---
license: cc-by-nc-4.0
datasets:
- aptos2019-blindness-detection
language:
- en
tags:
- diabetic-retinopathy
- resnet50
- deep-learning
- medical-imaging
- transformer
base_model:
- microsoft/resnet-50
pipeline_tag: image-classification
---

# Diabetic Retinopathy Detection Model ![LICENSE](https://img.shields.io/badge/CC--BY--SA--4.0-lightgrey?style=for-the-badge) ![PyTorch](https://img.shields.io/badge/PyTorch-EE4C2C?style=for-the-badge&logo=pytorch&logoColor=white)

## Overview

This model is a deep learning-based classifier designed to detect and classify diabetic retinopathy (DR) from retinal fundus images. It is built on the ResNet50 architecture and trained on the **APTOS 2019 Blindness Detection dataset**, which includes five DR severity classes:

- **0**: No DR  
- **1**: Mild DR  
- **2**: Moderate DR  
- **3**: Severe DR  
- **4**: Proliferative DR  

The model aims to assist in early diagnosis and grading of diabetic retinopathy, reducing the workload for ophthalmologists and improving accessibility to screening.

## Usage
You can use this model by cloning the repository and using the pickled model by <i>torch.load()</i>.

### Dependencies Installation
Ensure you have the required dependencies installed:
```bash
pip install torch torchvision transformers opencv-python pandas
```

### Loading the Model

Clone the repository (with GIT LFS enabled)
```bash
git lfs install

git clone https://huggingface.co/sakshamkr1/ResNet50-APTOS-DR
```

Load the Model
```python
import torch
from PIL import Image

model = torch.load(model_path, map_location=torch.device('gpu'), weights_only=False) #Change torch.device to 'cpu' if using CPU
model.eval()
```

### Transformer Application
```python
from torchvision import transforms

transform = transforms.Compose([
    transforms.Resize((224, 224)),  # Resize image to match input size
    transforms.ToTensor(),  # Convert image to tensor
    transforms.Normalize(mean=[0.485, 0.456, 0.406], std=[0.229, 0.224, 0.225])  # Normalize using ImageNet stats
])
```

### Function to preprocess image and get predictions
```python
import numpy as np

def predict(image_path):
    # Load and preprocess the input image
    image = Image.open(image_path).convert('RGB')  # Ensure RGB format
    input_tensor = transform(image).unsqueeze(0).to(device)  # Add batch dimension

    # Perform inference
    with torch.no_grad():
        outputs = model(input_tensor)  # Forward pass
        probabilities = torch.nn.functional.softmax(outputs, dim=1)  # Get class probabilities
    
    return probabilities.cpu().numpy()[0]  # Return probabilities as a NumPy array

# Test with an example image
image_path = "your_image_path"  # Replace with your test image path
class_probs = predict(image_path)

# Print results
print(f"Class probabilities: {class_probs}")
predicted_class = np.argmax(class_probs)  # Get the class with highest probability
print(f"Predicted class: {predicted_class}")
```

## License
This model is released under the **CC-BY-NC 4.0** license.