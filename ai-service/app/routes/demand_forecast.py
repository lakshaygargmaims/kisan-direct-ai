from fastapi import APIRouter
from pydantic import BaseModel
from typing import Optional
import random

router = APIRouter()

class DemandRequest(BaseModel):
    product: str
    region: str
    timeframe: Optional[str] = "7_days"

class DemandResponse(BaseModel):
    product: str
    region: str
    forecast: str
    demand_level: str
    expected_price_change: float
    timeframe: str
    supply_status: str
    recommendation: str

DEMAND_DATA = {
    "tomato": {"demand": "HIGH", "supply": "MEDIUM", "trend": "UPWARD", "change": 8.5},
    "onion": {"demand": "MEDIUM", "supply": "HIGH", "trend": "DOWNWARD", "change": -3.2},
    "potato": {"demand": "MEDIUM", "supply": "HIGH", "trend": "STABLE", "change": 0.5},
    "milk": {"demand": "HIGH", "supply": "MEDIUM", "trend": "UPWARD", "change": 5.0},
    "wheat": {"demand": "MEDIUM", "supply": "HIGH", "trend": "STABLE", "change": 1.2},
    "rice": {"demand": "MEDIUM", "supply": "MEDIUM", "trend": "STABLE", "change": 0.8},
}

@router.post("/predict", response_model=DemandResponse)
async def predict_demand(req: DemandRequest):
    product_key = req.product.lower()
    data = DEMAND_DATA.get(product_key, {
        "demand": random.choice(["LOW", "MEDIUM", "HIGH"]),
        "supply": random.choice(["LOW", "MEDIUM", "HIGH"]),
        "trend": random.choice(["UPWARD", "DOWNWARD", "STABLE"]),
        "change": round(random.uniform(-10, 10), 1),
    })

    forecast_texts = {
        "UPWARD": f"{req.product.title()} demand is expected to increase in {req.region}. Prices may rise.",
        "DOWNWARD": f"{req.product.title()} demand is decreasing in {req.region}. Prices may drop.",
        "STABLE": f"{req.product.title()} demand is stable in {req.region}. Prices expected to remain consistent.",
    }

    return DemandResponse(
        product=req.product,
        region=req.region,
        forecast=forecast_texts[data["trend"]],
        demand_level=data["demand"],
        expected_price_change=data["change"],
        timeframe=req.timeframe or "7_days",
        supply_status=data["supply"],
        recommendation=f"{'Consider stocking up' if data['trend'] == 'UPWARD' else 'Good time to buy' if data['trend'] == 'DOWNWARD' else 'Normal trading conditions'} for {req.product.title()} in {req.region}.",
    )
