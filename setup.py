import os
import subprocess
import requests
from PIL import Image

# --- CONFIGURATION ---
REPO_URL = "https://huggingface.co/sakshamkr1/ResNet50-APTOS-DR"
REPO_DIR = "ResNet50-APTOS-DR"
IMAGE_URL = "https://upload.wikimedia.org/wikipedia/commons/thumb/0/08/Fundus_photograph_of_normal_left_eye.jpg/800px-Fundus_photograph_of_normal_left_eye.jpg"
IMAGE_FILENAME = "test_eye.png"

def setup_project():
    print("🚀 Starting Bulletproof Setup...")

    # 1. DOWNLOAD MODEL (Using System Git)
    if os.path.exists(REPO_DIR):
        print(f"📂 Folder '{REPO_DIR}' exists. Skipping clone.")
    else:
        print("⬇️  Cloning Model Repository...")
        try:
            subprocess.run(["git", "clone", REPO_URL], check=True)
            print("✅ Repo cloned.")
        except:
            print("❌ Git Clone failed. Please check your internet.")
            return

    # 2. FORCE LFS PULL (The Critical Fix)
    print("🔧 Pulling Heavy Model Files (Git LFS)...")
    try:
        subprocess.run(["git", "lfs", "install"], cwd=REPO_DIR, check=True)
        subprocess.run(["git", "lfs", "pull"], cwd=REPO_DIR, check=True)
        print("✅ Model files updated.")
    except Exception as e:
        print(f"⚠️ LFS Warning: {e}")
        print("   (If inference fails later, run 'sudo apt install git-lfs' in terminal)")

    # 3. DOWNLOAD TEST IMAGE (With Anti-Bot Headers)
    print("⬇️  Downloading Test Image...")
    headers = {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
    }
    
    try:
        response = requests.get(IMAGE_URL, headers=headers, timeout=10)
        if response.status_code == 200:
            with open(IMAGE_FILENAME, 'wb') as f:
                f.write(response.content)
            print(f"✅ Downloaded real retina image: {IMAGE_FILENAME}")
        else:
            raise Exception(f"Status {response.status_code}")
            
    except Exception as e:
        print(f"⚠️ Could not download real image ({e}).")
        print("   Creating a DUMMY black image so your code doesn't crash.")
        # Create a black dummy image (224x224)
        img = Image.new('RGB', (224, 224), color = (0, 0, 0))
        img.save(IMAGE_FILENAME)
        print(f"✅ Created dummy {IMAGE_FILENAME}. (PLEASE REPLACE WITH REAL IMAGE LATER)")

    print("\n🎉 Setup Done! Run 'python dr_inference.py' now.")

if __name__ == "__main__":
    setup_project()