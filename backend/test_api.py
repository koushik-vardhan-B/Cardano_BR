"""
Simple test script to verify the API is working correctly
"""
import requests
import sys
import os

API_URL = "http://localhost:8000"

def test_health():
    """Test health endpoint"""
    print("🔍 Testing health endpoint...")
    try:
        response = requests.get(f"{API_URL}/health", timeout=5)
        if response.status_code == 200:
            data = response.json()
            print(f"✅ Health check passed")
            print(f"   Status: {data['status']}")
            print(f"   Device: {data['device']}")
            print(f"   Model loaded: {data['model_loaded']}")
            print(f"   CUDA available: {data['cuda_available']}")
            return True
        else:
            print(f"❌ Health check failed: {response.status_code}")
            return False
    except Exception as e:
        print(f"❌ Cannot connect to API: {e}")
        print("\n💡 Make sure to start the backend first:")
        print("   cd backend && python main.py")
        return False


def test_classes():
    """Test classes endpoint"""
    print("\n🔍 Testing classes endpoint...")
    try:
        response = requests.get(f"{API_URL}/classes", timeout=5)
        if response.status_code == 200:
            data = response.json()
            print(f"✅ Classes endpoint working")
            print(f"   Number of classes: {data['num_classes']}")
            print(f"   Classes: {', '.join(data['classes'])}")
            return True
        else:
            print(f"❌ Classes endpoint failed: {response.status_code}")
            return False
    except Exception as e:
        print(f"❌ Error: {e}")
        return False


def test_predict(image_path):
    """Test prediction endpoint"""
    print(f"\n🔍 Testing prediction with image: {image_path}")
    
    if not os.path.exists(image_path):
        print(f"❌ Image not found: {image_path}")
        return False
    
    try:
        with open(image_path, 'rb') as f:
            files = {'file': (os.path.basename(image_path), f, 'image/png')}
            response = requests.post(f"{API_URL}/predict", files=files, timeout=30)
        
        if response.status_code == 200:
            data = response.json()
            print(f"✅ Prediction successful")
            print(f"   Diagnosis: {data['diagnosis']}")
            print(f"   Confidence: {data['confidence']}%")
            print(f"   Heatmap available: {data['heatmap_available']}")
            
            print("\n   Class Probabilities:")
            for class_name, prob in data['class_probabilities'].items():
                print(f"      {class_name}: {prob}%")
            
            # Test heatmap download
            if data['heatmap_available']:
                print(f"\n🔍 Testing heatmap download...")
                heatmap_response = requests.get(
                    f"{API_URL}/heatmap/{data['heatmap_filename']}", 
                    timeout=10
                )
                if heatmap_response.status_code == 200:
                    print(f"✅ Heatmap downloaded successfully")
                    # Save heatmap
                    with open('test_heatmap.jpg', 'wb') as f:
                        f.write(heatmap_response.content)
                    print(f"   Saved to: test_heatmap.jpg")
                else:
                    print(f"❌ Heatmap download failed: {heatmap_response.status_code}")
            
            return True
        else:
            print(f"❌ Prediction failed: {response.status_code}")
            print(f"   Error: {response.json().get('detail', 'Unknown error')}")
            return False
    except Exception as e:
        print(f"❌ Error: {e}")
        return False


def main():
    """Run all tests"""
    print("=" * 60)
    print("🧪 Diabetic Retinopathy API Test Suite")
    print("=" * 60)
    
    # Test health
    if not test_health():
        sys.exit(1)
    
    # Test classes
    if not test_classes():
        sys.exit(1)
    
    # Test prediction
    test_image = "../test_eye.png"
    if len(sys.argv) > 1:
        test_image = sys.argv[1]
    
    if not test_predict(test_image):
        sys.exit(1)
    
    print("\n" + "=" * 60)
    print("✅ All tests passed!")
    print("=" * 60)


if __name__ == "__main__":
    main()
