import { prisma } from '../utils/prisma';

// ═══════════════════════════════════════════════
// EXPORT ELIGIBILITY RULES ENGINE
// ═══════════════════════════════════════════════

const EXPORT_RULES: Record<string, Record<string, any>> = {
  'VEGETABLES': { coldChain: true, shelfLife: 'short', bulkShipment: 'limited', exportPotential: 'MEDIUM' },
  'FRUITS': { coldChain: true, shelfLife: 'short', bulkShipment: 'limited', exportPotential: 'MEDIUM' },
  'GRAINS': { coldChain: false, shelfLife: 'long', bulkShipment: 'excellent', exportPotential: 'HIGH' },
  'PULSES': { coldChain: false, shelfLife: 'long', bulkShipment: 'excellent', exportPotential: 'HIGH' },
  'SPICES': { coldChain: false, shelfLife: 'long', bulkShipment: 'excellent', exportPotential: 'HIGH' },
  'DAIRY': { coldChain: true, shelfLife: 'very_short', bulkShipment: 'limited', exportPotential: 'LOW' },
  'PROCESSED': { coldChain: false, shelfLife: 'medium', bulkShipment: 'good', exportPotential: 'HIGH' },
  'OTHER': { coldChain: false, shelfLife: 'medium', bulkShipment: 'good', exportPotential: 'MEDIUM' },
};

const COLD_CHAIN_DESTINATIONS = ['Germany', 'UK', 'USA', 'Canada', 'Japan', 'South Korea', 'Australia'];
const EASY_EXPORT_DESTINATIONS = ['UAE', 'Dubai', 'Singapore', 'Malaysia', 'Nepal', 'Bangladesh', 'Sri Lanka'];
const RESTRICTED_DESTINATIONS = ['Pakistan', 'China'];

function checkExportFeasibility(product: any, destination: string, quantity: number) {
  const rules = EXPORT_RULES[product.category] || EXPORT_RULES['OTHER'];
  const issues: string[] = [];
  let feasible = true;

  if (RESTRICTED_DESTINATIONS.includes(destination)) {
    return { status: '🔴 Currently Not Supported', feasible: false, reasons: ['Trade restrictions with destination country'] };
  }

  if (rules.coldChain && COLD_CHAIN_DESTINATIONS.includes(destination) && quantity > 5000) {
    issues.push('Large cold-chain shipment to ' + destination + ' requires specialized logistics');
  }
  if (quantity < (product.moq || 0)) {
    issues.push('Quantity below Minimum Order Quantity');
    feasible = false;
  }
  if (rules.shelfLife === 'very_short' && !EASY_EXPORT_DESTINATIONS.includes(destination)) {
    issues.push('Very short shelf life — not recommended for distant destinations');
    feasible = false;
  }
  if (rules.bulkShipment === 'limited' && quantity > 10000) {
    issues.push('Large quantity may require special handling for fresh produce');
  }

  if (!feasible) return { status: '🔴 Currently Not Supported', feasible: false, reasons: issues };
  if (issues.length > 0) return { status: '🟡 Verification Required', feasible: true, reasons: issues, requirements: ['Export partner verification', 'Logistics feasibility check'] };
  return { status: '🟢 Potentially Feasible', feasible: true, reasons: [], requirements: [] };
}

// ═══════════════════════════════════════════════
// AI SUPPLIER MATCHING
// ═══════════════════════════════════════════════

function calculateMatchScore(product: any, rfq: any): any {
  let productScore = 0;
  let quantityScore = 0;
  let qualityScore = 0;
  let timelineScore = 0;
  let readinessScore = 0;

  // Product match (30%)
  if (product.productName.toLowerCase().includes(rfq.productRequired.toLowerCase()) ||
      rfq.productRequired.toLowerCase().includes(product.productName.toLowerCase())) {
    productScore = 30;
  } else if (product.category === rfq.category) {
    productScore = 15;
  }

  // Quantity capacity (20%)
  if (product.availableQuantity >= rfq.requiredQuantity) {
    quantityScore = 20;
  } else {
    quantityScore = Math.round((product.availableQuantity / rfq.requiredQuantity) * 20);
  }

  // Quality match (15%)
  if (rfq.qualityRequirements) {
    if (product.qualityGrade === 'A' || product.qualityGrade === 'PREMIUM') qualityScore = 15;
    else if (product.qualityGrade === 'B') qualityScore = 10;
    else qualityScore = 5;
  } else {
    qualityScore = 12;
  }

  // Timeline (15%)
  if (product.upcomingHarvest || product.advanceBooking) timelineScore = 12;
  else timelineScore = 10;

  // Export readiness (10%)
  if (product.exportStatus === 'EXPORT_ELIGIBLE') readinessScore = 10;
  else if (product.exportStatus === 'EXPORT_ELIGIBLE_WITH_VERIFICATION') readinessScore = 7;
  else readinessScore = 3;

  const totalScore = productScore + quantityScore + qualityScore + timelineScore + readinessScore;

  let matchLevel = 'Weak Match';
  if (totalScore >= 90) matchLevel = 'Excellent Match';
  else if (totalScore >= 75) matchLevel = 'Strong Match';
  else if (totalScore >= 60) matchLevel = 'Possible Match';

  return { totalScore, matchLevel, productScore, quantityScore, qualityScore, timelineScore, readinessScore, locationScore: 3, reliabilityScore: 5 };
}

// ═══════════════════════════════════════════════
// SUPPLY AGGREGATION
// ═══════════════════════════════════════════════

function aggregateSupply(matches: any[], requiredQuantity: number) {
  const sorted = [...matches].sort((a, b) => b.matchScore - a.matchScore);
  const selected: any[] = [];
  let totalAvailable = 0;

  for (const match of sorted) {
    if (totalAvailable >= requiredQuantity) break;
    selected.push(match);
    totalAvailable += match.product?.availableQuantity || 0;
  }

  const matchPercentage = Math.min(100, Math.round((totalAvailable / requiredQuantity) * 100));

  return { suppliers: selected, totalAvailable, requiredQuantity, matchPercentage };
}

// ═══════════════════════════════════════════════
// SHIPPING COST ESTIMATION
// ═══════════════════════════════════════════════

function estimateShipping(productValue: number, quantity: number, method: string, destination: string) {
  const rates: Record<string, any> = {
    'SEA_FREIGHT': { base: 500, perKg: 0.5, transit: '25-40 days', handling: 200, insurance: productValue * 0.02 },
    'AIR_FREIGHT': { base: 2000, perKg: 3.5, transit: '5-10 days', handling: 500, insurance: productValue * 0.03 },
    'COURIER': { base: 1000, perKg: 8, transit: '3-7 days', handling: 300, insurance: productValue * 0.025 },
    'TEMPERATURE_CONTROLLED': { base: 3000, perKg: 5, transit: '15-25 days', handling: 800, insurance: productValue * 0.04 },
  };

  const rate = rates[method] || rates['SEA_FREIGHT'];
  const intlMultiplier = EASY_EXPORT_DESTINATIONS.includes(destination) ? 0.8 : COLD_CHAIN_DESTINATIONS.includes(destination) ? 1.4 : 1.1;

  const inlandTransport = quantity * 0.3;
  const packagingCost = quantity * 0.5;
  const freightCost = (rate.base + rate.perKg * quantity) * intlMultiplier;
  const handlingCost = rate.handling;
  const insuranceCost = rate.insurance;
  const documentationCost = 300;
  const totalEstimate = productValue + packagingCost + inlandTransport + handlingCost + freightCost + insuranceCost + documentationCost;

  return {
    shippingMethod: method,
    productValue,
    packagingCost: Math.round(packagingCost),
    inlandTransport: Math.round(inlandTransport),
    handlingCost,
    freightCost: Math.round(freightCost),
    insuranceCost: Math.round(insuranceCost),
    documentationCost,
    totalEstimate: Math.round(totalEstimate),
    transitDays: rate.transit,
    dataSource: 'DEMO_SIMULATED',
    notes: 'Demo/Simulated Estimate — final cost may vary based on shipment size, route, carrier quote, documentation and destination requirements.',
  };
}

// ═══════════════════════════════════════════════
// SERVICE CLASS
// ═══════════════════════════════════════════════

export class GlobalTradeService {

  // ─── Buyer Profile ───
  async getBuyerProfile(userId: string) {
    return prisma.globalBuyerProfile.findUnique({ where: { userId } });
  }

  async upsertBuyerProfile(userId: string, data: any) {
    return prisma.globalBuyerProfile.upsert({
      where: { userId },
      create: { userId, ...data },
      update: data,
    });
  }

  // ─── Products ───
  async getGlobalProducts(filters: any = {}) {
    const where: any = { isActive: true };
    if (filters.category) where.category = filters.category;
    if (filters.exportStatus) where.exportStatus = filters.exportStatus;
    if (filters.originState) where.originState = filters.originState;
    if (filters.search) {
      // SQLite LIKE is case-insensitive by default; Postgres needs explicit mode
      const isPostgres = (process.env.DB_PROVIDER || 'sqlite').toLowerCase() === 'postgres';
      where.productName = isPostgres
        ? { contains: filters.search, mode: 'insensitive' }
        : { contains: filters.search };
    }
    if (filters.minQuantity) where.availableQuantity = { gte: parseFloat(filters.minQuantity) };
    if (filters.coldChain !== undefined) where.coldChainRequired = filters.coldChain === 'true';

    const products = await prisma.globalProductListing.findMany({
      where,
      include: { user: { select: { id: true, name: true, role: true } } },
      orderBy: { createdAt: 'desc' },
      take: parseInt(filters.limit || '50'),
      skip: parseInt(filters.offset || '0'),
    });

    const total = await prisma.globalProductListing.count({ where });
    return { products, total };
  }

  async getGlobalProduct(id: string) {
    return prisma.globalProductListing.findUnique({
      where: { id },
      include: { user: { select: { id: true, name: true, role: true } }, eligibility: true },
    });
  }

  async createGlobalProduct(data: any, userId: string) {
    return prisma.globalProductListing.create({
      data: { ...data, farmerId: userId },
    });
  }

  async getMyGlobalProducts(userId: string) {
    return prisma.globalProductListing.findMany({
      where: { farmerId: userId },
      include: { user: { select: { id: true, name: true, role: true } } },
      orderBy: { createdAt: 'desc' },
    });
  }

  async deactivateGlobalProduct(id: string, userId: string) {
    const listing = await prisma.globalProductListing.findUnique({ where: { id } });
    if (!listing) throw new Error('Listing not found');
    if (listing.farmerId !== userId) throw new Error('Not authorized to modify this listing');
    return prisma.globalProductListing.update({ where: { id }, data: { isActive: false } });
  }

  // ─── RFQ ───
  async createRFQ(data: any, userId: string) {
    // Look up the user's GlobalBuyerProfile — create one if missing
    let profile = await prisma.globalBuyerProfile.findUnique({ where: { userId } });
    if (!profile) {
      const user = await prisma.user.findUnique({ where: { id: userId } });
      profile = await prisma.globalBuyerProfile.create({
        data: {
          userId,
          companyName: data.companyName || user?.name || 'Global Buyer',
          country: data.destinationCountry || 'Unknown',
          city: data.destinationCity || '',
          buyerType: 'IMPORTER',
        },
      });
    }

    const rfq = await prisma.exportRFQ.create({
      data: {
        buyerId: profile.id,
        productRequired: data.productRequired,
        requiredQuantity: data.requiredQuantity,
        unit: data.unit || 'kg',
        destinationCountry: data.destinationCountry,
        destinationCity: data.destinationCity,
        destinationPort: data.destinationPort,
        deliveryTimeline: data.deliveryTimeline,
        qualityRequirements: data.qualityRequirements,
        packagingRequirements: data.packagingRequirements,
        coldChainRequired: data.coldChainRequired || false,
        targetPrice: data.targetPrice,
        preferredCurrency: data.preferredCurrency || 'USD',
        additionalNotes: data.additionalNotes,
      },
    });

    // Auto-create items if provided
    if (data.items && Array.isArray(data.items)) {
      for (const item of data.items) {
        await prisma.exportRFQItem.create({
          data: { rfqId: rfq.id, productName: item.productName, quantity: item.quantity, unit: item.unit || 'kg', qualityGrade: item.qualityGrade, specialReqs: item.specialReqs, productId: item.productId },
        });
      }
    }

    // Auto-run supplier matching
    await this.runSupplierMatching(rfq.id);

    return rfq;
  }

  async getRFQs(userId?: string, filters: any = {}) {
    const where: any = {};
    if (userId) {
      // Look up the global buyer profile for this user
      const profile = await prisma.globalBuyerProfile.findUnique({ where: { userId } });
      if (profile) {
        where.buyerId = profile.id;
      } else {
        // No global buyer profile — return empty
        return [];
      }
    }
    if (filters.status) where.status = filters.status;

    return prisma.exportRFQ.findMany({
      where,
      include: {
        buyer: { include: { user: { select: { name: true, email: true } } } },
        items: true,
        matches: { include: { user: { select: { name: true } } } },
        aggregations: true,
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async getRFQ(id: string) {
    return prisma.exportRFQ.findUnique({
      where: { id },
      include: {
        buyer: { include: { user: { select: { name: true, email: true } } } },
        items: true,
        matches: { include: { user: { select: { name: true, role: true } }, product: true }, orderBy: { matchScore: 'desc' } },
        aggregations: { include: { suppliers: { include: { user: { select: { name: true } } } } } },
        offers: { include: { user: { select: { name: true } } } },
        shipping: true,
      },
    });
  }

  // ─── Supplier Matching ───
  async runSupplierMatching(rfqId: string) {
    const rfq = await prisma.exportRFQ.findUnique({ where: { id: rfqId } });
    if (!rfq) throw new Error('RFQ not found');

    const products = await prisma.globalProductListing.findMany({
      where: { isActive: true, exportStatus: { not: 'LOCAL_ONLY' } },
    });

    // Score each product against the RFQ
    const matches: any[] = [];
    for (const product of products) {
      const rfqLike = { productRequired: rfq.productRequired, requiredQuantity: rfq.requiredQuantity, qualityRequirements: rfq.qualityRequirements, category: '' };
      const score = calculateMatchScore(product, rfqLike);
      if (score.totalScore > 30) {
        const existing = await prisma.exportSupplierMatch.findFirst({
          where: { rfqId, farmerId: product.farmerId },
        });
        if (!existing) {
          const match = await prisma.exportSupplierMatch.create({
            data: {
              rfqId,
              productId: product.id,
              farmerId: product.farmerId,
              matchScore: score.totalScore,
              productScore: score.productScore,
              quantityScore: score.quantityScore,
              qualityScore: score.qualityScore,
              timelineScore: score.timelineScore,
              readinessScore: score.readinessScore,
              locationScore: score.locationScore,
              reliabilityScore: score.reliabilityScore,
            },
          });
          matches.push(match);
        }
      }
    }

    // Auto-run supply aggregation if top matches don't cover the full quantity
    if (matches.length > 0) {
      await this.runSupplyAggregation(rfqId);
    }

    return matches;
  }

  // ─── Supply Aggregation ───
  async runSupplyAggregation(rfqId: string) {
    const rfq = await prisma.exportRFQ.findUnique({ where: { id: rfqId } });
    if (!rfq) throw new Error('RFQ not found');

    const matches = await prisma.exportSupplierMatch.findMany({
      where: { rfqId },
      include: { product: true },
      orderBy: { matchScore: 'desc' },
    });

    const result = aggregateSupply(matches, rfq.requiredQuantity);

    // Remove old aggregation — delete child suppliers first to respect the FK
    const priorAggs = await prisma.supplyAggregation.findMany({ where: { rfqId }, select: { id: true } });
    if (priorAggs.length > 0) {
      await prisma.supplyAggregationSupplier.deleteMany({
        where: { aggregationId: { in: priorAggs.map(a => a.id) } },
      });
    }
    await prisma.supplyAggregation.deleteMany({ where: { rfqId } });

    const aggregation = await prisma.supplyAggregation.create({
      data: {
        rfqId,
        totalRequired: result.requiredQuantity,
        totalAvailable: result.totalAvailable,
        matchPercentage: result.matchPercentage,
        status: 'PROPOSED',
        consolidationHub: 'Delhi NCR Collection Hub',
        notes: `AI Supply Aggregation: ${result.suppliers.length} suppliers identified covering ${result.matchPercentage}% of demand.`,
      },
    });

    for (const supplier of result.suppliers) {
      const product = supplier.product;
      await prisma.supplyAggregationSupplier.create({
        data: {
          aggregationId: aggregation.id,
          farmerId: supplier.farmerId,
          productId: supplier.productId || undefined,
          quantity: product?.availableQuantity || 0,
          quality: product?.qualityGrade || 'A',
          location: product?.originState || 'India',
          exportReadiness: product?.exportStatus || 'PENDING',
          status: 'PROPOSED',
        },
      });
    }

    return aggregation;
  }

  // ─── Offers ───
  async createOffer(data: any, farmerId: string) {
    // Derive the buyer profile from the RFQ when the caller does not supply it
    const rfq = await prisma.exportRFQ.findUnique({ where: { id: data.rfqId } });
    if (!rfq) throw new Error('RFQ not found');
    return prisma.exportOffer.create({
      data: { ...data, farmerId, buyerId: data.buyerId || rfq.buyerId },
    });
  }

  async acceptOffer(offerId: string, buyerId: string) {
    const offer = await prisma.exportOffer.update({
      where: { id: offerId },
      data: { status: 'ACCEPTED' },
    });

    // Reject other offers for same RFQ
    await prisma.exportOffer.updateMany({
      where: { rfqId: offer.rfqId, id: { not: offerId } },
      data: { status: 'REJECTED' },
    });

    // Update RFQ status
    await prisma.exportRFQ.update({
      where: { id: offer.rfqId },
      data: { status: 'OFFER_ACCEPTED' },
    });

    return offer;
  }

  // ─── Shipping Estimates ───
  async getShippingEstimate(rfqId: string) {
    // Return existing estimates first, generate if none exist
    const existing = await prisma.shippingEstimate.findMany({ where: { rfqId } });
    if (existing.length > 0) return existing;

    const rfq = await prisma.exportRFQ.findUnique({ where: { id: rfqId } });
    if (!rfq) throw new Error('RFQ not found');

    const productValue = rfq.targetPrice ? rfq.targetPrice * rfq.requiredQuantity : rfq.requiredQuantity * 100;
    const methods = ['SEA_FREIGHT', 'AIR_FREIGHT', 'TEMPERATURE_CONTROLLED'];
    if (rfq.requiredQuantity < 500) methods.push('COURIER');

    const estimates = methods.map(method => estimateShipping(productValue, rfq.requiredQuantity, method, rfq.destinationCountry));

    for (const est of estimates) {
      await prisma.shippingEstimate.create({ data: { ...est, rfqId, currency: rfq.preferredCurrency || 'USD' } });
    }

    return prisma.shippingEstimate.findMany({ where: { rfqId } });
  }

  // ─── Shipments ───
  async createShipment(rfqId: string, data: any) {
    const shipment = await prisma.exportShipment.create({
      data: { ...data, rfqId, status: 'CREATED' },
    });

    await prisma.exportShipmentStatus.create({
      data: { shipmentId: shipment.id, status: 'CREATED', notes: 'Shipment created' },
    });

    return shipment;
  }

  async updateShipmentStatus(shipmentId: string, status: string, notes?: string) {
    const shipment = await prisma.exportShipment.update({
      where: { id: shipmentId },
      data: { status },
    });

    await prisma.exportShipmentStatus.create({
      data: { shipmentId, status, notes },
    });

    return shipment;
  }

  // ─── Eligibility ───
  async checkEligibility(productId: string, destination: string, quantity: number) {
    const product = await prisma.globalProductListing.findUnique({ where: { id: productId } });
    if (!product) throw new Error('Product not found');

    const result = checkExportFeasibility(product, destination, quantity);

    // Save eligibility check
    const existing = await prisma.exportEligibility.findFirst({ where: { productId, destination } });
    if (existing) {
      await prisma.exportEligibility.update({
        where: { id: existing.id },
        data: { status: result.status, feasible: result.feasible, reasons: JSON.stringify(result.reasons), requirements: JSON.stringify(result.requirements) },
      });
    } else {
      await prisma.exportEligibility.create({
        data: { productId, destination, status: result.status, feasible: result.feasible, reasons: JSON.stringify(result.reasons), requirements: JSON.stringify(result.requirements) },
      });
    }

    return result;
  }

  // ─── Admin Stats ───
  async getAdminStats() {
    const [totalRfqs, totalProducts, totalBuyers, totalOffers, totalShipments] = await Promise.all([
      prisma.exportRFQ.count(),
      prisma.globalProductListing.count(),
      prisma.globalBuyerProfile.count(),
      prisma.exportOffer.count(),
      prisma.exportShipment.count(),
    ]);

    const rfqsByStatus = await prisma.exportRFQ.groupBy({ by: ['status'], _count: true });
    const productsByExportStatus = await prisma.globalProductListing.groupBy({ by: ['exportStatus'], _count: true });

    return { totalRfqs, totalProducts, totalBuyers, totalOffers, totalShipments, rfqsByStatus, productsByExportStatus };
  }
}

export const globalTradeService = new GlobalTradeService();
