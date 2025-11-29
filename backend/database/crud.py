# CRUD Operations for Supabase
# Database operations for users, screenings, and anchor logs

from typing import Optional, List
from datetime import datetime, timedelta
from supabase import Client

# ============================================================================
# USER OPERATIONS
# ============================================================================

def upsert_user(supabase: Client, user_id: str, display_name: str) -> bool:
    """
    Ensure user exists in database.
    Uses upsert to create or update user.
    """
    if not supabase or not user_id:
        return False
    
    try:
        data = {
            "id": user_id,
            "display_name": display_name or "Unknown User"
        }
        supabase.table("users").upsert(data).execute()
        return True
    except Exception as e:
        print(f"Error upserting user: {e}")
        return False

# ============================================================================
# SCREENING OPERATIONS
# ============================================================================

def create_screening(
    supabase: Client,
    screening_id: str,
    patient_id: str,
    risk_label: str,
    risk_score: int,
    confidence: float,
    explanation: str,
    operator_id: str,
    operator_name: str
) -> Optional[str]:
    """
    Create new screening record.
    Returns the database UUID if successful.
    """
    if not supabase:
        return None
        
    try:
        # Ensure user exists first
        upsert_user(supabase, operator_id, operator_name)
        
        data = {
            "screening_id": screening_id,
            "patient_id": patient_id,
            "risk_score_label": risk_label,
            "risk_score_numeric": risk_score,
            "confidence": confidence,
            "explanation": explanation,
            "operator_user_id": operator_id,
            "operator_name": operator_name
        }
        
        result = supabase.table("screenings").insert(data).execute()
        if result.data and len(result.data) > 0:
            return result.data[0]['id']
        return None
    except Exception as e:
        print(f"Error creating screening: {e}")
        return None

def get_screening_by_id(supabase: Client, screening_id: str) -> Optional[dict]:
    """Get screening by screening_id"""
    if not supabase:
        return None
        
    try:
        result = supabase.table("screenings").select("*").eq("screening_id", screening_id).execute()
        if result.data and len(result.data) > 0:
            return result.data[0]
        return None
    except Exception as e:
        print(f"Error fetching screening: {e}")
        return None

def update_screening_blockchain(
    supabase: Client,
    screening_id: str,
    tx_hash: str,
    did: str,
    report_hash: str,
    cardano_ref: str,
    anchor_status: str = "anchored"
) -> bool:
    """Update screening with blockchain information"""
    if not supabase:
        return False
        
    try:
        data = {
            "anchor_status": anchor_status,
            "tx_hash": tx_hash,
            "did": did,
            "report_hash": report_hash,
            "cardano_ref": cardano_ref,
            "last_anchor_error": None
        }
        
        supabase.table("screenings").update(data).eq("screening_id", screening_id).execute()
        return True
    except Exception as e:
        print(f"Error updating blockchain info: {e}")
        return False

def update_screening_status(
    supabase: Client,
    screening_id: str,
    anchor_status: str,
    anchor_attempts: Optional[int] = None,
    last_error: Optional[str] = None
) -> bool:
    """Update screening anchor status"""
    if not supabase:
        return False
        
    try:
        data = {"anchor_status": anchor_status}
        
        if anchor_attempts is not None:
            data["anchor_attempts"] = anchor_attempts
        if last_error is not None:
            data["last_anchor_error"] = last_error
            
        supabase.table("screenings").update(data).eq("screening_id", screening_id).execute()
        return True
    except Exception as e:
        print(f"Error updating screening status: {e}")
        return False

def get_recent_screenings(supabase: Client, user_id: str, limit: int = 5) -> List[dict]:
    """Get recent screenings for a user"""
    if not supabase or not user_id:
        return []
        
    try:
        result = supabase.table("screenings") \
            .select("patient_id, risk_score_label, created_at, screening_id") \
            .eq("operator_user_id", user_id) \
            .order("created_at", desc=True) \
            .limit(limit) \
            .execute()
            
        return result.data if result.data else []
    except Exception as e:
        print(f"Error fetching recent screenings: {e}")
        return []

def get_today_stats(supabase: Client, user_id: str) -> dict:
    """Get today's screening statistics for a user"""
    if not supabase or not user_id:
        return {"countToday": 0, "highRiskPercent": 0.0}
        
    try:
        today_start = datetime.utcnow().date().isoformat()
        
        result = supabase.table("screenings") \
            .select("risk_score_label") \
            .eq("operator_user_id", user_id) \
            .gte("created_at", today_start) \
            .execute()
            
        total_today = len(result.data)
        high_risk = sum(1 for s in result.data if s['risk_score_label'] in ['High', 'Severe', 'Proliferative'])
        
        percent = round((high_risk / total_today) * 100, 2) if total_today > 0 else 0.0
        
        return {"countToday": total_today, "highRiskPercent": percent}
    except Exception as e:
        print(f"Error fetching today stats: {e}")
        return {"countToday": 0, "highRiskPercent": 0.0}

def get_analytics_summary(supabase: Client, user_id: str) -> dict:
    """Get comprehensive analytics for dashboard"""
    if not supabase or not user_id:
        return {
            "riskDistribution": {"low": 0, "medium": 0, "high": 0},
            "dailyTrend": [],
            "reward": {"perScreeningAda": 0.04, "totalAda": 0.0, "daily": []}
        }
    
    try:
        # 1. Risk Distribution
        risk_dist = {"low": 0, "medium": 0, "high": 0, "no_dr": 0, "mild": 0, "moderate": 0, "severe": 0, "proliferative": 0}
        risk_res = supabase.table("screenings") \
            .select("risk_score_label") \
            .eq("operator_user_id", user_id) \
            .execute()
            
        for s in risk_res.data:
            label = s["risk_score_label"].lower().replace(" ", "_")
            if label in risk_dist:
                risk_dist[label] += 1
                
        # 2. Daily Trend (Last 7 days)
        today = datetime.utcnow().date()
        dates = [(today - timedelta(days=i)).isoformat() for i in range(6, -1, -1)]
        seven_days_ago = (today - timedelta(days=7)).isoformat()
        
        trend_res = supabase.table("screenings") \
            .select("created_at") \
            .eq("operator_user_id", user_id) \
            .gte("created_at", seven_days_ago) \
            .execute()
            
        date_counts = {d: 0 for d in dates}
        for s in trend_res.data:
            date_str = s["created_at"][:10]
            if date_str in date_counts:
                date_counts[date_str] += 1
                
        daily_trend = [{"date": d, "count": c} for d, c in date_counts.items()]
        
        # 3. Rewards
        REWARD_PER_SCREENING = 0.04
        total_screenings = len(risk_res.data)
        total_ada = round(total_screenings * REWARD_PER_SCREENING, 2)
        
        daily_rewards = [
            {"date": d["date"], "totalAda": round(d["count"] * REWARD_PER_SCREENING, 2)}
            for d in daily_trend
        ]
        
        return {
            "riskDistribution": risk_dist,
            "dailyTrend": daily_trend,
            "reward": {
                "perScreeningAda": REWARD_PER_SCREENING,
                "totalAda": total_ada,
                "daily": daily_rewards
            }
        }
        
    except Exception as e:
        print(f"Error fetching analytics: {e}")
        return {
            "riskDistribution": {"low": 0, "medium": 0, "high": 0},
            "dailyTrend": [],
            "reward": {"perScreeningAda": 0.04, "totalAda": 0.0, "daily": []}
        }

def clear_all_screenings(supabase: Client) -> bool:
    """Clear all screenings (DEMO ONLY)"""
    if not supabase:
        return False
        
    try:
        # Delete all rows (using a condition that matches all rows)
        supabase.table("screenings").delete().neq("id", "00000000-0000-0000-0000-000000000000").execute()
        return True
    except Exception as e:
        print(f"Error clearing screenings: {e}")
        return False

# ============================================================================
# ANCHOR LOG OPERATIONS
# ============================================================================

def create_anchor_log(
    supabase: Client,
    screening_uuid: str,
    status: str,
    error_text: Optional[str] = None,
    response_body: Optional[dict] = None
) -> bool:
    """Create anchor log entry"""
    if not supabase:
        return False
        
    try:
        data = {
            "screening_id": screening_uuid,
            "status": status,
            "error_text": error_text,
            "response_body": response_body
        }
        
        supabase.table("anchor_logs").insert(data).execute()
        return True
    except Exception as e:
        print(f"Error creating anchor log: {e}")
        return False

def get_anchor_logs(supabase: Client, screening_id: str) -> List[dict]:
    """Get anchor logs for a screening"""
    if not supabase:
        return []
        
    try:
        # First get the UUID
        screening = get_screening_by_id(supabase, screening_id)
        if not screening:
            return []
            
        uuid = screening['id']
        
        result = supabase.table("anchor_logs") \
            .select("*") \
            .eq("screening_id", uuid) \
            .order("attempt_at", desc=True) \
            .execute()
            
        return result.data if result.data else []
    except Exception as e:
        print(f"Error fetching anchor logs: {e}")
        return []
