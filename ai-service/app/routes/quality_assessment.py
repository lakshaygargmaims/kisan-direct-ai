from fastapi import APIRouter
from pydantic import BaseModel
from typing import Optional
import random

router = APIRouter()

class QualityRequest(BaseModel):
    product: str
    image_url: Optional[str] = None
    description: Optional[str] = None

class QualityResponse(BaseModel):
    product: str
    grade: str
    confidence: float
    freshness_score: float
    defects: list[str]
    recommendation: str
    disclaimer: str

@router.post("/assess", response_model=QualityResponse)
async def assess_quality(req: QualityRequest):
    grades = ["A+", "A", "B+", "B", "C"]
    weights = [0.1, 0.35, 0.3, 0.2, 0.05]
    grade = random.choices(grades, weights=weights, k=1)[0]

    grade_scores = {"A+": 0.95, "A": 0.85, "B+": 0.75, "B": 0.65, "C": 0.5}
    freshness = grade_scores[grade] + random.uniform(-0.05, 0.05)
    freshness = max(0, min(1, freshness))

    defect_pool = [
        "Minor color variation", "Small size inconsistency", "Slight surface marks",
        "No visible defects", "Minor bruising", "Excellent condition",
    ]
    defects = random.sample(defect_pool, k=random.randint(0, 2))

    return QualityResponse(
        product=req.product,
        grade=grade,
        confidence=round(random.uniform(0.75, 0.95), 2),
        freshness_score=round(freshness, 2),
        defects=defects,
        recommendation=f"Product graded as {grade}. {'Recommended for immediate sale.' if grade in ['A+', 'A'] else 'Suitable for bulk orders.' if grade in ['B+', 'B'] else 'Best for processed products.'}",
        disclaimer="DEMO MODE: Simulated quality assessment. Real implementation would use computer vision models trained on agricultural product images.",
    )
