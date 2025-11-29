# Database Models
# SQLAlchemy-style models for reference (Supabase uses PostgreSQL)

from typing import Optional
from datetime import datetime
from pydantic import BaseModel

# These are Pydantic models for data validation
# The actual database tables are created in Supabase via SQL

class User(BaseModel):
    """User/Operator model"""
    id: str
    display_name: str
    created_at: Optional[datetime] = None

class Screening(BaseModel):
    """Diabetic Retinopathy Screening model"""
    id: Optional[str] = None  # UUID from Supabase
    screening_id: str  # Human-readable ID like SCR-XXXX
    patient_id: str
    risk_score_label: str  # "Low", "Medium", "High", "No DR", "Mild", etc.
    risk_score_numeric: int  # 0-100
    confidence: float
    explanation: str
    operator_user_id: str
    operator_name: str
    
    # Blockchain fields
    anchor_status: Optional[str] = "pending"
    anchor_attempts: Optional[int] = 0
    tx_hash: Optional[str] = None
    did: Optional[str] = None
    report_hash: Optional[str] = None
    cardano_ref: Optional[str] = None
    last_anchor_error: Optional[str] = None
    
    created_at: Optional[datetime] = None
    updated_at: Optional[datetime] = None

class AnchorLog(BaseModel):
    """Blockchain anchoring attempt log"""
    id: Optional[str] = None
    screening_id: str  # UUID reference to screening
    status: str  # "anchored", "failed"
    error_text: Optional[str] = None
    response_body: Optional[dict] = None
    attempt_at: Optional[datetime] = None
