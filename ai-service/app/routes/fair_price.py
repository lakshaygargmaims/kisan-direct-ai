import numpy as np
from fastapi import APIRouter
from pydantic import BaseModel
from typing import Optional

router = APIRouter()

class FairPriceRequest(BaseModel):
    product: str
    location: str
    current_price: float
    quantity: float
    season: Optional[str] = None
    demand_level: Optional[str] = None
    supply_level: Optional[str] = None
    historical_prices: Optional[list[float]] = None

class FairPriceResponse(BaseModel):
    fair_price: float
    recommended_price: float
    confidence: float
    trend: str
    recommendation: str
    market_range: dict
    explanation: str

# Demo price data
PRODUCT_BASE_PRICES = {
    "tomato": 25, "onion": 20, "potato": 16, "cauliflower": 32,
    "spinach": 18, "green chili": 42, "capsicum": 38, "carrot": 28,
    "apple": 75, "banana": 35, "mango": 110, "orange": 55,
    "wheat": 22, "basmati rice": 42, "mustard seeds": 50,
    "moong dal": 85, "toor dal": 105, "chana dal": 70,
    "turmeric": 190, "red chili powder": 170, "coriander": 110,
    "fresh milk": 50, "paneer": 310, "curd": 38, "ghee": 480,
    "honey": 380, "pickles": 140, "flour": 32, "jaggery": 55,
}

SEASON_MODIFIERS = {
    "kharif": 1.1, "rabi": 0.95, "zaid": 1.15, "monsoon": 1.2, "winter": 0.9,
}

DEMAND_MODIFIERS = {
    "LOW": 0.9, "MEDIUM": 1.0, "HIGH": 1.15, "VERY_HIGH": 1.3,
}

@router.post("/predict", response_model=FairPriceResponse)
async def predict_fair_price(req: FairPriceRequest):
    base_price = PRODUCT_BASE_PRICES.get(req.product.lower(), 30)

    # Season adjustment
    season_mod = 1.0
    if req.season:
        season_mod = SEASON_MODIFIERS.get(req.season.lower(), 1.0)

    # Demand adjustment
    demand_mod = 1.0
    if req.demand_level:
        demand_mod = DEMAND_MODIFIERS.get(req.demand_level, 1.0)

    # Historical trend
    trend = "STABLE"
    if req.historical_prices and len(req.historical_prices) >= 2:
        recent = np.mean(req.historical_prices[-5:]) if len(req.historical_prices) >= 5 else np.mean(req.historical_prices)
        older = np.mean(req.historical_prices[:5]) if len(req.historical_prices) >= 5 else np.mean(req.historical_prices)
        if recent > older * 1.05:
            trend = "UPWARD"
        elif recent < older * 0.95:
            trend = "DOWNWARD"

    trend_mod = {"UPWARD": 1.08, "DOWNWARD": 0.92, "STABLE": 1.0}[trend]

    # Quantity discount
    qty_mod = 0.95 if req.quantity > 100 else (0.9 if req.quantity > 500 else 1.0)

    fair_price = round(base_price * season_mod * demand_mod * trend_mod, 2)
    recommended_price = round(fair_price * qty_mod, 2)
    current_price = req.current_price

    if current_price < fair_price * 0.85:
        recommendation = f"Price is below fair value. Recommended: ₹{recommended_price}/kg. Consider negotiating upward."
    elif current_price > fair_price * 1.15:
        recommendation = f"Price is above fair value. Market average is ₹{fair_price}/kg. There may be better options nearby."
    else:
        recommendation = f"Price is within fair range (₹{fair_price-5}–₹{fair_price+5}/kg). Good value for the current market."

    confidence = min(0.95, 0.7 + (0.02 * len(req.historical_prices or [])))

    return FairPriceResponse(
        fair_price=fair_price,
        recommended_price=recommended_price,
        confidence=round(confidence, 2),
        trend=trend,
        recommendation=recommendation,
        market_range={"low": round(fair_price * 0.85, 2), "high": round(fair_price * 1.15, 2)},
        explanation=f"Based on base price ₹{base_price}, season modifier {season_mod}, demand modifier {demand_mod}, trend {trend_mod}",
    )
