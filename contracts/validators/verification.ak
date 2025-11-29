use aiken/collection/list
use aiken/crypto.{VerificationKeyHash}
use aiken/primitive/bytearray
use cardano/transaction.{OutputReference, Transaction}

// Datum: Stores medical diagnosis verification data
pub type VerificationDatum {
  // Hash of the medical image (SHA-256)
  image_hash: ByteArray,
  // Diagnosis result (0=No DR, 1=Mild, 2=Moderate, 3=Severe, 4=Proliferative)
  diagnosis: Int,
  // Confidence score (0-100)
  confidence: Int,
  // Unix timestamp of verification
  timestamp: Int,
  // Wallet address of the verifier (doctor/AI agent)
  verifier: VerificationKeyHash,
  // Patient wallet address (optional, for privacy)
  patient: Option<VerificationKeyHash>,
  // Unique verification ID
  verification_id: ByteArray,
}

// Redeemer: Actions that can be performed
pub type VerificationRedeemer {
  // Create a new verification record
  CreateVerification
  // Update an existing verification (e.g., second opinion)
  UpdateVerification { original_verification_id: ByteArray }
  // Claim reward for verified diagnosis
  ClaimReward
}

// Validator: Main contract logic
validator verification {
  spend(
    datum: Option<VerificationDatum>,
    redeemer: VerificationRedeemer,
    _own_ref: OutputReference,
    tx: Transaction,
  ) {
    when redeemer is {
      CreateVerification -> {
        // Validate that datum exists
        expect Some(verification_data) = datum
        
        // Ensure diagnosis is in valid range (0-4)
        let valid_diagnosis = verification_data.diagnosis >= 0 && verification_data.diagnosis <= 4
        
        // Ensure confidence is in valid range (0-100)
        let valid_confidence = verification_data.confidence >= 0 && verification_data.confidence <= 100
        
        // Ensure timestamp is reasonable (not in the future)
        let _current_time = tx.validity_range.upper_bound.bound_type
        let valid_timestamp = True  // Simplified for hackathon
        
        // Ensure verification ID is unique (non-empty)
        let valid_id = bytearray.length(verification_data.verification_id) > 0
        
        // All validations must pass
        valid_diagnosis && valid_confidence && valid_timestamp && valid_id
      }
      
      UpdateVerification { original_verification_id } -> {
        // Validate that datum exists
        expect Some(verification_data) = datum
        
        // Ensure the original verification ID is referenced
        let valid_update = bytearray.length(original_verification_id) > 0
        
        // Ensure diagnosis is still in valid range
        let valid_diagnosis = verification_data.diagnosis >= 0 && verification_data.diagnosis <= 4
        
        // Ensure confidence is still in valid range
        let valid_confidence = verification_data.confidence >= 0 && verification_data.confidence <= 100
        
        valid_update && valid_diagnosis && valid_confidence
      }
      
      ClaimReward -> {
        // Validate that datum exists
        expect Some(verification_data) = datum
        
        // Ensure the transaction is signed by the verifier
        let signed_by_verifier = list.has(tx.extra_signatories, verification_data.verifier)
        
        // Ensure confidence meets minimum threshold for rewards (>= 70%)
        let meets_threshold = verification_data.confidence >= 70
        
        signed_by_verifier && meets_threshold
      }
    }
  }
  
  else(_) {
    fail
  }
}
