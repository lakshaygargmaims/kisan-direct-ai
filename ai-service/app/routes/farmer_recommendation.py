from fastapi import APIRouter
from pydantic import BaseModel
from typing import Optional

router = APIRouter()

class RecommendationRequest(BaseModel):
    product: str
    latitude: float
    longitude: float
    max_distance: Optional[float] = 50
    max_price: Optional[float] = None
    organic_preferred: Optional[bool] = False

class FarmerScore(BaseModel):
    farmer_id: str
    name: str
    distance_km: float
    price: float
    rating: float
    organic: bool
    availability: float
    score: float
    breakdown: dict
    ai_reason: str

class RecommendationResponse(BaseModel):
    product: str
    recommendations: list[FarmerScore]
    weights_used: dict
    disclaimer: str

DEFAULT_WEIGHTS = {
    "distance": 0.30,
    "price": 0.25,
    "availability": 0.20,
    "rating": 0.15,
    "delivery_time": 0.10,
}

@router.post("/rank", response_model=RecommendationResponse)
async def rank_farmers(req: RecommendationRequest):
    # In demo mode, return simulated farmer recommendations
    demo_farmers = [
        {"id": "far-1", "name": "Rajesh Organic Farm", "distance": 2.4, "price": 28, "rating": 4.7, "organic": True, "avail": 500},
        {"id": "far-2", "name": "Singh Agro Farm", "distance": 5.1, "price": 25, "rating": 4.3, "organic": False, "avail": 1200},
        {"id": "far-3", "name": "Green Valley Farm", "distance": 8.3, "price": 30, "rating": 4.5, "organic": True, "avail": 300},
        {"id": "far-4", "name": "Devi Organic Garden", "distance": 12.7, "price": 32, "rating": 4.8, "organic": True, "avail": 200},
        {"id": "far-5", "name": "Prasad Farm", "distance": 15.2, "price": 22, "rating": 4.0, "organic": False, "avail": 800},
    ]

    recommendations = []
    for f in demo_farmers:
        if f["distance"] > req.max_distance:
            continue

        # Normalize scores (0-1)
        dist_score = max(0, 1 - f["distance"] / req.max_distance)
        price_score = max(0, 1 - f["price"] / 50)
        avail_score = min(1, f["avail"] / 500)
        rating_score = f["rating"] / 5.0
        delivery_score = max(0, 1 - f["distance"] / 30)

        score = (
            DEFAULT_WEIGHTS["distance"] * dist_score +
            DEFAULT_WEIGHTS["price"] * price_score +
            DEFAULT_WEIGHTS["availability"] * avail_score +
            DEFAULT_WEIGHTS["rating"] * rating_score +
            DEFAULT_WEIGHTS["delivery_time"] * delivery_score
        )

        if req.organic_preferred and f["organic"]:
            score *= 1.1

        ai_reason = f"Ranked by AI: {f['distance']}km away, ₹{f['price']}/kg, {f['rating']}★ rating"
        if f["organic"]:
            ai_reason += ", certified organic"

        recommendations.append(FarmerScore(
            farmer_id=f["id"], name=f["name"],
            distance_km=f["distance"], price=f["price"],
            rating=f["rating"], organic=f["organic"],
            availability=f["avail"],
            score=round(score, 3),
            breakdown={
                "distance": round(dist_score, 2),
                "price": round(price_score, 2),
                "availability": round(avail_score, 2),
                "rating": round(rating_score, 2),
                "delivery_time": round(delivery_score, 2),
            },
            ai_reason=ai_reason,
        ))

    recommendations.sort(key=lambda x: x.score, reverse=True)

    return RecommendationResponse(
        product=req.product,
        recommendations=recommendations[:5],
        weights_used=DEFAULT_WEIGHTS,
        disclaimer="DEMO MODE: Simulated AI recommendations. Real implementation would use live market data and actual farmer profiles.",
    )
