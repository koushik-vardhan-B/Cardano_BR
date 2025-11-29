use aiken/collection/list
use aiken/crypto.{VerificationKeyHash}
use aiken/primitive/bytearray
use cardano/assets.{PolicyId}
use cardano/transaction.{Transaction}

// Redeemer for minting policy
pub type RewardRedeemer {
  // Mint VISION tokens for verified diagnosis
  MintReward {
    // Verification ID that earned the reward
    verification_id: ByteArray,
    // Recipient wallet address
    recipient: VerificationKeyHash,
    // Amount to mint based on confidence tier
    amount: Int,
  }
  // Burn tokens (for future use)
  BurnReward { amount: Int }
}

// Minting policy for VISION tokens
validator reward_policy {
  mint(redeemer: RewardRedeemer, _policy_id: PolicyId, tx: Transaction) {
    when redeemer is {
      MintReward { verification_id, recipient, amount } -> {
        // Ensure verification ID is valid
        let valid_verification = bytearray.length(verification_id) > 0
        
        // Ensure amount is positive and within reasonable limits
        // Tier 1: 25 VISION (confidence < 70%)
        // Tier 2: 50 VISION (confidence 70-90%)
        // Tier 3: 100 VISION (confidence > 90%)
        // Bonus: +50 VISION (verified by medical professional)
        let valid_amount = amount > 0 && amount <= 150
        
        // Ensure transaction is signed by authorized minter
        // For hackathon: simplified - in production, would check specific authority
        let has_signatories = list.length(tx.extra_signatories) > 0
        
        // Ensure the minted tokens go to the correct recipient
        // This would be validated by checking outputs in production
        let valid_recipient = True  // Simplified for hackathon
        
        valid_verification && valid_amount && has_signatories && valid_recipient
      }
      
      BurnReward { amount } -> {
        // Ensure burn amount is positive
        let valid_burn = amount > 0
        
        // Ensure transaction is signed
        let has_signatories = list.length(tx.extra_signatories) > 0
        
        valid_burn && has_signatories
      }
    }
  }
  
  else(_) {
    fail
  }
}

// Helper function to calculate reward amount based on confidence
pub fn calculate_reward(confidence: Int, is_professional: Bool) -> Int {
  let base_reward = if confidence >= 90 {
    100
  } else if confidence >= 70 {
    50
  } else {
    25
  }
  
  let bonus = if is_professional {
    50
  } else {
    0
  }
  
  base_reward + bonus
}
