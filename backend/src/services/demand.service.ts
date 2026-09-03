// ─── AI Demand Heatmap Service ──────────────────────────────────
// Single data source: generateHeatmapData(). All endpoints derive from this.

const DEMAND_THRESHOLDS = { HIGH: 71, MEDIUM: 41, LOW: 0 } as const;

const WEIGHTS = {
  recentOrders: 0.25,
  buyerRequirements: 0.20,
  b2bDemand: 0.15,
  quantityRequested: 0.15,
  historicalDemand: 0.10,
  seasonalFactor: 0.10,
  proximityBonus: 0.05,
};

// ─── Seasonal factors ───────────────────────────────────────────

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

// ─── Demo zones (Delhi/NCR) ─────────────────────────────────────

const DEMO_ZONES = [
  { name: 'North Delhi',   areaName: 'Rohini / Pitampura',         lat: 28.7490, lng: 77.1100, city: 'Delhi' },
  { name: 'South Delhi',   areaName: 'Saket / Malviya Nagar',      lat: 28.5245, lng: 77.2066, city: 'Delhi' },
  { name: 'East Delhi',    areaName: 'Laxmi Nagar / Mayur Vihar',  lat: 28.6358, lng: 77.2964, city: 'Delhi' },
  { name: 'West Delhi',    areaName: 'Rajouri Garden / Punjabi Bagh', lat: 28.6492, lng: 77.1216, city: 'Delhi' },
  { name: 'Central Delhi', areaName: 'Karol Bagh / Daryaganj',     lat: 28.6519, lng: 77.1904, city: 'Delhi' },
  { name: 'Noida',         areaName: 'Sector 62 / Sector 18',      lat: 28.5802, lng: 77.3188, city: 'Noida' },
  { name: 'Gurugram',      areaName: 'Cyber Hub / Sector 29',      lat: 28.4595, lng: 77.0266, city: 'Gurugram' },
  { name: 'Ghaziabad',     areaName: 'Indirapuram / Vaishali',     lat: 28.6692, lng: 77.4538, city: 'Ghaziabad' },
  { name: 'Faridabad',     areaName: 'NIT / Sector 21',            lat: 28.4089, lng: 77.3178, city: 'Faridabad' },
  { name: 'Sonipat',       areaName: 'Sector 7 / Gohana Road',     lat: 28.9958, lng: 77.0100, city: 'Sonipat' },
  { name: 'Meerut',        areaName: 'Shastri Nagar / Saket',      lat: 28.9845, lng: 77.7066, city: 'Meerut' },
  { name: 'Panipat',       areaName: 'GT Road / Samalkha',         lat: 29.3909, lng: 76.9635, city: 'Panipat' },
];

// ─── Helpers ────────────────────────────────────────────────────

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

/** Deterministic pseudo-random [0,1] seeded by string */
function seededRandom(seed: string, index: number): number {
  const code = seed.split('').reduce((a, c) => a + c.charCodeAt(0), 0);
  return (Math.sin(code * index) + 1) / 2;
}

function computeScore(inputs: {
  orders: number; buyers: number; b2b: number; qty: number;
  history: number; seasonal: number; distance: number;
}): number {
  const raw =
    Math.min(inputs.orders / 20, 1) * WEIGHTS.recentOrders +
    Math.min(inputs.buyers / 15, 1) * WEIGHTS.buyerRequirements +
    Math.min(inputs.b2b / 10, 1) * WEIGHTS.b2bDemand +
    Math.min(inputs.qty / 5000, 1) * WEIGHTS.quantityRequested +
    Math.min(inputs.history / 50, 1) * WEIGHTS.historicalDemand +
    Math.min(inputs.seasonal / 1.5, 1) * WEIGHTS.seasonalFactor +
    Math.max(1 - inputs.distance / 50, 0) * WEIGHTS.proximityBonus;
  return Math.round(Math.min(raw * 100, 100));
}

// ─── Core: Generate heatmap data for one product ────────────────

export function generateHeatmapData(
  productName: string, lat: number, lng: number, radiusKm = 50,
) {
  const season = getCurrentSeason();
  const seasonalFactor = SEASONAL_FACTORS[productName]?.[season] ?? 1.0;

  const zones = DEMO_ZONES
    .map((z) => {
      const dist = haversine(lat, lng, z.lat, z.lng);
      if (dist > radiusKm) return null;

      const seed = z.name + productName;
      const orders = Math.round(seededRandom(seed, 1) * 20 + 3);
      const buyers = Math.round(seededRandom(seed, 2) * 12 + 1);
      const qty = Math.round(seededRandom(seed, 3) * 3000 + 200);
      const price = Math.round(seededRandom(seed, 4) * 30 + 15);
      const b2b = Math.round(buyers * 0.5);

      const score = computeScore({
        orders, buyers, b2b, qty,
        history: orders * 3, seasonal: seasonalFactor, distance: dist,
      });

      return {
        id: `${z.name.toLowerCase().replace(/\s+/g, '-')}-${productName.toLowerCase().replace(/\s+/g, '-')}`,
        name: z.name,
        areaName: z.areaName,
        latitude: z.lat,
        longitude: z.lng,
        radiusKm: 8,
        demandLevel: classifyDemand(score),
        demandScore: score,
        activeBuyers: buyers,
        b2bRequirements: b2b,
        avgOfferedPrice: price,
        totalDemandKg: qty,
        city: z.city,
        distanceKm: Math.round(dist * 10) / 10,
        productName,
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
    disclaimer: 'This is simulated demand data for demonstration purposes only.',
  };

  return summary;
}

// ─── AI Recommendation ──────────────────────────────────────────

export function getAIRecommendation(
  productName: string, farmerLat: number, farmerLng: number,
) {
  const heatmap = generateHeatmapData(productName, farmerLat, farmerLng, 50);
  const { zones, seasonalFactor } = heatmap;

  const totalKg = zones.reduce((s: number, z: any) => s + z.totalDemandKg, 0);
  const totalBuyers = zones.reduce((s: number, z: any) => s + z.activeBuyers, 0);
  const avgScore = zones.length
    ? Math.round(zones.reduce((s: number, z: any) => s + z.demandScore, 0) / zones.length)
    : 0;
  const level = classifyDemand(avgScore);

  // Nearest HIGH zone by actual distance
  const highZones = zones.filter((z: any) => z.demandLevel === 'HIGH');
  const nearestHigh = highZones.length
    ? highZones.reduce((n: any, z: any) => (!n || z.distanceKm < n.distanceKm ? z : n), null)
    : null;

  const pct = level === 'HIGH' ? [0.04, 0.06] : level === 'MEDIUM' ? [0.03, 0.05] : [0.01, 0.02];
  const suggestionQty = `${Math.round(totalKg * pct[0])}–${Math.round(totalKg * pct[1])} kg`;

  const zoneNote = nearestHigh
    ? (level === 'HIGH'
      ? `The nearest high-demand zone is ${nearestHigh.name} (${nearestHigh.distanceKm} km away) with ${nearestHigh.totalDemandKg} kg demand.`
      : `Note: ${nearestHigh.name} shows high demand at ${nearestHigh.distanceKm} km.`)
    : '';

  const recommendation =
    level === 'HIGH'
      ? `Demand for ${productName} is currently HIGH across ${zones.length} zones within 50 km. ${zoneNote} Consider targeting buyers in highlighted zones. You may be able to sell at or above market price.`
      : level === 'MEDIUM'
      ? `Moderate demand detected for ${productName} across ${zones.length} zones. ${zoneNote} Consider listing your produce and matching with nearby buyer requirements for steady sales.`
      : `Current demand for ${productName} in your area is low across ${zones.length} zones. Consider expanding your delivery radius or waiting for seasonal demand to pick up.`;

  return {
    productName,
    demandLevel: level,
    demandScore: avgScore,
    potentialDemandKg: totalKg,
    suggestedQuantity: suggestionQty,
    nearbyBuyers: totalBuyers,
    recommendation,
    seasonalTrend: seasonalFactor > 1.0 ? 'UPWARD' : seasonalFactor < 1.0 ? 'DOWNWARD' : 'STABLE',
  };
}

// ─── Nearby demand (used by dashboard widget) ───────────────────

export function getNearbyDemand(lat: number, lng: number, radiusKm = 25) {
  return PRODUCTS.map((product) => {
    const heatmap = generateHeatmapData(product, lat, lng, radiusKm);
    const { zones, seasonalFactor } = heatmap;
    const avgScore = zones.length
      ? Math.round(zones.reduce((s: number, z: any) => s + z.demandScore, 0) / zones.length)
      : 0;

    return {
      productName: product,
      demandScore: avgScore,
      demandLevel: classifyDemand(avgScore),
      estimatedDemandKg: zones.reduce((s: number, z: any) => s + z.totalDemandKg, 0),
      activeBuyerCount: zones.reduce((s: number, z: any) => s + z.activeBuyers, 0),
      b2bReqCount: zones.reduce((s: number, z: any) => s + z.b2bRequirements, 0),
      avgPricePerKg: zones.length ? Math.round(zones.reduce((s: number, z: any) => s + z.avgOfferedPrice, 0) / zones.length) : null,
      seasonalFactor,
    };
  }).sort((a, b) => b.demandScore - a.demandScore);
}

// ─── Product-specific demand (used by /product/:name endpoint) ──

export function getProductDemand(productName: string, lat: number, lng: number, radiusKm = 50) {
  const heatmap = generateHeatmapData(productName, lat, lng, radiusKm);
  const { zones, seasonalFactor } = heatmap;
  const avgScore = zones.length
    ? Math.round(zones.reduce((s: number, z: any) => s + z.demandScore, 0) / zones.length)
    : 0;

  return {
    productName,
    demandScore: avgScore,
    demandLevel: classifyDemand(avgScore),
    estimatedDemandKg: zones.reduce((s: number, z: any) => s + z.totalDemandKg, 0),
    recentOrderCount: zones.reduce((s: number, z: any) => s + Math.round(z.totalDemandKg / 200), 0),
    activeBuyerCount: zones.reduce((s: number, z: any) => s + z.activeBuyers, 0),
    b2bReqCount: zones.reduce((s: number, z: any) => s + z.b2bRequirements, 0),
    avgPricePerKg: zones.length ? Math.round(zones.reduce((s: number, z: any) => s + z.avgOfferedPrice, 0) / zones.length) : null,
    seasonalFactor,
    zones: zones.slice(0, 5),
  };
}
