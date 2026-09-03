from fastapi import APIRouter
from pydantic import BaseModel
from typing import Optional

router = APIRouter()

class RiskRequest(BaseModel):
    user_id: str
    order_count: Optional[int] = 0
    cancellation_count: Optional[int] = 0
    dispute_count: Optional[int] = 0
    on_time_rate: Optional[float] = 0.9
    avg_rating: Optional[float] = 4.0

class RiskResponse(BaseModel):
    user_id: str
    risk_score: int
    risk_level: str
    factors: list[str]
    recommendation: str
    disclaimer: str

@router.post("/calculate", response_model=RiskResponse)
async def calculate_risk(req: RiskRequest):
    score = 50  # base

    if req.order_count > 0:
        completion_rate = 1 - (req.cancellation_count / max(req.order_count, 1))
        score += int(completion_rate * 20)

    score += int(req.on_time_rate * 15)
    score += int(req.avg_rating * 5)
    score -= req.dispute_count * 10
    score -= req.cancellation_count * 5

    score = max(0, min(100, score))

    if score >= 80:
        level = "LOW"
    elif score >= 60:
        level = "MEDIUM"
    elif score >= 40:
        level = "HIGH"
    else:
        level = "CRITICAL"

    factors = []
    if req.cancellation_count > 3:
        factors.append("High cancellation rate")
    if req.dispute_count > 2:
        factors.append("Multiple disputes")
    if req.avg_rating < 3.5:
        factors.append("Below average rating")
    if req.on_time_rate < 0.8:
        factors.append("Poor on-time delivery rate")
    if not factors:
        factors.append("Good transaction history")

    return RiskResponse(
        user_id=req.user_id,
        risk_score=score,
        risk_level=level,
        factors=factors,
        recommendation=f"Risk level is {level}. {'No immediate action needed.' if level in ['LOW', 'MEDIUM'] else 'Review recommended. Monitor closely.'}",
        disclaimer="DEMO MODE: Rule-based risk scoring. Real implementation would use ML models with more features.",
    )
