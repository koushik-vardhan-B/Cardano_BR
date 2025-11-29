"""
VisionChain Blockchain Service
Handles all Cardano blockchain interactions for medical verification and rewards
"""

import os
import json
import hashlib
from datetime import datetime
from typing import Optional, Dict, List
from pathlib import Path

from pycardano import (
    Network,
    BlockFrostChainContext,
    PaymentSigningKey,
    PaymentVerificationKey,
    Address,
    TransactionBuilder,
    TransactionOutput,
    Value,
    PlutusV2Script,
    plutus_script_hash,
    Redeemer,
    PlutusData,
    Unit,
)
from blockfrost import BlockFrostApi, ApiError


class VisionChainConfig:
    """Configuration for VisionChain blockchain integration"""
    
    # Network configuration
    NETWORK = Network.TESTNET  # Using Preprod testnet
    
    # Blockfrost API configuration
    BLOCKFROST_PROJECT_ID = os.getenv("BLOCKFROST_PROJECT_ID", "preprodYourProjectIdHere")
    
    # Contract paths
    CONTRACTS_DIR = Path(__file__).parent.parent / "contracts"
    PLUTUS_BLUEPRINT = CONTRACTS_DIR / "plutus.json"
    
    # Reward tiers (in VISION tokens)
    REWARD_TIER_LOW = 25      # Confidence < 70%
    REWARD_TIER_MEDIUM = 50   # Confidence 70-90%
    REWARD_TIER_HIGH = 100    # Confidence > 90%
    REWARD_PROFESSIONAL_BONUS = 50  # Additional for professional verification


class VerificationDatum(PlutusData):
    """
    Datum structure for verification smart contract
    Matches the Aiken contract definition
    """
    CONSTR_ID = 0
    
    image_hash: bytes
    diagnosis: int
    confidence: int
    timestamp: int
    verifier: bytes
    patient: Optional[bytes]
    verification_id: bytes


class BlockchainService:
    """Service for interacting with Cardano blockchain"""
    
    def __init__(self):
        """Initialize blockchain service with Blockfrost"""
        self.config = VisionChainConfig()
        
        # Initialize Blockfrost API
        try:
            self.blockfrost = BlockFrostApi(
                project_id=self.config.BLOCKFROST_PROJECT_ID,
                base_url="https://cardano-preprod.blockfrost.io/api"
            )
            print("✅ Blockfrost API initialized")
        except Exception as e:
            print(f"⚠️  Blockfrost initialization warning: {e}")
            self.blockfrost = None
        
        # Chain context - optional for demo mode
        self.context = None
        try:
            # Only initialize if we need real transactions
            # For hackathon demo, we'll use simulated transactions
            pass
        except Exception as e:
            print(f"⚠️  Chain context initialization skipped (demo mode): {e}")
        
        # Load smart contracts
        self.verification_script = None
        self.reward_policy = None
        self._load_contracts()
    
    def _load_contracts(self):
        """Load compiled smart contracts from plutus.json"""
        try:
            with open(self.config.PLUTUS_BLUEPRINT, 'r') as f:
                blueprint = json.load(f)
            
            # Extract validators from blueprint
            validators = blueprint.get('validators', [])
            
            for validator in validators:
                title = validator.get('title', '')
                compiled_code = validator.get('compiledCode', '')
                
                if 'verification' in title.lower():
                    self.verification_script = PlutusV2Script(bytes.fromhex(compiled_code))
                elif 'reward' in title.lower():
                    self.reward_policy = PlutusV2Script(bytes.fromhex(compiled_code))
            
            print("✅ Smart contracts loaded successfully")
            
        except Exception as e:
            print(f"⚠️  Warning: Could not load smart contracts: {e}")
            print("   Blockchain features will be limited")
    
    def calculate_image_hash(self, image_path: str) -> str:
        """Calculate SHA-256 hash of medical image"""
        sha256_hash = hashlib.sha256()
        
        with open(image_path, "rb") as f:
            # Read file in chunks for large images
            for byte_block in iter(lambda: f.read(4096), b""):
                sha256_hash.update(byte_block)
        
        return sha256_hash.hexdigest()
    
    def calculate_reward_amount(self, confidence: int, is_professional: bool = False) -> int:
        """Calculate reward amount based on confidence tier"""
        if confidence >= 90:
            base_reward = self.config.REWARD_TIER_HIGH
        elif confidence >= 70:
            base_reward = self.config.REWARD_TIER_MEDIUM
        else:
            base_reward = self.config.REWARD_TIER_LOW
        
        bonus = self.config.REWARD_PROFESSIONAL_BONUS if is_professional else 0
        
        return base_reward + bonus
    
    def create_verification_datum(
        self,
        image_path: str,
        diagnosis: int,
        confidence: int,
        verifier_address: str,
        patient_address: Optional[str] = None
    ) -> Dict:
        """
        Create verification datum for blockchain submission
        
        Args:
            image_path: Path to the medical image
            diagnosis: Diagnosis result (0-4)
            confidence: Confidence score (0-100)
            verifier_address: Wallet address of verifier
            patient_address: Optional patient wallet address
        
        Returns:
            Dictionary containing verification data
        """
        # Calculate image hash
        image_hash = self.calculate_image_hash(image_path)
        
        # Generate unique verification ID
        verification_id = hashlib.sha256(
            f"{image_hash}{diagnosis}{confidence}{datetime.now().isoformat()}".encode()
        ).hexdigest()
        
        # Create datum
        datum_dict = {
            "image_hash": image_hash,
            "diagnosis": diagnosis,
            "confidence": confidence,
            "timestamp": int(datetime.now().timestamp()),
            "verifier": verifier_address,
            "patient": patient_address,
            "verification_id": verification_id
        }
        
        return datum_dict
    
    async def submit_verification(
        self,
        image_path: str,
        diagnosis: int,
        confidence: int,
        verifier_address: str,
        patient_address: Optional[str] = None
    ) -> Dict:
        """
        Submit medical verification to blockchain
        
        Returns:
            Transaction details including tx_hash and verification_id
        """
        try:
            # Create verification datum
            datum = self.create_verification_datum(
                image_path,
                diagnosis,
                confidence,
                verifier_address,
                patient_address
            )
            
            # For hackathon demo: Return simulated transaction
            # In production, this would build and submit actual transaction
            tx_hash = hashlib.sha256(
                f"{datum['verification_id']}{datetime.now().isoformat()}".encode()
            ).hexdigest()
            
            return {
                "success": True,
                "tx_hash": tx_hash,
                "verification_id": datum["verification_id"],
                "image_hash": datum["image_hash"],
                "timestamp": datum["timestamp"],
                "explorer_url": f"https://preprod.cardanoscan.io/transaction/{tx_hash}",
                "message": "Verification submitted to blockchain (Demo mode)"
            }
            
        except Exception as e:
            return {
                "success": False,
                "error": str(e),
                "message": "Failed to submit verification to blockchain"
            }
    
    async def get_verification_history(self, wallet_address: str) -> List[Dict]:
        """
        Get verification history for a wallet address
        
        Returns:
            List of verification records
        """
        try:
            # For hackathon demo: Return sample data
            # In production, this would query the blockchain
            return [
                {
                    "verification_id": "sample_verification_1",
                    "diagnosis": 0,
                    "confidence": 95,
                    "timestamp": int(datetime.now().timestamp()) - 86400,
                    "tx_hash": "sample_tx_hash_1",
                    "reward_claimed": True
                }
            ]
            
        except Exception as e:
            print(f"Error fetching verification history: {e}")
            return []
    
    async def claim_reward(
        self,
        verification_id: str,
        wallet_address: str
    ) -> Dict:
        """
        Claim VISION token reward for verified diagnosis
        
        Returns:
            Transaction details for reward claim
        """
        try:
            # For hackathon demo: Simulate reward claim
            # In production, this would mint and transfer VISION tokens
            
            # Simulate reward amount (would be fetched from verification record)
            reward_amount = 100  # VISION tokens
            
            tx_hash = hashlib.sha256(
                f"reward_{verification_id}_{datetime.now().isoformat()}".encode()
            ).hexdigest()
            
            return {
                "success": True,
                "tx_hash": tx_hash,
                "verification_id": verification_id,
                "reward_amount": reward_amount,
                "token": "VISION",
                "recipient": wallet_address,
                "explorer_url": f"https://preprod.cardanoscan.io/transaction/{tx_hash}",
                "message": f"Claimed {reward_amount} VISION tokens (Demo mode)"
            }
            
        except Exception as e:
            return {
                "success": False,
                "error": str(e),
                "message": "Failed to claim reward"
            }
    
    async def get_token_balance(self, wallet_address: str) -> Dict:
        """
        Get VISION token balance for a wallet
        
        Returns:
            Token balance information
        """
        try:
            # For hackathon demo: Return sample balance
            # In production, this would query actual token balance
            return {
                "success": True,
                "wallet": wallet_address,
                "vision_balance": 250,
                "ada_balance": 10.5,
                "total_verifications": 3,
                "total_rewards_earned": 250
            }
            
        except Exception as e:
            return {
                "success": False,
                "error": str(e),
                "message": "Failed to fetch token balance"
            }
    
    def get_contract_addresses(self) -> Dict:
        """Get smart contract addresses"""
        addresses = {}
        
        if self.verification_script:
            script_hash = plutus_script_hash(self.verification_script)
            addresses["verification_contract"] = Address(
                script_hash,
                network=self.config.NETWORK
            ).encode()
        
        if self.reward_policy:
            policy_id = plutus_script_hash(self.reward_policy)
            addresses["reward_policy_id"] = policy_id.to_primitive().hex()
        
        return addresses


# Global blockchain service instance
blockchain_service = BlockchainService()
