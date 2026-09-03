from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.routes import fair_price, demand_forecast, farmer_recommendation, quality_assessment, risk_score, route_optimization

app = FastAPI(
    title="KisanDirect AI Service",
    description="AI/ML service for agricultural marketplace intelligence",
    version="1.0.0",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(fair_price.router, prefix="/ai/fair-price", tags=["Fair Price"])
app.include_router(demand_forecast.router, prefix="/ai/demand-forecast", tags=["Demand Forecast"])
app.include_router(farmer_recommendation.router, prefix="/ai/farmer-recommendation", tags=["Farmer Recommendation"])
app.include_router(quality_assessment.router, prefix="/ai/quality-assessment", tags=["Quality Assessment"])
app.include_router(risk_score.router, prefix="/ai/risk-score", tags=["Risk Score"])
app.include_router(route_optimization.router, prefix="/ai/route-optimization", tags=["Route Optimization"])

@app.get("/health")
async def health_check():
    return {"status": "ok", "service": "KisanDirect AI ML Service", "mode": "DEMO"}

@app.get("/")
async def root():
    return {
        "service": "KisanDirect AI ML Service",
        "version": "1.0.0",
        "mode": "DEMO",
        "endpoints": [
            "/ai/fair-price/predict",
            "/ai/demand-forecast/predict",
            "/ai/farmer-recommendation/rank",
            "/ai/quality-assessment/assess",
            "/ai/risk-score/calculate",
            "/ai/route-optimize/optimize",
        ],
    }
