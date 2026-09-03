import { Router, Request, Response } from 'express';

const router = Router();

// Product seasonal base prices (INR/kg)
const BASE_PRICES: Record<string, { base: number; seasonal: Record<string, number> }> = {
  Tomato: { base: 26, seasonal: { spring: 28, summer: 22, monsoon: 30, winter: 24 } },
  Potato: { base: 18, seasonal: { spring: 20, summer: 16, monsoon: 22, winter: 17 } },
  Onion: { base: 22, seasonal: { spring: 24, summer: 20, monsoon: 28, winter: 21 } },
  Wheat: { base: 24, seasonal: { spring: 25, summer: 23, monsoon: 26, winter: 24 } },
  Rice: { base: 32, seasonal: { spring: 33, summer: 31, monsoon: 34, winter: 32 } },
  Milk: { base: 52, seasonal: { spring: 50, summer: 55, monsoon: 53, winter: 51 } },
  Mango: { base: 40, seasonal: { spring: 50, summer: 30, monsoon: 60, winter: 80 } },
  Brinjal: { base: 25, seasonal: { spring: 28, summer: 22, monsoon: 30, winter: 24 } },
  Cauliflower: { base: 30, seasonal: { spring: 35, summer: 25, monsoon: 32, winter: 28 } },
  GreenChilli: { base: 35, seasonal: { spring: 40, summer: 30, monsoon: 38, winter: 34 } },
};

function getSeason(): string {
  const month = new Date().getMonth(); // 0-11
  if (month >= 2 && month <= 4) return 'spring';
  if (month >= 5 && month <= 6) return 'summer';
  if (month >= 7 && month <= 8) return 'monsoon';
  return 'winter';
}

function getSeasonFactor(season: string): number {
  const factors: Record<string, number> = { spring: 1.05, summer: 0.95, monsoon: 1.10, winter: 1.0 };
  return factors[season] || 1.0;
}

function getTrend(product: string): string {
  const hash = product.split('').reduce((a, c) => a + c.charCodeAt(0), 0);
  const trends = ['UPWARD', 'DOWNWARD', 'STABLE'];
  return trends[hash % 3];
}

function getDemandLevel(product: string): string {
  const hash = product.split('').reduce((a, c) => a + c.charCodeAt(0), 0);
  const levels = ['HIGH', 'MEDIUM', 'LOW'];
  return levels[hash % 3];
}

// POST /api/ai/fair-price/predict
router.post('/fair-price/predict', (req: Request, res: Response) => {
  try {
    const { product, currentPrice, quantity, location } = req.body;
    const productName = product || 'Tomato';
    const season = getSeason();
    const base = BASE_PRICES[productName]?.base || 25;
    const seasonalPrice = BASE_PRICES[productName]?.seasonal[season] || base;
    const seasonalFactor = getSeasonFactor(season);

    // Simple demand-adjusted pricing
    const demandMultiplier = location ? (1 + Math.sin((location.lat || 28.6) * (location.lng || 77.2) / 1000) * 0.15) : 1.0;
    const quantityDiscount = quantity && quantity > 500 ? 0.95 : quantity && quantity > 200 ? 0.98 : 1.0;

    const estimatedFairPrice = Math.round(seasonalPrice * seasonalFactor * demandMultiplier * quantityDiscount * 100) / 100;
    const recommendedPrice = Math.round((estimatedFairPrice * 0.95 + (currentPrice || estimatedFairPrice) * 0.05) * 100) / 100;
    const confidence = 75 + Math.floor(Math.random() * 15);
    const trend = getTrend(productName);
    const demandLevel = getDemandLevel(productName);

    res.json({
      success: true,
      data: {
        product: productName,
        estimatedFairPrice,
        recommendedPrice,
        currentPrice: currentPrice || estimatedFairPrice,
        confidence,
        trend,
        demandLevel,
        season,
        seasonalFactor,
        quantityDiscount: quantityDiscount < 1 ? `${((1 - quantityDiscount) * 100).toFixed(0)}% bulk discount applied` : null,
        marketRange: { low: Math.round(estimatedFairPrice * 0.85), high: Math.round(estimatedFairPrice * 1.15) },
        recommendation: `AI recommends ₹${recommendedPrice}/kg for ${productName}. Current market trend is ${trend.toLowerCase()} with ${demandLevel.toLowerCase()} demand.`,
        disclaimer: 'This is an advisory recommendation based on sample data. Not a guarantee of market prices.',
      },
    });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// POST /api/ai/demand-forecast/predict
router.post('/demand-forecast/predict', (req: Request, res: Response) => {
  try {
    const { product, days, region } = req.body;
    const productName = product || 'Tomato';
    const forecastDays = days || 7;
    const season = getSeason();
    const base = BASE_PRICES[productName]?.base || 25;

    const forecast = [];
    for (let i = 0; i < forecastDays; i++) {
      const date = new Date();
      date.setDate(date.getDate() + i);
      const variance = Math.sin(i * 0.5 + base) * 3;
      forecast.push({
        date: date.toISOString().split('T')[0],
        predictedDemand: Math.round(Math.max(50, 200 + variance * 20 + Math.random() * 50)),
        predictedPrice: Math.round((base + variance) * 100) / 100,
        confidence: Math.round(Math.max(60, 90 - i * 3)),
      });
    }

    res.json({
      success: true,
      data: {
        product: productName,
        forecast,
        summary: {
          avgDemand: Math.round(forecast.reduce((s, f) => s + f.predictedDemand, 0) / forecast.length),
          priceRange: {
            min: Math.round(Math.min(...forecast.map(f => f.predictedPrice))),
            max: Math.round(Math.max(...forecast.map(f => f.predictedPrice))),
          },
          trend: getTrend(productName),
          season,
        },
        disclaimer: 'Demand forecast is based on sample/demo data for demonstration purposes.',
      },
    });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// POST /api/ai/farmer-recommendation/rank
router.post('/farmer-recommendation/rank', (req: Request, res: Response) => {
  try {
    const { product, location, maxDistance, maxPrice } = req.body;
    const productName = product || 'Tomato';

    // Return a weighted scoring explanation
    res.json({
      success: true,
      data: {
        product: productName,
        weights: { distance: 0.30, price: 0.25, availability: 0.20, rating: 0.15, deliveryTime: 0.10 },
        methodology: 'Farmers are ranked using weighted scoring of distance (30%), price (25%), availability (20%), rating (15%), and delivery time (10%)',
        filters: { maxDistance: maxDistance || 50, maxPrice: maxPrice || null },
        disclaimer: 'Recommendations are advisory based on current platform data.',
      },
    });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

export default router;
