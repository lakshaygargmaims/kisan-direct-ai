// ─── AI Demand Heatmap Service ──────────────────────────────────
// Real data: queries orders, buyer requirements, farmers, and buyers from the database.
// Each zone's demand score is computed from actual platform activity.

import { prisma } from '../utils/prisma';

const DEMAND_THRESHOLDS = { HIGH: 55, MEDIUM: 30, LOW: 0 } as const;

const WEIGHTS = {
  recentOrders: 0.25,
  buyerRequirements: 0.20,
  b2bDemand: 0.15,
  quantityRequested: 0.15,
  historicalDemand: 0.10,
  seasonalFactor: 0.10,
  proximityBonus: 0.05,
};

const SEASONAL_FACTORS: Record<string, Record<string, number>> = {
  Tomato:  { spring: 1.0, summer: 1.3, monsoon: 0.8, winter: 0.9 },
  Potato:  { spring: 0.9, summer: 0.8, monsoon: 0.9, winter: 1.4 },
  Onion:   { spring: 1.0, summer: 1.1, monsoon: 0.7, winter: 1.2 },
  Wheat:   { spring: 0.8, summer: 0.9, monsoon: 0.6, winter: 1.3 },
  Rice:    { spring: 1.0, summer: 1.1, monsoon: 1.2, winter: 0.9 },
  Milk:    { spring: 1.0, summer: 0.9, monsoon: 1.0, winter: 1.1 },
  Corn:    { spring: 0.9, summer: 1.0, monsoon: 1.1, winter: 0.8 },
  Garlic:  { spring: 1.1, summer: 0.8, monsoon: 0.7, winter: 1.3 },
};

export const PRODUCTS = ['Tomato', 'Potato', 'Onion', 'Wheat', 'Rice', 'Milk', 'Corn', 'Garlic'];

const DEMO_ZONES = [
  { name: 'North Delhi',   areaName: 'Rohini / Pitampura',              lat: 28.7490, lng: 77.1100, city: 'Delhi' },
  { name: 'South Delhi',   areaName: 'Saket / Malviya Nagar',           lat: 28.5245, lng: 77.2066, city: 'Delhi' },
  { name: 'East Delhi',    areaName: 'Laxmi Nagar / Mayur Vihar',       lat: 28.6358, lng: 77.2964, city: 'Delhi' },
  { name: 'West Delhi',    areaName: 'Rajouri Garden / Punjabi Bagh',   lat: 28.6492, lng: 77.1216, city: 'Delhi' },
  { name: 'Central Delhi', areaName: 'Karol Bagh / Daryaganj',          lat: 28.6519, lng: 77.1904, city: 'Delhi' },
  { name: 'Noida',         areaName: 'Sector 62 / Sector 18',           lat: 28.5802, lng: 77.3188, city: 'Noida' },
  { name: 'Gurugram',      areaName: 'Cyber Hub / Sector 29',           lat: 28.4595, lng: 77.0266, city: 'Gurugram' },
  { name: 'Ghaziabad',     areaName: 'Indirapuram / Vaishali',          lat: 28.6692, lng: 77.4538, city: 'Ghaziabad' },
  { name: 'Faridabad',     areaName: 'NIT / Sector 21',                 lat: 28.4089, lng: 77.3178, city: 'Faridabad' },
  { name: 'Sonipat',       areaName: 'Sector 7 / Gohana Road',          lat: 28.9958, lng: 77.0100, city: 'Sonipat' },
  { name: 'Meerut',        areaName: 'Shastri Nagar / Saket',           lat: 28.9845, lng: 77.7066, city: 'Meerut' },
  { name: 'Panipat',       areaName: 'GT Road / Samalkha',              lat: 29.3909, lng: 76.9635, city: 'Panipat' },
];

export function getCurrentSeason(): string {
  const m = new Date().getMonth();
  if (m >= 2 && m <= 4) return 'spring';
  if (m >= 5 && m <= 7) return 'summer';
  if (m >= 8 && m <= 9) return 'monsoon';
  return 'winter';
}

export function classifyDemand(score: number): string {
  if (score >= DEMAND_THRESHOLDS.HIGH) return 'HIGH';
  if (score >= DEMAND_THRESHOLDS.MEDIUM) return 'MEDIUM';
  return 'LOW';
}

function haversine(lat1: number, lng1: number, lat2: number, lng2: number): number {
  const R = 6371;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLng = ((lng2 - lng1) * Math.PI) / 180;
  const a = Math.sin(dLat / 2) ** 2 +
    Math.cos((lat1 * Math.PI) / 180) * Math.cos((lat2 * Math.PI) / 180) * Math.sin(dLng / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

function computeScore(inputs: {
  orders: number; buyers: number; b2b: number; qty: number;
  history: number; seasonal: number; distance: number;
}): number {
  const raw =
    Math.min(inputs.orders / 8, 1) * WEIGHTS.recentOrders +   // 8+ orders = max weight
    Math.min(inputs.buyers / 5, 1) * WEIGHTS.buyerRequirements + // 5+ buyers = max weight
    Math.min(inputs.b2b / 3, 1) * WEIGHTS.b2bDemand +           // 3+ requirements = max weight
    Math.min(inputs.qty / 1000, 1) * WEIGHTS.quantityRequested + // 1000+ kg = max weight
    Math.min(inputs.history / 20, 1) * WEIGHTS.historicalDemand + // 20+ orders = max weight
    Math.min(inputs.seasonal / 1.5, 1) * WEIGHTS.seasonalFactor +
    Math.max(1 - inputs.distance / 50, 0) * WEIGHTS.proximityBonus;
  return Math.round(Math.min(raw * 100, 100));
}

// ─── Core: Generate heatmap data for one product (REAL DATA) ──

export async function generateHeatmapData(
  productName: string, lat: number, lng: number, radiusKm = 50,
) {
  const season = getCurrentSeason();
  const seasonalFactor = SEASONAL_FACTORS[productName]?.[season] ?? 1.0;

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
      totalSold: true, farmerId: true, qualityGrade: true,
      farmer: { select: { name: true } },
    },
  });

  const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
  const recentOrders = await prisma.order.findMany({
    where: {
      createdAt: { gte: thirtyDaysAgo },
      product: {
        OR: [
          { name: { contains: productName } },
          { category: { name: { contains: productName } } },
        ],
      },
    },
    select: {
      id: true, quantity: true, totalAmount: true, pricePerKg: true,
      deliveryLatitude: true, deliveryLongitude: true, deliveryAddress: true,
      buyerId: true, createdAt: true, status: true,
    },
  });

  const historicalOrders = await prisma.order.findMany({
    where: {
      product: {
        OR: [
          { name: { contains: productName } },
          { category: { name: { contains: productName } } },
        ],
      },
    },
    select: { id: true, quantity: true, totalAmount: true, pricePerKg: true },
  });

  const buyerRequirements = await prisma.buyerRequirement.findMany({
    where: {
      isActive: true,
      productName: { contains: productName },
    },
    select: {
      id: true, quantity: true, maxPrice: true, deliveryCity: true,
      buyerId: true, requiredByDate: true,
    },
  });

  const allBuyers = await prisma.buyerProfile.findMany({
    select: { id: true, userId: true, latitude: true, longitude: true, city: true, businessName: true },
  });

  const allFarmers = await prisma.farmerProfile.findMany({
    select: { userId: true, farmName: true, latitude: true, longitude: true, city: true, specializations: true },
  });

  const zones = DEMO_ZONES
    .map((z) => {
      const dist = haversine(lat, lng, z.lat, z.lng);
      if (dist > radiusKm) return null;

      const zoneOrders = recentOrders.filter(o =>
        haversine(z.lat, z.lng, o.deliveryLatitude, o.deliveryLongitude) < 15
      );
      const orderCount = zoneOrders.length;

      const zoneBuyers = allBuyers.filter(b =>
        haversine(z.lat, z.lng, b.latitude, b.longitude) < 15
      );
      const buyerCount = zoneBuyers.length;

      const zoneRequirements = buyerRequirements.filter(r =>
        r.deliveryCity?.toLowerCase().includes(z.city.toLowerCase()) ||
        r.deliveryCity?.toLowerCase().includes(z.name.toLowerCase().split(' ')[0])
      );
      const b2bCount = zoneRequirements.length;
      const reqQuantity = zoneRequirements.reduce((sum, r) => sum + (r.quantity || 0), 0);

      const avgPrice = zoneOrders.length > 0
        ? Math.round(zoneOrders.reduce((sum, o) => sum + o.pricePerKg, 0) / zoneOrders.length)
        : matchingProducts.length > 0
          ? Math.round(matchingProducts.reduce((sum, p) => sum + p.pricePerKg, 0) / matchingProducts.length)
          : 25;

      const totalDemandKg = Math.max(
        zoneOrders.reduce((sum, o) => sum + o.quantity, 0) + reqQuantity,
        100,
      );

      const score = computeScore({
        orders: orderCount,
        buyers: buyerCount,
        b2b: b2bCount,
        qty: totalDemandKg,
        history: historicalOrders.length,
        seasonal: seasonalFactor,
        distance: dist,
      });

      const nearestFarmer = allFarmers
        .map(f => ({ ...f, dist: haversine(z.lat, z.lng, f.latitude, f.longitude) }))
        .sort((a, b) => a.dist - b.dist)[0];

      return {
        id: `${z.name.toLowerCase().replace(/\s+/g, '-')}-${productName.toLowerCase().replace(/\s+/g, '-')}`,
        name: z.name,
        areaName: z.areaName,
        latitude: z.lat,
        longitude: z.lng,
        radiusKm: 8,
        demandLevel: classifyDemand(score),
        demandScore: score,
        activeBuyers: buyerCount,
        b2bRequirements: b2bCount,
        avgOfferedPrice: avgPrice,
        totalDemandKg: Math.round(totalDemandKg),
        city: z.city,
        distanceKm: Math.round(dist * 10) / 10,
        productName,
        recentOrderCount: orderCount,
        potentialBuyers: zoneBuyers.length,
        nearestFarmerKm: nearestFarmer ? Math.round(nearestFarmer.dist * 10) / 10 : null,
        nearestFarmerName: nearestFarmer?.farmName || null,
      };
    })
    .filter(Boolean)
    .sort((a: any, b: any) => b.demandScore - a.demandScore);

  const summary = {
    productName,
    season,
    seasonalFactor,
    zoneCount: zones.length,
    highDemandZones: zones.filter((z: any) => z.demandLevel === 'HIGH').length,
    mediumDemandZones: zones.filter((z: any) => z.demandLevel === 'MEDIUM').length,
    lowDemandZones: zones.filter((z: any) => z.demandLevel === 'LOW').length,
    zones,
    dataStats: {
      totalFarmersSelling: matchingProducts.length,
      totalRecentOrders: recentOrders.length,
      totalHistoricalOrders: historicalOrders.length,
      totalBuyerRequirements: buyerRequirements.length,
      totalBuyersInArea: allBuyers.length,
      dataSource: 'LIVE_PLATFORM_DATA',
    },
    disclaimer: 'Demand scores computed from real platform data (orders, buyer requirements, buyer locations). Seasonal factors are based on agricultural knowledge.',
  };

  return summary;
}

// ─── AI Recommendation (REAL DATA) ──────────────────────────────

export async function getAIRecommendation(
  productName: string, farmerLat: number, farmerLng: number,
) {
  const heatmap = await generateHeatmapData(productName, farmerLat, farmerLng, 50);
  const { zones, seasonalFactor, dataStats } = heatmap;

  const totalKg = zones.reduce((s: number, z: any) => s + z.totalDemandKg, 0);
  const totalBuyers = zones.reduce((s: number, z: any) => s + z.activeBuyers, 0);
  const avgScore = zones.length
    ? Math.round(zones.reduce((s: number, z: any) => s + z.demandScore, 0) / zones.length)
    : 0;
  const level = classifyDemand(avgScore);

  const highZones = zones.filter((z: any) => z.demandLevel === 'HIGH');
  const nearestHigh = highZones.length
    ? highZones.reduce((n: any, z: any) => (!n || z.distanceKm < n.distanceKm ? z : n), null)
    : null;

  const pct = level === 'HIGH' ? [0.04, 0.06] : level === 'MEDIUM' ? [0.03, 0.05] : [0.01, 0.02];
  const suggestionQty = `${Math.round(totalKg * pct[0])}–${Math.round(totalKg * pct[1])} kg`;

  const allOrders = await prisma.order.findMany({
    where: {
      product: {
        OR: [
          { name: { contains: productName } },
          { category: { name: { contains: productName } } },
        ],
      },
    },
    select: { pricePerKg: true, quantity: true },
  });
  const avgPrice = allOrders.length > 0
    ? Math.round(allOrders.reduce((s, o) => s + o.pricePerKg, 0) / allOrders.length)
    : null;

  const zoneNote = nearestHigh
    ? (level === 'HIGH'
      ? `The nearest high-demand zone is ${nearestHigh.name} (${nearestHigh.distanceKm} km away) with ${nearestHigh.totalDemandKg} kg demand.`
      : `Note: ${nearestHigh.name} shows high demand at ${nearestHigh.distanceKm} km.`)
    : '';

  const recommendation =
    level === 'HIGH'
      ? `Demand for ${productName} is currently HIGH across ${zones.length} zones. ${zoneNote} ${dataStats.totalRecentOrders} recent orders found. Avg market price: ₹${avgPrice || 'N/A'}/kg. Consider targeting buyers in highlighted zones.`
      : level === 'MEDIUM'
      ? `Moderate demand detected for ${productName} across ${zones.length} zones. ${zoneNote} ${dataStats.totalRecentOrders} recent orders and ${dataStats.totalBuyerRequirements} active buyer requirements. Consider listing your produce and matching with nearby buyers.`
      : `Current demand for ${productName} in your area has ${dataStats.totalRecentOrders} recent orders and ${dataStats.totalBuyerRequirements} buyer requirements. Avg price: ₹${avgPrice || 'N/A'}/kg. Consider expanding delivery radius or targeting more active buyer zones.`;

  return {
    productName,
    demandLevel: level,
    demandScore: avgScore,
    potentialDemandKg: totalKg,
    suggestedQuantity: suggestionQty,
    nearbyBuyers: totalBuyers,
    avgMarketPrice: avgPrice,
    recommendation,
    seasonalTrend: seasonalFactor > 1.0 ? 'UPWARD' : seasonalFactor < 1.0 ? 'DOWNWARD' : 'STABLE',
    dataStats: {
      basedOn: `${dataStats.totalRecentOrders} recent orders, ${dataStats.totalHistoricalOrders} historical orders, ${dataStats.totalBuyerRequirements} buyer requirements, ${dataStats.totalBuyersInArea} buyers in area`,
      source: 'LIVE_PLATFORM_DATA',
    },
    disclaimer: 'This is an AI advisory recommendation based on real platform data. Not a guarantee of future prices or sales.',
  };
}

// ─── Nearby demand (used by farmer dashboard widget) ───────────

export async function getNearbyDemand(lat: number, lng: number, radiusKm = 25) {
  const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);

  const products = await prisma.product.findMany({
    where: { isActive: true },
    select: {
      id: true, name: true, pricePerKg: true, availableQuantity: true,
      totalSold: true, farmerId: true,
      category: { select: { name: true } },
      farmer: { select: { name: true } },
    },
  });

  const recentOrders = await prisma.order.findMany({
    where: { createdAt: { gte: thirtyDaysAgo } },
    select: {
      productId: true, quantity: true, pricePerKg: true,
      deliveryLatitude: true, deliveryLongitude: true,
      product: { select: { name: true, category: { select: { name: true } } } },
    },
  });

  const buyerReqs = await prisma.buyerRequirement.findMany({
    where: { isActive: true },
    select: { productName: true, quantity: true, maxPrice: true },
  });

  const farmers = await prisma.farmerProfile.findMany({
    select: { userId: true, latitude: true, longitude: true, farmName: true },
  });

  const productMap = new Map<string, { name: string; priceSum: number; priceCount: number; totalSold: number; available: number }>();

  for (const p of products) {
    if (p.name.startsWith('Test') || p.name.startsWith('Sweep') || p.name.startsWith('RC ')) continue;
    const key = p.name;
    if (!productMap.has(key)) {
      productMap.set(key, { name: key, priceSum: 0, priceCount: 0, totalSold: 0, available: 0 });
    }
    const entry = productMap.get(key)!;
    entry.priceSum += p.pricePerKg;
    entry.priceCount += 1;
    entry.totalSold += p.totalSold;
    entry.available += p.availableQuantity;
  }

  const results: any[] = [];

  for (const [name, info] of productMap) {
    const season = getCurrentSeason();
    const seasonalFactor = SEASONAL_FACTORS[name]?.[season] ?? 1.0;

    const productOrders = recentOrders.filter(o =>
      o.product?.name?.toLowerCase() === name.toLowerCase()
    );
    const orderCount = productOrders.length;
    const totalOrderKg = productOrders.reduce((sum, o) => sum + o.quantity, 0);

    const reqs = buyerReqs.filter(r =>
      r.productName?.toLowerCase().includes(name.toLowerCase())
    );
    const reqKg = reqs.reduce((sum, r) => sum + (r.quantity || 0), 0);

    const nearbyFarmerCount = farmers.filter(f => haversine(lat, lng, f.latitude, f.longitude) <= radiusKm).length;

    const totalDemandKg = totalOrderKg + reqKg;
    const avgPrice = info.priceCount > 0 ? Math.round(info.priceSum / info.priceCount) : null;

    const score = computeScore({
      orders: orderCount,
      buyers: reqs.length + Math.round(orderCount * 0.3),
      b2b: reqs.length,
      qty: Math.max(totalDemandKg, info.available * 0.5),
      history: orderCount * 3,
      seasonal: seasonalFactor,
      distance: radiusKm / 2,
    });

    results.push({
      productName: name,
      demandScore: score,
      demandLevel: classifyDemand(score),
      estimatedDemandKg: Math.round(totalDemandKg),
      activeBuyerCount: orderCount + reqs.length,
      b2bReqCount: reqs.length,
      avgPricePerKg: avgPrice,
      availableQuantity: Math.round(info.available),
      totalSold: info.totalSold,
      nearbyFarmers: nearbyFarmerCount,
      seasonalFactor,
    });
  }

  return results.sort((a, b) => b.demandScore - a.demandScore);
}

// ─── Product-specific demand ────────────────────────────────────

export async function getProductDemand(productName: string, lat: number, lng: number, radiusKm = 50) {
  const heatmap = await generateHeatmapData(productName, lat, lng, radiusKm);
  const { zones, seasonalFactor, dataStats } = heatmap;
  const avgScore = zones.length
    ? Math.round(zones.reduce((s: number, z: any) => s + z.demandScore, 0) / zones.length)
    : 0;

  return {
    productName,
    demandScore: avgScore,
    demandLevel: classifyDemand(avgScore),
    estimatedDemandKg: zones.reduce((s: number, z: any) => s + z.totalDemandKg, 0),
    recentOrderCount: zones.reduce((s: number, z: any) => s + (z.recentOrderCount || 0), 0),
    activeBuyerCount: zones.reduce((s: number, z: any) => s + z.activeBuyers, 0),
    b2bReqCount: zones.reduce((s: number, z: any) => s + z.b2bRequirements, 0),
    avgPricePerKg: zones.length ? Math.round(zones.reduce((s: number, z: any) => s + z.avgOfferedPrice, 0) / zones.length) : null,
    seasonalFactor,
    zones: zones.slice(0, 5),
    dataStats,
  };
}
