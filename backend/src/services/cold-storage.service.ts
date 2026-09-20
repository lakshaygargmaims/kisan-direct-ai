import { prisma } from '../utils/prisma';

// ═══════════════════════════════════════════════
// SMART COLD STORAGE SERVICE
// Store now, sell later — with AI selling insights.
// AI outputs are ESTIMATES, never guaranteed prices.
// ═══════════════════════════════════════════════

function haversineKm(lat1: number, lng1: number, lat2: number, lng2: number): number {
  const R = 6371;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLng = ((lng2 - lng1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLng / 2) *
      Math.sin(dLng / 2);
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

function round2(n: number): number {
  return Math.round(n * 100) / 100;
}

function parseJsonArray(s: string | null | undefined): string[] {
  try {
    const v = JSON.parse(s || '[]');
    return Array.isArray(v) ? v : [];
  } catch {
    return [];
  }
}

/** Generate batch code like KDA-POT-2026-000123 */
async function generateBatchCode(productName: string): Promise<string> {
  const slug = productName.replace(/[^a-zA-Z]/g, '').slice(0, 3).toUpperCase() || 'PRD';
  const year = new Date().getFullYear();
  const count = await prisma.storedBatch.count();
  return `KDA-${slug}-${year}-${String(count + 1).padStart(6, '0')}`;
}

/** Random URL-safe token for public QR traceability */
function generateQrToken(): string {
  return require('crypto').randomBytes(16).toString('hex');
}

// ═══════════════════════════════════════════════
// FACILITIES
// ═══════════════════════════════════════════════

export class ColdStorageService {
  async getFacilities(query: any) {
    const { lat, lng, radius, crop, includeFull } = query;
    const facilities = await prisma.coldStorageFacility.findMany({
      where: { isActive: true },
    });

    const latNum = lat ? parseFloat(lat) : 28.4595; // default: Gurugram
    const lngNum = lng ? parseFloat(lng) : 77.0266;
    const radiusNum = radius ? parseFloat(radius) : 100;

    let result = facilities.map((f: any) => {
      const crops = parseJsonArray(f.supportedCrops);
      return {
        ...f,
        supportedCrops: crops,
        distanceKm: round2(haversineKm(latNum, lngNum, f.latitude, f.longitude)),
        isFull: f.availableCapacityKg <= 0,
        capacityPercent: Math.round(((f.capacityKg - f.availableCapacityKg) / f.capacityKg) * 100),
      };
    });

    if (crop) {
      result = result.filter((f: any) =>
        f.supportedCrops.some((c: string) => c.toLowerCase().includes(String(crop).toLowerCase()))
      );
    }
    result = result.filter((f: any) => f.distanceKm <= radiusNum);
    if (!includeFull || includeFull === 'false') {
      result = result.filter((f: any) => !f.isFull);
    }
    result.sort((a: any, b: any) => a.distanceKm - b.distanceKm);
    return { facilities: result, total: result.length };
  }

  async getFacility(id: string) {
    const facility = await prisma.coldStorageFacility.findUnique({ where: { id } });
    if (!facility) return null;
    return {
      ...facility,
      supportedCrops: parseJsonArray(facility.supportedCrops),
    };
  }

  /** Preview cost without booking */
  async quote(facilityId: string, body: any) {
    const facility = await prisma.coldStorageFacility.findUnique({ where: { id: facilityId } });
    if (!facility) throw new Error('Facility not found');

    const qty = parseFloat(body.quantityKg);
    const days = parseInt(body.durationDays);
    if (!qty || qty <= 0) throw new Error('Quantity must be positive');
    if (!days || days <= 0) throw new Error('Duration must be positive');
    if (qty < facility.minQuantityKg) throw new Error(`Minimum quantity is ${facility.minQuantityKg} kg`);
    if (qty > facility.availableCapacityKg) throw new Error(`Only ${facility.availableCapacityKg} kg available`);
    if (days > facility.maxDurationDays) throw new Error(`Maximum storage duration is ${facility.maxDurationDays} days`);

    const storageCost = round2(qty * facility.pricePerKgPerDay * days);
    const platformFee = round2((storageCost * facility.platformFeePercent) / 100);
    const deposit = round2((storageCost * facility.depositPercent) / 100);
    const total = round2(storageCost + platformFee + deposit);

    return {
      productName: body.productName,
      quantityKg: qty,
      durationDays: days,
      ratePerKgPerDay: facility.pricePerKgPerDay,
      storageCost,
      platformFeePercent: facility.platformFeePercent,
      platformFee,
      depositPercent: facility.depositPercent,
      deposit,
      total,
      calculation: `${qty} kg × ₹${facility.pricePerKgPerDay}/kg/day × ${days} days = ₹${storageCost}`,
    };
  }

  // ═══════════════════════════════════════════════
  // BOOKING → creates ACTIVE booking + batch, deducts capacity
  // ═══════════════════════════════════════════════

  async createBooking(farmerId: string, body: any) {
    const { facilityId, productName, quantityKg, qualityGrade, harvestDate, startDate, durationDays, packaging, specialReqs } = body;

    if (!facilityId || !productName || !quantityKg || !durationDays) {
      throw new Error('facilityId, productName, quantityKg and durationDays are required');
    }

    const quote = await this.quote(facilityId, { productName, quantityKg, durationDays });
    const facility = await prisma.coldStorageFacility.findUnique({ where: { id: facilityId } });
    if (!facility) throw new Error('Facility not found');

    const start = startDate ? new Date(startDate) : new Date();
    const end = new Date(start);
    end.setDate(end.getDate() + quote.durationDays);

    // Transaction: check capacity → deduct → create booking → create batch atomically
    const result = await prisma.$transaction(async (tx: any) => {
      const fresh = await tx.coldStorageFacility.findUnique({ where: { id: facilityId } });
      if (!fresh) throw new Error('Facility not found');
      if (fresh.availableCapacityKg < quote.quantityKg) {
        throw new Error(`Capacity changed — only ${fresh.availableCapacityKg} kg now available`);
      }

      await tx.coldStorageFacility.update({
        where: { id: facilityId },
        data: { availableCapacityKg: { decrement: quote.quantityKg } },
      });

      const booking = await tx.storageBooking.create({
        data: {
          farmerId,
          facilityId,
          productName,
          quantityKg: quote.quantityKg,
          qualityGrade: qualityGrade || 'A',
          harvestDate: harvestDate ? new Date(harvestDate) : null,
          startDate: start,
          durationDays: quote.durationDays,
          ratePerKgPerDay: quote.ratePerKgPerDay,
          storageCost: quote.storageCost,
          platformFee: quote.platformFee,
          deposit: quote.deposit,
          totalAmount: quote.total,
          packaging: packaging || null,
          specialReqs: specialReqs || null,
          status: 'ACTIVE',
          paymentStatus: 'PAID', // demo wallet payment
        },
      });

      // Demo payment record
      await tx.storagePayment.create({
        data: {
          bookingId: booking.id,
          farmerId,
          amount: quote.total,
          type: 'STORAGE',
          method: 'DEMO_WALLET',
          status: 'COMPLETED',
          transactionId: 'STX-' + Date.now() + '-' + Math.floor(Math.random() * 10000),
        },
      });

      const batch = await tx.storedBatch.create({
        data: {
          batchCode: await generateBatchCode(productName),
          qrToken: generateQrToken(),
          farmerId,
          facilityId,
          bookingId: booking.id,
          productName,
          initialQtyKg: quote.quantityKg,
          currentQtyKg: quote.quantityKg,
          qualityGrade: qualityGrade || 'A',
          harvestDate: harvestDate ? new Date(harvestDate) : null,
          expectedEndDate: end,
          tempRequired: `${facility.tempMinC}°C to ${facility.tempMaxC}°C`,
          status: 'STORED',
        },
      });

      return { booking, batch };
    });

    return result;
  }

  async getMyBookings(farmerId: string) {
    const bookings = await prisma.storageBooking.findMany({
      where: { farmerId },
      include: { facility: { select: { id: true, name: true, city: true } }, batch: true },
      orderBy: { createdAt: 'desc' },
    });
    return { bookings };
  }

  async getMyPayments(farmerId: string) {
    const payments = await prisma.storagePayment.findMany({
      where: { farmerId },
      include: { booking: { select: { id: true, productName: true, facility: { select: { name: true } } } } },
      orderBy: { createdAt: 'desc' },
    });
    return { payments };
  }

  // ═══════════════════════════════════════════════
  // STORED BATCHES (inventory)
  // ═══════════════════════════════════════════════

  async getMyBatches(farmerId: string) {
    const batches = await prisma.storedBatch.findMany({
      where: { farmerId, status: { notIn: ['WITHDRAWN', 'SOLD_OUT'] } },
      include: {
        facility: { select: { id: true, name: true, city: true, latitude: true, longitude: true } },
        booking: { select: { ratePerKgPerDay: true } },
      },
      orderBy: { createdAt: 'desc' },
    });

    const now = new Date();
    return {
      batches: batches.map((b: any) => {
        const daysStored = Math.max(0, Math.floor((now.getTime() - new Date(b.storedAt).getTime()) / 86400000));
        const daysRemaining = Math.max(0, Math.ceil((new Date(b.expectedEndDate).getTime() - now.getTime()) / 86400000));
        const rate = b.booking?.ratePerKgPerDay ?? 0;
        const costAccrued = round2(b.currentQtyKg * rate * daysStored);
        return {
          ...b,
          daysStored,
          daysRemaining,
          costAccrued,
          availableToSell: round2(b.currentQtyKg - b.listedQtyKg),
        };
      }),
    };
  }

  async getBatch(farmerId: string, batchId: string) {
    const batch = await prisma.storedBatch.findFirst({
      where: { id: batchId, farmerId },
      include: {
        facility: true,
        booking: true,
      },
    });
    if (!batch) return null;
    const insight = await this.getSellingInsight(batch.productName, batch.currentQtyKg, batch);
    return {
      ...batch,
      availableToSell: round2(batch.currentQtyKg - batch.listedQtyKg),
      insight,
    };
  }

  /** Public-safe traceability via QR token — no farmer personal data */
  async getBatchByQrToken(token: string) {
    const batch = await prisma.storedBatch.findUnique({
      where: { qrToken: token },
      include: { facility: { select: { name: true, city: true } } },
    });
    if (!batch) return null;
    return {
      batchCode: batch.batchCode,
      productName: batch.productName,
      qualityGrade: batch.qualityGrade,
      harvestDate: batch.harvestDate,
      storedAt: batch.storedAt,
      expectedEndDate: batch.expectedEndDate,
      facilityName: batch.facility.name,
      facilityCity: batch.facility.city,
      tempRequired: batch.tempRequired,
      status: batch.status,
    };
  }

  // ═══════════════════════════════════════════════
  // AI SELLING INSIGHT — estimates only, never guarantees
  // ═══════════════════════════════════════════════

  async getSellingInsight(productName: string, qtyKg: number, batch?: any) {
    // Real platform data: recent orders + current listings + mandi modal price
    const [recentOrders, listings, mandiPrices] = await Promise.all([
      prisma.order.findMany({
        where: {
          product: { name: { contains: productName } },
          createdAt: { gte: new Date(Date.now() - 30 * 86400000) },
        },
        select: { pricePerKg: true, quantity: true },
        take: 50,
      }),
      prisma.product.findMany({
        where: { name: { contains: productName }, isActive: true },
        select: { pricePerKg: true },
        take: 30,
      }),
      // Reuse mandi reference data via direct table if present
      (prisma as any).marketPrice?.findMany({
        where: { product: { contains: productName } },
        orderBy: { date: 'desc' },
        take: 10,
      }) ?? Promise.resolve([]),
    ]);

    const orderAvg = recentOrders.length
      ? recentOrders.reduce((s: number, o: any) => s + o.pricePerKg, 0) / recentOrders.length
      : null;
    const listingAvg = listings.length
      ? listings.reduce((s: number, l: any) => s + l.pricePerKg, 0) / listings.length
      : null;
    const mandiAvg = mandiPrices.length
      ? mandiPrices.reduce((s: number, m: any) => s + m.avgPrice, 0) / mandiPrices.length
      : null;

    // Weighted reference price — platform orders weigh most, then listings, then mandi
    let refPrice: number;
    let dataSource: string;
    if (orderAvg && listingAvg) {
      refPrice = orderAvg * 0.6 + listingAvg * 0.4;
      dataSource = 'LIVE_PLATFORM_DATA';
    } else if (orderAvg) {
      refPrice = orderAvg;
      dataSource = 'RECENT_ORDERS';
    } else if (listingAvg) {
      refPrice = listingAvg;
      dataSource = 'CURRENT_LISTINGS';
    } else if (mandiAvg) {
      refPrice = mandiAvg;
      dataSource = 'MANDI_REFERENCE';
    } else {
      refPrice = 25;
      dataSource = 'DEMO_FALLBACK';
    }

    // Seasonal factor (monsoon lowers supply → usually higher prices Aug-Sep)
    const month = new Date().getMonth();
    const seasonalFactor = month >= 7 && month <= 8 ? 1.08 : month <= 1 || month >= 10 ? 1.05 : 1.0;

    const currentPrice = round2(refPrice);
    // Estimate a range: +5% to +15% potential if stored produce is fresher/graded
    const lowEstimate = round2(refPrice * 1.05 * seasonalFactor);
    const highEstimate = round2(refPrice * 1.18 * seasonalFactor);

    const ratePerKgPerDay = batch?.booking?.ratePerKgPerDay || batch?.ratePerKgPerDay || 1.2;
    const qty = qtyKg || batch?.currentQtyKg || 0;

    // Compare: sell now vs wait 15 more days
    const revenueNow = round2(qty * currentPrice);
    const extraStorage15d = round2(qty * ratePerKgPerDay * 15);
    const revenueLater = round2(qty * ((lowEstimate + highEstimate) / 2));
    const netGainIfWait = round2(revenueLater - revenueNow - extraStorage15d);

    let recommendation: string;
    if (netGainIfWait > extraStorage15d * 0.5) {
      recommendation = 'WAIT_MAY_BE_BETTER';
    } else if (netGainIfWait < 0) {
      recommendation = 'SELL_NOW_LIKELY_BETTER';
    } else {
      recommendation = 'NEUTRAL';
    }

    return {
      currentMarketPrice: currentPrice,
      estimatedPriceRange: { low: lowEstimate, high: highEstimate },
      priceDataSource: dataSource,
      seasonalFactor,
      storageRatePerKgPerDay: ratePerKgPerDay,
      sellNow: {
        quantityKg: qty,
        grossRevenue: revenueNow,
        storageCost: 0,
      },
      wait15Days: {
        grossRevenueEstimate: revenueLater,
        extraStorageCost: extraStorage15d,
        estimatedNetGain: netGainIfWait,
      },
      recommendation,
      confidence: recentOrders.length >= 5 ? 70 : recentOrders.length >= 2 ? 55 : 40,
      disclaimer:
        'Estimated based on available platform data. Market conditions may change. This is NOT a guaranteed price.',
    };
  }

  // ═══════════════════════════════════════════════
  // SELL FROM STORAGE — creates a marketplace listing backed by the batch
  // ═══════════════════════════════════════════════

  async listBatchForSale(farmerId: string, batchId: string, body: any) {
    const qty = parseFloat(body.quantityKg);
    const price = parseFloat(body.pricePerKg);
    if (!qty || qty <= 0) throw new Error('Quantity must be positive');
    if (!price || price <= 0) throw new Error('Price must be positive');

    const result = await prisma.$transaction(async (tx: any) => {
      // Atomic check-and-increment prevents overselling the batch
      const batch = await tx.storedBatch.findFirst({ where: { id: batchId, farmerId } });
      if (!batch) throw new Error('Batch not found');
      if (['WITHDRAWN', 'SOLD_OUT'].includes(batch.status)) throw new Error('Batch is no longer active');
      const available = batch.currentQtyKg - batch.listedQtyKg;
      if (qty > available) throw new Error(`Only ${available} kg available to list from this batch`);

      const fullyListed = batch.listedQtyKg + qty >= batch.currentQtyKg;
      await tx.storedBatch.update({
        where: { id: batchId },
        data: {
          listedQtyKg: { increment: qty },
          status: fullyListed ? 'FULLY_LISTED' : 'PARTIALLY_LISTED',
        },
      });

      // Create marketplace product linked to the batch
      const category = await tx.productCategory.findFirst({ where: { name: 'Vegetables' } });
      const product = await tx.product.create({
        data: {
          name: `${batch.productName} (Cold Storage ${batch.batchCode.slice(-6)})`,
          description: `Fresh from cold storage. Batch ${batch.batchCode}. Traceable quality-graded produce.`,
          pricePerKg: price,
          availableQuantity: qty,
          minOrderQuantity: 1,
          qualityGrade: batch.qualityGrade,
          organicCertified: false,
          coldChainRequired: true,
          harvestDate: batch.harvestDate,
          shelfLife: 30,
          storageRequirement: 'COLD_STORAGE',
          farmerId,
          categoryId: category?.id,
        },
      });

      return { batch: await tx.storedBatch.findUnique({ where: { id: batchId } }), product };
    });

    return result;
  }

  async extendStorage(farmerId: string, batchId: string, body: any) {
    const extraDays = parseInt(body.extraDays);
    if (!extraDays || extraDays <= 0) throw new Error('extraDays must be positive');

    const batch = await prisma.storedBatch.findFirst({
      where: { id: batchId, farmerId },
      include: { booking: true, facility: true },
    });
    if (!batch) throw new Error('Batch not found');

    const facility = batch.facility;
    const newEnd = new Date(batch.expectedEndDate);
    newEnd.setDate(newEnd.getDate() + extraDays);

    const extensionCost = round2(batch.currentQtyKg * batch.booking.ratePerKgPerDay * extraDays);
    const platformFee = round2((extensionCost * facility.platformFeePercent) / 100);

    const [updatedBatch, , payment] = await prisma.$transaction([
      prisma.storedBatch.update({
        where: { id: batchId },
        data: { expectedEndDate: newEnd },
      }),
      prisma.storageBooking.update({
        where: { id: batch.bookingId },
        data: {
          durationDays: { increment: extraDays },
          storageCost: { increment: extensionCost },
          totalAmount: { increment: extensionCost + platformFee },
        },
      }),
      prisma.storagePayment.create({
        data: {
          bookingId: batch.bookingId,
          farmerId,
          amount: extensionCost + platformFee,
          type: 'EXTENSION',
          method: 'DEMO_WALLET',
          status: 'COMPLETED',
          transactionId: 'STX-' + Date.now() + '-' + Math.floor(Math.random() * 10000),
        },
      }),
    ]);

    return {
      batch: updatedBatch,
      extensionCost,
      platformFee,
      paid: extensionCost + platformFee,
      paymentId: payment.id,
    };
  }

  async withdrawBatch(farmerId: string, batchId: string) {
    return prisma.$transaction(async (tx: any) => {
      const batch = await tx.storedBatch.findFirst({ where: { id: batchId, farmerId } });
      if (!batch) throw new Error('Batch not found');
      if (batch.status === 'WITHDRAWN') throw new Error('Batch already withdrawn');
      if (batch.listedQtyKg > batch.soldQtyKg) {
        throw new Error('Cannot withdraw — batch has active listings. Cancel them first.');
      }

      // Return remaining capacity to the facility
      const facility = await tx.coldStorageFacility.findUnique({ where: { id: batch.facilityId } });
      await tx.coldStorageFacility.update({
        where: { id: batch.facilityId },
        data: { availableCapacityKg: { increment: batch.currentQtyKg } },
      });

      const updated = await tx.storedBatch.update({
        where: { id: batchId },
        data: { status: 'WITHDRAWN' },
      });

      await tx.storageBooking.update({
        where: { id: batch.bookingId },
        data: { status: 'COMPLETED' },
      });

      return { batch: updated, refundedCapacityKg: batch.currentQtyKg, facilityAvailableNow: (facility?.availableCapacityKg || 0) + batch.currentQtyKg };
    });
  }

  /** Called internally when a buyer orders a cold-storage product */
  async recordSaleFromBatch(productName: string, qtyKg: number) {
    // Batch-backed listings are named `${batch.productName} (Cold Storage ${code})`.
    // Accept either the plain batch name or the decorated marketplace name.
    const baseName = productName.replace(/\s*\(Cold Storage \d+\)\s*$/, '').trim();
    // Find the batch with listed inventory matching this product (FIFO)
    const batches = await prisma.storedBatch.findMany({
      where: {
        productName: baseName,
        listedQtyKg: { gt: 0 },
        status: { in: ['STORED', 'PARTIALLY_LISTED', 'FULLY_LISTED', 'PARTIALLY_SOLD'] },
      },
      orderBy: { storedAt: 'asc' },
      include: { facility: true },
    });

    let remaining = qtyKg;
    for (const b of batches) {
      if (remaining <= 0) break;
      // listedQtyKg is already net of sales (it decrements with each sale),
      // so it IS the available listed amount. Subtracting soldQtyKg here
      // would double-count and under-sell the batch.
      const take = Math.min(remaining, b.listedQtyKg);
      // Guarded decrement: if a concurrent order already consumed this batch's
      // listed stock, count=0 and we fall through to the next batch instead of
      // driving listedQtyKg negative (oversell).
      const res = await prisma.storedBatch.updateMany({
        where: { id: b.id, listedQtyKg: { gte: take } },
        data: {
          soldQtyKg: { increment: take },
          currentQtyKg: { decrement: take },
          listedQtyKg: { decrement: take },
        },
      });
      if (res.count === 0) continue;
      // Status fix-up (sequential wheres, so SOLD_OUT wins for emptied batches)
      await prisma.storedBatch.updateMany({
        where: { id: b.id, currentQtyKg: { lte: 0 } },
        data: { status: 'SOLD_OUT' },
      });
      await prisma.storedBatch.updateMany({
        where: { id: b.id, currentQtyKg: { gt: 0 } },
        data: { status: 'PARTIALLY_SOLD' },
      });
      remaining -= take;
    }
    return remaining; // qty not covered by cold storage (sold from regular stock)
  }
}

export const coldStorageService = new ColdStorageService();
