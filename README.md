# 🔗👁️ VisionChain - Blockchain-Powered Medical Verification

**Cardano Asia Hackathon 2025 - IBW Edition**

VisionChain is a revolutionary platform that combines AI-powered diabetic retinopathy detection with Cardano blockchain verification and a token-based reward system. Built for the Cardano Asia Hackathon, VisionChain demonstrates how blockchain technology can bring transparency, trust, and incentivization to healthcare.

## 🌟 What Makes VisionChain Special

### The Problem
- ❌ Medical diagnoses lack transparent audit trails
- ❌ Centralized systems vulnerable to tampering
- ❌ No incentives for quality medical data contribution
- ❌ Patients can't independently verify their records

### Our Solution
- ✅ **AI-Powered Analysis** - ResNet50 deep learning for diabetic retinopathy detection
- ✅ **Blockchain Verification** - Immutable diagnosis records on Cardano
- ✅ **VISION Token Rewards** - Earn tokens for verified diagnoses
- ✅ **Decentralized Trust** - Transparent, verifiable medical records

## 🏗️ Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                     VisionChain Platform                     │
├─────────────────────────────────────────────────────────────┤
│                                                               │
│  Frontend (Streamlit)          Backend (FastAPI)             │
│  ┌──────────────────┐         ┌──────────────────┐          │
│  │ • Image Upload   │────────▶│ • AI Model       │          │
│  │ • Wallet Connect │         │ • Blockchain API │          │
│  │ • Rewards UI     │◀────────│ • Verification   │          │
│  └──────────────────┘         └──────────────────┘          │
│           │                            │                     │
│           │                            ▼                     │
│           │                   ┌──────────────────┐          │
│           │                   │ Blockchain       │          │
│           │                   │ Service          │          │
│           │                   └──────────────────┘          │
│           │                            │                     │
│           └────────────────────────────┼─────────────────────┤
│                                        ▼                     │
│                        Cardano Preprod Testnet               │
│                        ┌──────────────────────┐             │
│                        │ Smart Contracts      │             │
│                        │ • Verification.ak    │             │
│                        │ • Reward.ak          │             │
│                        │ • VISION Tokens      │             │
│                        └──────────────────────┘             │
└─────────────────────────────────────────────────────────────┘
```

## 📋 Project Structure

```
visionchain/
├── backend/                    # FastAPI backend
│   ├── main.py                # Main API server with blockchain endpoints
│   ├── blockchain_service.py  # Cardano blockchain integration
│   ├── database.py            # Supabase database models
│   ├── requirements.txt       # Python dependencies
│   ├── .env.example          # Environment configuration template
│   ├── uploads/              # Uploaded images (auto-created)
│   └── heatmaps/             # Generated heatmaps (auto-created)
├── frontend/                   # Streamlit interface
│   ├── app.py                 # Streamlit app
│   └── requirements.txt       # Frontend dependencies
├── contracts/                  # Aiken smart contracts
│   ├── validators/
│   │   ├── verification.ak    # Verification contract
│   │   └── reward.ak         # Reward minting policy
│   ├── plutus.json           # Compiled contracts
│   └── aiken.toml            # Aiken configuration
├── ResNet50-APTOS-DR/         # AI Model directory
│   └── diabetic_retinopathy_full_model.pth
└── README.md                  # This file
```

## 🚀 Quick Start

### Prerequisites

- Python 3.8+
- Node.js 18+ (for wallet integration)
- Cardano wallet (Nami or Eternl)
- Blockfrost API key (free at blockfrost.io)

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

### 2️⃣ Configure Environment

```bash
cd backend
cp .env.example .env
# Edit .env and add your Blockfrost API key
```

**Get Blockfrost API Key:**
1. Go to https://blockfrost.io/
2. Sign up for free account
3. Create new project for "Cardano Preprod"
4. Copy project ID to `.env`

### 3️⃣ Set Up Wallet

1. Install [Nami](https://namiwallet.io/) or [Eternl](https://eternl.io/) browser extension
2. Create wallet or import existing
3. Switch to **Preprod Testnet** in wallet settings
4. Get free test ADA from [Cardano Faucet](https://docs.cardano.org/cardano-testnet/tools/faucet/)

### 4️⃣ Start the Backend API

```bash
cd backend
python main.py
```

The API will start on `http://localhost:8000`

### 5️⃣ Launch the Frontend

In a new terminal:

```bash
cd frontend
streamlit run app.py
```

The interface will open in your browser at `http://localhost:8501`

## 🔌 API Endpoints

### Core DR Detection

- `GET /health` - API health check
- `GET /classes` - Get disease classes
- `POST /predict` - Upload image for DR detection
- `GET /heatmap/{filename}` - Download GradCAM heatmap

### VisionChain Blockchain

- `POST /blockchain/verify` - Submit diagnosis to blockchain
- `GET /blockchain/history/{wallet}` - Get verification history
- `POST /blockchain/claim-reward` - Claim VISION tokens
- `GET /blockchain/balance/{wallet}` - Check token balance
- `GET /blockchain/contracts` - Get contract addresses
- `GET /blockchain/reward-tiers` - Get reward tier information

## 💰 VISION Token Rewards

VisionChain rewards users with VISION tokens based on diagnosis quality:

| Tier | Confidence | Reward | Description |
|------|-----------|--------|-------------|
| 🥉 **Low** | 0-69% | 25 VISION | Basic verification |
| 🥈 **Medium** | 70-89% | 50 VISION | Good confidence |
| 🥇 **High** | 90-100% | 100 VISION | Excellent confidence |
| ⭐ **Professional** | Any | +50 VISION | Medical professional bonus |

**Maximum reward:** 150 VISION tokens per verification

## 🔬 Smart Contracts

### Verification Contract (`verification.ak`)

Stores immutable medical diagnosis records on Cardano blockchain:

- **Image Hash** - SHA-256 hash of retinal image
- **Diagnosis** - DR severity (0-4)
- **Confidence** - AI confidence score (0-100)
- **Timestamp** - Verification time
- **Verifier** - Wallet address of verifier
- **Patient** - Optional patient wallet address
- **Verification ID** - Unique identifier

### Reward Contract (`reward.ak`)

Mints and distributes VISION tokens:

- **Tiered Rewards** - Based on confidence levels
- **Professional Bonus** - Extra tokens for verified professionals
- **Burn Mechanism** - Token burning capability
- **Anti-Double-Claim** - Prevents reward duplication

## 📊 Disease Classes

| Class | Description | Severity |
|-------|-------------|----------|
| **No DR** | No Diabetic Retinopathy | 🟢 None |
| **Mild** | Mild Non-Proliferative DR | 🟡 Low |
| **Moderate** | Moderate Non-Proliferative DR | 🟠 Medium |
| **Severe** | Severe Non-Proliferative DR | 🔴 High |
| **Proliferative** | Proliferative DR | ⚫ Critical |

## 🔥 Key Features

### AI & Medical
- ✅ **ResNet50 Model** - State-of-the-art deep learning
- ✅ **GradCAM Heatmaps** - Visual explanation of predictions
- ✅ **Image Validation** - Automatic retinal image verification
- ✅ **Multi-class Classification** - 5 disease stages
- ✅ **Confidence Scores** - Probability for each class

### Blockchain & Web3
- ✅ **Cardano Integration** - Built on Cardano blockchain
- ✅ **Aiken Smart Contracts** - Plutus V3 validators
- ✅ **Wallet Support** - Nami, Eternl compatible
- ✅ **Testnet Ready** - Full Preprod testnet support
- ✅ **IPFS Anchoring** - Decentralized storage option

### Platform
- ✅ **FastAPI Backend** - High-performance REST API
- ✅ **Streamlit Interface** - User-friendly web UI
- ✅ **CORS Enabled** - Ready for frontend integration
- ✅ **GPU Support** - Automatic CUDA detection
- ✅ **Supabase Integration** - Optional data persistence

## 🎯 Workflows

### 1. AI + Blockchain Verification Workflow
```
User uploads image → AI analyzes → Generates diagnosis → 
Creates blockchain transaction → Submits to smart contract → 
Returns verification hash → Displays to user
```

### 2. Reward Distribution Workflow
```
Diagnosis verified → Calculates reward tier → 
Checks if already claimed → Mints VISION tokens → 
Transfers to user wallet → Updates on-chain record
```

### 3. Complete User Journey
```
Connect wallet → Upload retinal image → 
AI processes image → View diagnosis + confidence → 
Submit to blockchain → Receive verification → 
Claim VISION rewards → View history
```

## 🧪 Testing

### Test with Sample Image

```bash
# Health check
curl http://localhost:8000/health

# Get reward tiers
curl http://localhost:8000/blockchain/reward-tiers

# Predict (replace with your image path)
curl -X POST -F "file=@test_eye.png" http://localhost:8000/predict

# Get contract info
curl http://localhost:8000/blockchain/contracts
```

### Test Blockchain Integration

```python
import requests

# Submit verification to blockchain
data = {
    "screening_id": "SCR-TEST-001",
    "image_path": "uploads/test_eye.png",
    "diagnosis": 0,
    "confidence": 95,
    "verifier_address": "addr_test1..."
}
response = requests.post('http://localhost:8000/blockchain/verify', data=data)
print(response.json())

# Check balance
wallet = "addr_test1..."
response = requests.get(f'http://localhost:8000/blockchain/balance/{wallet}')
print(response.json())
```

## 🛠️ Model Information

- **Architecture:** ResNet50
- **Dataset:** APTOS 2019 Blindness Detection
- **Input Size:** 224x224 RGB
- **Output Classes:** 5 (No DR, Mild, Moderate, Severe, Proliferative)
- **Framework:** PyTorch
- **Model Size:** ~100MB

## 🌐 Blockchain Details

- **Network:** Cardano Preprod Testnet
- **Smart Contract Language:** Aiken (Plutus V3)
- **Blockchain API:** Blockfrost
- **Python SDK:** PyCardano
- **Explorer:** https://preprod.cardanoscan.io/

## ⚠️ Medical Disclaimer

This tool is for **educational and research purposes only**. It should not be used as a substitute for professional medical diagnosis. Always consult qualified healthcare professionals for medical advice.

## 🏆 Hackathon Highlights

**Built for Cardano Asia Hackathon 2025 - IBW Edition**

- 🎯 **Real-world Use Case** - Healthcare verification
- 🔗 **Full Blockchain Integration** - Smart contracts + tokens
- 🤖 **AI-Powered** - Deep learning model
- 💎 **Complete Solution** - End-to-end platform
- 🚀 **Production-Ready** - Scalable architecture

## 🐛 Troubleshooting

**Model not loading:**
- Ensure the model file exists at `ResNet50-APTOS-DR/diabetic_retinopathy_full_model.pth`
- Run `python setup.py` to download the model

**Blockchain connection error:**
- Check your Blockfrost API key in `.env`
- Verify you're using Preprod testnet key
- Check network connectivity

**Wallet not connecting:**
- Ensure wallet extension is installed
- Switch wallet to Preprod testnet
- Refresh the page

**No test ADA:**
- Visit https://docs.cardano.org/cardano-testnet/tools/faucet/
- Enter your Preprod testnet address
- Wait a few minutes for funds

## 📄 License

This project uses the APTOS 2019 dataset and ResNet50 architecture. Built with Cardano blockchain technology.

## 🙏 Acknowledgments

- **EMURGO** - For hosting Cardano Asia Hackathon
- **Cardano Foundation** - For blockchain infrastructure
- **Aiken Team** - For smart contract language
- **APTOS** - For diabetic retinopathy dataset

---

**Built with ❤️ for Cardano Asia Hackathon 2025**

*VisionChain - Bringing transparency and trust to healthcare through blockchain*
