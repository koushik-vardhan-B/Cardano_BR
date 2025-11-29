# API Request/Response Schemas
# Pydantic schemas for API endpoints

from typing import Optional, List
from pydantic import BaseModel

# ============================================================================
# PREDICTION SCHEMAS
# ============================================================================

class PredictResponse(BaseModel):
    """Response from /predict endpoint"""
    screeningId: str
    patientId: str
    diagnosis: str  # DR diagnosis
    riskScore: str  # Combined risk score string
    confidence: float
    explanation: str
    class_probabilities: dict
    prediction_index: int
    heatmap_available: bool
    heatmap_filename: Optional[str]
    validation_message: str
    dbId: Optional[str] = None

# ============================================================================
# BLOCKCHAIN SCHEMAS
# ============================================================================

class StoreOnChainRequest(BaseModel):
    """Request to anchor screening on blockchain"""
    screeningId: str
    patientId: str
    riskScore: str

class StoreOnChainResponse(BaseModel):
    """Response from blockchain anchoring"""
    screeningId: str
    patientId: str
    txHash: str
    did: str
    reportHash: str
    cardanoRef: str

class RetryAnchorRequest(BaseModel):
    """Request to retry failed anchoring"""
    screeningId: str

# ============================================================================
# CHAT SCHEMAS
# ============================================================================

class ChatMessage(BaseModel):
    """Single chat message"""
    role: str  # "user" or "assistant"
    content: str

class ChatRequest(BaseModel):
    """Request to chat endpoint"""
    messages: List[ChatMessage]

class ChatResponse(BaseModel):
    """Response from chat endpoint"""
    reply: str

# ============================================================================
# HEALTH & STATUS SCHEMAS
# ============================================================================

class HealthResponse(BaseModel):
    """Health check response"""
    status: str
    device: str
    model_loaded: bool
    cuda_available: bool
    blockfrost: dict
    supabase: bool
    groq: bool

# ============================================================================
# ANALYTICS SCHEMAS
# ============================================================================

class TodayStatsResponse(BaseModel):
    """Today's statistics"""
    countToday: int
    highRiskPercent: float

class RecentScreening(BaseModel):
    """Recent screening summary"""
    patientId: str
    riskLabel: str
    createdAt: str

class DailyTrendItem(BaseModel):
    """Daily trend data point"""
    date: str
    count: int

class RewardInfo(BaseModel):
    """Reward information"""
    perScreeningAda: float
    totalAda: float
    daily: List[dict]

class AnalyticsSummaryResponse(BaseModel):
    """Comprehensive analytics"""
    riskDistribution: dict
    dailyTrend: List[DailyTrendItem]
    reward: RewardInfo
