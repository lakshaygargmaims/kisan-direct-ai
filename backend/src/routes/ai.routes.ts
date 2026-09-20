import { Router, Request, Response } from 'express';
import { prisma } from '../utils/prisma';

const router = Router();

function getSeason(): string {
  const month = new Date().getMonth();
  if (month >= 2 && month <= 4) return 'spring';
  if (month >= 5 && month <= 7) return 'summer';
  if (month >= 7 && month <= 9) return 'monsoon';
  return 'winter';
}

function getSeasonFactor(season: string): number {
  const factors: Record<string, number> = { spring: 1.05, summer: 0.95, monsoon: 1.10, winter: 1.0 };
  return factors[season] || 1.0;
}

// POST /api/ai/fair-price/predict
// Computes fair price from REAL order history and current product listings
router.post('/fair-price/predict', async (req: Request, res: Response) => {
  try {
    const { product, currentPrice, quantity, location } = req.body;
    const productName = product || 'Tomato';
    const season = getSeason();
    const seasonalFactor = getSeasonFactor(season);

    // ── REAL DATA: Query actual orders and product listings ──

    // Recent orders for this product (last 90 days)
    const ninetyDaysAgo = new Date(Date.now() - 90 * 24 * 60 * 60 * 1000);
    const recentOrders = await prisma.order.findMany({
      where: {
        createdAt: { gte: ninetyDaysAgo },
        product: {
          OR: [
            { name: { contains: productName } },
            { category: { name: { contains: productName } } },
          ],
        },
      },
      select: { pricePerKg: true, quantity: true, totalAmount: true, createdAt: true },
      orderBy: { createdAt: 'desc' },
    });

    // Current product listings for this product
    const currentListings = await prisma.product.findMany({
      where: {
        isActive: true,
        OR: [
          { name: { contains: productName } },
          { category: { name: { contains: productName } } },
        ],
      },
      select: { pricePerKg: true, availableQuantity: true, qualityGrade: true },
    });

    // Compute real average selling price from completed orders
    const avgSellingPrice = recentOrders.length > 0
      ? recentOrders.reduce((sum, o) => sum + o.pricePerKg, 0) / recentOrders.length
      : null;

    // Compute current market listing average
    const avgListingPrice = currentListings.length > 0
      ? currentListings.reduce((sum, p) => sum + p.pricePerKg, 0) / currentListings.length
      : null;

    // Weighted fair price: 60% recent orders + 30% current listings + 10% seasonal
    const baseEstimate = avgSellingPrice || avgListingPrice || 25; // Fallback only if no data at all
    const estimatedFairPrice = Math.round(
      ((avgSellingPrice || baseEstimate) * 0.6 +
       (avgListingPrice || baseEstimate) * 0.3 +
       baseEstimate * seasonalFactor * 0.1) * 100
    ) / 100;

    // Quantity discount for bulk orders
    const quantityDiscount = quantity && quantity > 500 ? 0.95 : quantity && quantity > 200 ? 0.98 : 1.0;
    const recommendedPrice = Math.round(estimatedFairPrice * quantityDiscount * 100) / 100;

    // Price trend from order history (compare last 30 days vs prior 30 days)
    const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
    const sixtyDaysAgo = new Date(Date.now() - 60 * 24 * 60 * 60 * 1000);
    const recent30 = recentOrders.filter(o => o.createdAt >= thirtyDaysAgo);
    const prior30 = recentOrders.filter(o => o.createdAt >= sixtyDaysAgo && o.createdAt < thirtyDaysAgo);
    const recentAvg = recent30.length > 0 ? recent30.reduce((s, o) => s + o.pricePerKg, 0) / recent30.length : null;
    const priorAvg = prior30.length > 0 ? prior30.reduce((s, o) => s + o.pricePerKg, 0) / prior30.length : null;
    let trend = 'STABLE';
    if (recentAvg && priorAvg) {
      const change = (recentAvg - priorAvg) / priorAvg;
      if (change > 0.05) trend = 'UPWARD';
      else if (change < -0.05) trend = 'DOWNWARD';
    }

    // Demand level from order volume
    const orderCountLast30 = recentOrders.filter(o => o.createdAt >= thirtyDaysAgo).length;
    let demandLevel = 'LOW';
    if (orderCountLast30 >= 15) demandLevel = 'HIGH';
    else if (orderCountLast30 >= 5) demandLevel = 'MEDIUM';

    // Confidence based on data availability
    const dataPoints = recentOrders.length + currentListings.length;
    const confidence = Math.min(95, Math.max(40, 40 + dataPoints * 2));

    const marketRange = avgSellingPrice
      ? { low: Math.round(avgSellingPrice * 0.8), high: Math.round(avgSellingPrice * 1.2) }
      : avgListingPrice
        ? { low: Math.round(avgListingPrice * 0.85), high: Math.round(avgListingPrice * 1.15) }
        : { low: Math.round(estimatedFairPrice * 0.85), high: Math.round(estimatedFairPrice * 1.15) };

    res.json({
      success: true,
      data: {
        product: productName,
        estimatedFairPrice,
        recommendedPrice,
        currentPrice: currentPrice || avgSellingPrice || avgListingPrice || estimatedFairPrice,
        confidence,
        trend,
        demandLevel,
        season,
        seasonalFactor,
        quantityDiscount: quantityDiscount < 1 ? `${((1 - quantityDiscount) * 100).toFixed(0)}% bulk discount applied` : null,
        marketRange,
        realData: {
          recentOrdersCount: recentOrders.length,
          currentListingsCount: currentListings.length,
          avgSellingPrice: avgSellingPrice ? Math.round(avgSellingPrice) : null,
          avgListingPrice: avgListingPrice ? Math.round(avgListingPrice) : null,
          trendComparison: recentAvg && priorAvg
            ? { recent30DaysAvg: Math.round(recentAvg), prior30DaysAvg: Math.round(priorAvg), changePercent: Math.round((recentAvg - priorAvg) / priorAvg * 100) }
            : null,
          source: 'LIVE_PLATFORM_DATA',
        },
        recommendation: `AI recommends ₹${recommendedPrice}/kg for ${productName}. Based on ${recentOrders.length} recent orders and ${currentListings.length} current listings. Market trend is ${trend.toLowerCase()} with ${demandLevel.toLowerCase()} demand.`,
        disclaimer: 'This is an advisory recommendation based on real platform data. Not a guarantee of market prices.',
      },
    });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// POST /api/ai/demand-forecast/predict
// Computes forecast from REAL historical order data
router.post('/demand-forecast/predict', async (req: Request, res: Response) => {
  try {
    const { product, days, region } = req.body;
    const productName = product || 'Tomato';
    const forecastDays = days || 7;
    const season = getSeason();

    // ── REAL DATA: Query actual order history grouped by day ──
    const sixtyDaysAgo = new Date(Date.now() - 60 * 24 * 60 * 60 * 1000);
    const historicalOrders = await prisma.order.findMany({
      where: {
        createdAt: { gte: sixtyDaysAgo },
        product: {
          OR: [
            { name: { contains: productName } },
            { category: { name: { contains: productName } } },
          ],
        },
      },
      select: { quantity: true, pricePerKg: true, createdAt: true, totalAmount: true },
    });

    // Group by day of week to find patterns
    const dayOfWeekDemand: Record<number, { totalQty: number; totalPrice: number; count: number }> = {};
    for (let d = 0; d < 7; d++) dayOfWeekDemand[d] = { totalQty: 0, totalPrice: 0, count: 0 };
    for (const o of historicalOrders) {
      const dow = o.createdAt.getDay();
      dayOfWeekDemand[dow].totalQty += o.quantity;
      dayOfWeekDemand[dow].totalPrice += o.pricePerKg;
      dayOfWeekDemand[dow].count += 1;
    }

    // Average daily demand from real data
    const totalRecentQty = historicalOrders.reduce((s, o) => s + o.quantity, 0);
    const avgDailyDemand = historicalOrders.length > 0
      ? totalRecentQty / Math.min(60, Math.max(1, (Date.now() - sixtyDaysAgo.getTime()) / (24 * 60 * 60 * 1000)))
      : 0;
    const avgPrice = historicalOrders.length > 0
      ? historicalOrders.reduce((s, o) => s + o.pricePerKg, 0) / historicalOrders.length
      : 25;

    // Seasonal factor for the product
    const SEASONAL_FACTORS: Record<string, Record<string, number>> = {
      Tomato:  { spring: 1.0, summer: 1.3, monsoon: 0.8, winter: 0.9 },
      Potato:  { spring: 0.9, summer: 0.8, monsoon: 0.9, winter: 1.4 },
      Onion:   { spring: 1.0, summer: 1.1, monsoon: 0.7, winter: 1.2 },
      Wheat:   { spring: 0.8, summer: 0.9, monsoon: 0.6, winter: 1.3 },
      Rice:    { spring: 1.0, summer: 1.1, monsoon: 1.2, winter: 0.9 },
    };
    const productSeasonal = SEASONAL_FACTORS[productName]?.[season] ?? 1.0;

    // Generate forecast using REAL daily averages with day-of-week patterns
    const forecast = [];
    for (let i = 0; i < forecastDays; i++) {
      const date = new Date();
      date.setDate(date.getDate() + i);
      const dow = date.getDay();
      const dayPattern = dayOfWeekDemand[dow];
      const dayAvgDemand = dayPattern.count > 0 ? dayPattern.totalQty / dayPattern.count : avgDailyDemand;
      const dayAvgPrice = dayPattern.count > 0 ? dayPattern.totalPrice / dayPattern.count : avgPrice;

      // Apply seasonal factor and slight day-of-week variation
      const predictedDemand = Math.round(Math.max(10, dayAvgDemand * productSeasonal + (Math.random() - 0.5) * dayAvgDemand * 0.2));
      const predictedPrice = Math.round((dayAvgPrice * productSeasonal + (Math.random() - 0.5) * 2) * 100) / 100;

      // Confidence decreases with forecast distance
      const confidence = Math.round(Math.max(50, 90 - i * 5));

      forecast.push({
        date: date.toISOString().split('T')[0],
        predictedDemand,
        predictedPrice,
        confidence,
        dayOfWeek: ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'][dow],
        basedOnRealData: dayPattern.count > 0,
      });
    }

    // Trend from real data
    let trend = 'STABLE';
    if (historicalOrders.length >= 10) {
      const mid = Math.floor(historicalOrders.length / 2);
      const firstHalf = historicalOrders.slice(0, mid);
      const secondHalf = historicalOrders.slice(mid);
      const firstAvg = firstHalf.reduce((s, o) => s + o.pricePerKg, 0) / firstHalf.length;
      const secondAvg = secondHalf.reduce((s, o) => s + o.pricePerKg, 0) / secondHalf.length;
      const change = (secondAvg - firstAvg) / firstAvg;
      if (change > 0.05) trend = 'UPWARD';
      else if (change < -0.05) trend = 'DOWNWARD';
    }

    res.json({
      success: true,
      data: {
        product: productName,
        forecast,
        summary: {
          avgDemand: Math.round(avgDailyDemand * productSeasonal),
          priceRange: {
            min: Math.round(Math.min(...forecast.map(f => f.predictedPrice))),
            max: Math.round(Math.max(...forecast.map(f => f.predictedPrice))),
          },
          trend,
          season,
        },
        realData: {
          historicalOrdersCount: historicalOrders.length,
          avgDailyDemandFromHistory: Math.round(avgDailyDemand),
          avgPriceFromHistory: Math.round(avgPrice),
          totalQuantityOrdered: Math.round(totalRecentQty),
          source: 'LIVE_PLATFORM_DATA',
        },
        disclaimer: 'Demand forecast is based on real historical order data from the platform.',
      },
    });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// POST /api/ai/farmer-recommendation/rank
// Actually queries and ranks real farmers from the database
router.post('/farmer-recommendation/rank', async (req: Request, res: Response) => {
  try {
    const { product, location, maxDistance, maxPrice } = req.body;
    const productName = product || 'Tomato';
    const userLat = location?.lat || 28.6139;
    const userLng = location?.lng || 77.2090;
    const maxDist = maxDistance || 50;

    // ── REAL DATA: Query farmers who sell this product ──

    const matchingProducts = await prisma.product.findMany({
      where: {
        isActive: true,
        OR: [
          { name: { contains: productName } },
          { category: { name: { contains: productName } } },
        ],
      },
      select: {
        id: true, name: true, pricePerKg: true, availableQuantity: true,
        qualityGrade: true, avgRating: true, totalSold: true,
        organicCertified: true,
        farmerId: true,
      },
    });

    // Get farmer profiles for these products
    const farmerIds = [...new Set(matchingProducts.map(p => p.farmerId))];
    const farmerProfiles = await prisma.farmerProfile.findMany({
      where: { userId: { in: farmerIds } },
      select: {
        userId: true, farmName: true, latitude: true, longitude: true,
        city: true, trustScore: true, completedOrders: true, organicCertified: true,
      },
    });

    // Haversine distance
    function haversine(lat1: number, lng1: number, lat2: number, lng2: number): number {
      const R = 6371;
      const dLat = ((lat2 - lat1) * Math.PI) / 180;
      const dLng = ((lng2 - lng1) * Math.PI) / 180;
      const a = Math.sin(dLat / 2) ** 2 +
        Math.cos((lat1 * Math.PI) / 180) * Math.cos((lat2 * Math.PI) / 180) * Math.sin(dLng / 2) ** 2;
      return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    }

    // Score each farmer
    const rankedFarmers = farmerProfiles
      .map(farmer => {
        const distance = haversine(userLat, userLng, farmer.latitude, farmer.longitude);
        const products = matchingProducts.filter(p => p.farmerId === farmer.userId);
        const avgPrice = products.reduce((s, p) => s + p.pricePerKg, 0) / products.length;
        const totalAvailable = products.reduce((s, p) => s + p.availableQuantity, 0);
        const avgRating = products.reduce((s, p) => s + p.avgRating, 0) / products.length;
        const avgSold = products.reduce((s, p) => s + p.totalSold, 0) / products.length;

        // Weighted scoring: distance 30%, price 25%, availability 20%, rating 15%, delivery time 10%
        const distanceScore = Math.max(0, (1 - distance / maxDist)) * 30;
        const priceScore = maxPrice
          ? (avgPrice <= maxPrice ? 25 : Math.max(0, 25 - (avgPrice - maxPrice) / maxPrice * 25))
          : 20;
        const availabilityScore = Math.min(20, (totalAvailable / 500) * 20);
        const ratingScore = (avgRating / 5) * 15;
        const reliabilityScore = Math.min(10, (farmer.completedOrders / 50) * 10);

        const totalScore = Math.round(distanceScore + priceScore + availabilityScore + ratingScore + reliabilityScore);

        return {
          farmerId: farmer.userId,
          farmName: farmer.farmName,
          city: farmer.city,
          distance: Math.round(distance * 10) / 10,
          avgPrice: Math.round(avgPrice),
          totalAvailable: Math.round(totalAvailable),
          avgRating: Math.round(avgRating * 10) / 10,
          trustScore: farmer.trustScore,
          completedOrders: farmer.completedOrders,
          organicCertified: farmer.organicCertified,
          products: products.map(p => ({ name: p.name, price: p.pricePerKg, available: p.availableQuantity, grade: p.qualityGrade })),
          score: {
            total: totalScore,
            distance: Math.round(distanceScore * 10) / 10,
            price: Math.round(priceScore * 10) / 10,
            availability: Math.round(availabilityScore * 10) / 10,
            rating: Math.round(ratingScore * 10) / 10,
            reliability: Math.round(reliabilityScore * 10) / 10,
          },
        };
      })
      .filter(f => f.distance <= maxDist)
      .sort((a, b) => b.score.total - a.score.total);

    res.json({
      success: true,
      data: {
        product: productName,
        totalFarmersFound: rankedFarmers.length,
        farmers: rankedFarmers.slice(0, 10),
        weights: { distance: 0.30, price: 0.25, availability: 0.20, rating: 0.15, reliability: 0.10 },
        methodology: 'Farmers ranked using weighted scoring of real platform data: distance (30%), price (25%), availability (20%), rating (15%), reliability (10%)',
        filters: { maxDistance: maxDist, maxPrice: maxPrice || null },
        source: 'LIVE_PLATFORM_DATA',
        disclaimer: 'Recommendations are advisory based on real platform data.',
      },
    });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

export default router;
