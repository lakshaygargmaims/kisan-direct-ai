import { prisma } from '../utils/prisma';
import { Prisma } from '@prisma/client';

export class HarvestService {
  // ─── CRUD ───────────────────────────────────────────────────────
  async createHarvest(farmerId: string, data: any) {
    // Resolve categoryId
    let categoryId = data.categoryId;
    if (categoryId && !categoryId.startsWith('cl')) {
      const cat = await prisma.productCategory.findFirst({ where: { name: categoryId } });
      if (cat) categoryId = cat.id;
    }

    return prisma.expectedHarvest.create({
      data: {
        farmerId,
        productName: data.productName,
        description: data.description,
        categoryId: categoryId || undefined,
        expectedHarvestDate: new Date(data.expectedHarvestDate),
        expectedQuantity: data.expectedQuantity,
        unit: data.unit || 'kg',
        qualityGrade: data.qualityGrade || 'A',
        expectedPricePerUnit: data.expectedPricePerUnit,
        minBookingQuantity: data.minBookingQuantity || 1,
        maxBookingPerBuyer: data.maxBookingPerBuyer,
        farmLatitude: data.farmLatitude,
        farmLongitude: data.farmLongitude,
        farmAddress: data.farmAddress,
        deliveryRadiusKm: data.deliveryRadiusKm || 50,
        deliveryType: data.deliveryType || 'LOCAL',
        coldChainRequired: data.coldChainRequired || false,
        advanceBookingEnabled: data.advanceBookingEnabled !== false,
        advancePercentage: data.advancePercentage || 20,
        bookingOpenDate: data.bookingOpenDate ? new Date(data.bookingOpenDate) : new Date(),
        bookingCloseDate: data.bookingCloseDate ? new Date(data.bookingCloseDate) : undefined,
        notes: data.notes,
        status: 'BOOKING_OPEN',
      },
      include: { farmer: { select: { name: true, id: true } }, category: true, images: true },
    });
  }

  async getHarvests(params: {
    search?: string;
    category?: string;
    status?: string;
    farmerId?: string;
    upcoming?: string;
    lat?: number;
    lng?: number;
    radius?: number;
    page?: number;
    limit?: number;
  }) {
    const { search, category, status, farmerId, upcoming, page = 1, limit = 20 } = params;

    const where: Prisma.ExpectedHarvestWhereInput = {};

    if (farmerId) where.farmerId = farmerId;
    if (category) where.category = { name: { contains: category } };
    if (status) {
      where.status = status;
    } else if (upcoming === 'true') {
      where.status = { in: ['BOOKING_OPEN', 'BOOKING_CLOSED'] };
    }

    if (search) {
      where.OR = [
        { productName: { contains: search } },
        { farmer: { name: { contains: search } } },
      ];
    }

    const offset = (page - 1) * limit;
    const [harvests, total] = await Promise.all([
      prisma.expectedHarvest.findMany({
        where,
        include: {
          farmer: { select: { name: true, id: true } },
          category: true,
          images: true,
          _count: { select: { reservations: true } },
        },
        skip: offset,
        take: limit,
        orderBy: { expectedHarvestDate: 'asc' },
      }),
      prisma.expectedHarvest.count({ where }),
    ]);

    return { harvests, total, page, limit, totalPages: Math.ceil(total / limit) };
  }

  async getHarvestById(id: string) {
    const harvest = await prisma.expectedHarvest.findUnique({
      where: { id },
      include: {
        farmer: { select: { name: true, id: true, email: true } },
        category: true,
        images: true,
        reservations: {
          include: { buyer: { select: { name: true, id: true } } },
          orderBy: { createdAt: 'desc' },
        },
        delays: { orderBy: { createdAt: 'desc' } },
        matches: {
          include: { buyer: { select: { name: true, id: true } } },
          orderBy: { matchScore: 'desc' },
        },
        _count: { select: { reservations: true, matches: true } },
      },
    });
    if (!harvest) throw new Error('Harvest not found');
    return harvest;
  }

  async updateHarvest(id: string, farmerId: string, data: any) {
    const existing = await prisma.expectedHarvest.findFirst({ where: { id, farmerId } });
    if (!existing) throw new Error('Harvest not found or unauthorized');
    if (existing.status !== 'BOOKING_OPEN') throw new Error('Can only edit harvests with BOOKING_OPEN status');
    return prisma.expectedHarvest.update({ where: { id }, data });
  }

  async deleteHarvest(id: string, farmerId: string) {
    const existing = await prisma.expectedHarvest.findFirst({ where: { id, farmerId } });
    if (!existing) throw new Error('Harvest not found or unauthorized');
    if (existing.totalReservedQuantity > 0) throw new Error('Cannot delete harvest with active reservations');
    return prisma.expectedHarvest.delete({ where: { id } });
  }

  // ─── RESERVATION ────────────────────────────────────────────────
  async reserveHarvest(harvestId: string, buyerId: string, data: any) {
    const harvest = await prisma.expectedHarvest.findUnique({ where: { id: harvestId } });
    if (!harvest) throw new Error('Harvest not found');
    if (harvest.status !== 'BOOKING_OPEN') throw new Error('Booking is not open for this harvest');
    if (!harvest.advanceBookingEnabled) throw new Error('Advance booking is not enabled for this harvest');

    const remaining = harvest.expectedQuantity - harvest.totalReservedQuantity;
    if (data.quantity > remaining) throw new Error(`Only ${remaining} ${harvest.unit} available for booking`);

    if (harvest.maxBookingPerBuyer && data.quantity > harvest.maxBookingPerBuyer) {
      throw new Error(`Maximum ${harvest.maxBookingPerBuyer} ${harvest.unit} per buyer`);
    }
    if (data.quantity < harvest.minBookingQuantity) {
      throw new Error(`Minimum booking quantity is ${harvest.minBookingQuantity} ${harvest.unit}`);
    }

    const totalValue = data.quantity * harvest.expectedPricePerUnit;
    const advanceAmount = Math.round(totalValue * (harvest.advancePercentage / 100));

    // Calculate distance for delivery
    const R = 6371;
    const dLat = ((harvest.farmLatitude - data.deliveryLatitude) * Math.PI) / 180;
    const dLng = ((harvest.farmLongitude - data.deliveryLongitude) * Math.PI) / 180;
    const a = Math.sin(dLat / 2) ** 2 + Math.cos((data.deliveryLatitude * Math.PI) / 180) * Math.cos((harvest.farmLatitude * Math.PI) / 180) * Math.sin(dLng / 2) ** 2;
    const distanceKm = Math.round(R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a)) * 10) / 10;

    if (distanceKm > harvest.deliveryRadiusKm) {
      throw new Error(`Delivery address is ${distanceKm} km away, exceeding the ${harvest.deliveryRadiusKm} km delivery radius`);
    }

    const deliveryCharge = Math.round(100 + distanceKm * 18 + (harvest.coldChainRequired ? 50 : 0));

    const reservation = await prisma.$transaction(async (tx) => {
      const res = await tx.harvestReservation.create({
        data: {
          harvestId,
          buyerId,
          quantity: data.quantity,
          pricePerUnit: harvest.expectedPricePerUnit,
          advancePercentage: harvest.advancePercentage,
          advanceAmount,
          totalValue,
          deliveryAddress: data.deliveryAddress,
          deliveryLatitude: data.deliveryLatitude,
          deliveryLongitude: data.deliveryLongitude,
          estimatedDeliveryKm: distanceKm,
          deliveryCharge,
          acknowledged: true,
          status: 'CONFIRMED',
          advancePaymentStatus: 'PAID',
        },
      });

      await tx.expectedHarvest.update({
        where: { id: harvestId },
        data: { totalReservedQuantity: { increment: data.quantity } },
      });

      // Create advance payment
      await tx.harvestPayment.create({
        data: {
          reservationId: res.id,
          amount: advanceAmount,
          type: 'ADVANCE',
          method: 'DEMO_UPI',
          status: 'COMPLETED',
          transactionId: `HRV-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
        },
      });

      // Create notification for farmer
      const farmer = await tx.user.findUnique({ where: { id: harvest.farmerId } });
      const buyer = await tx.user.findUnique({ where: { id: buyerId } });
      if (farmer) {
        const newReserved = harvest.totalReservedQuantity + data.quantity;
        const pct = Math.round((newReserved / harvest.expectedQuantity) * 100);
        await tx.notification.create({
          data: {
            userId: farmer.id,
            title: 'New Advance Booking',
            message: `${buyer?.name || 'A buyer'} reserved ${data.quantity} ${harvest.unit} of ${harvest.productName} (₹${advanceAmount} advance)`,
            type: 'ORDER',
          },
        });
        if (pct >= 70 && pct < 100) {
          await tx.notification.create({
            data: {
              userId: farmer.id,
              title: 'Harvest Nearly Reserved',
              message: `${pct}% of your ${harvest.productName} harvest has been reserved`,
              type: 'SYSTEM',
            },
          });
        }
      }

      // Create notification for buyer
      await tx.notification.create({
        data: {
          userId: buyerId,
          title: 'Advance Booking Confirmed',
          message: `Your reservation of ${data.quantity} ${harvest.unit} ${harvest.productName} is confirmed. Advance: ₹${advanceAmount}`,
          type: 'ORDER',
        },
      });

      return res;
    });

    return this.getReservationById(reservation.id);
  }

  async getReservations(harvestId: string) {
    return prisma.harvestReservation.findMany({
      where: { harvestId },
      include: {
        buyer: { select: { name: true, id: true } },
        payments: true,
        allocations: true,
      },
      orderBy: { createdAt: 'asc' },
    });
  }

  async getReservationById(id: string) {
    return prisma.harvestReservation.findUnique({
      where: { id },
      include: {
        harvest: { include: { farmer: { select: { name: true } } } },
        buyer: { select: { name: true, id: true } },
        payments: true,
        allocations: true,
      },
    });
  }

  async getMyReservations(buyerId: string) {
    return prisma.harvestReservation.findMany({
      where: { buyerId },
      include: {
        harvest: { include: { farmer: { select: { name: true } }, images: true } },
        payments: true,
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  // ─── HARVEST CONFIRMATION ───────────────────────────────────────
  async confirmHarvest(harvestId: string, farmerId: string, data: any) {
    const harvest = await prisma.expectedHarvest.findUnique({
      where: { id: harvestId },
      include: { reservations: true },
    });
    if (!harvest) throw new Error('Harvest not found');
    if (harvest.farmerId !== farmerId) throw new Error('Unauthorized');
    if (harvest.status !== 'BOOKING_OPEN' && harvest.status !== 'BOOKING_CLOSED' && harvest.status !== 'HARVEST_PENDING') {
      throw new Error('This harvest cannot be confirmed yet');
    }

    return prisma.$transaction(async (tx) => {
      // Update harvest
      await tx.expectedHarvest.update({
        where: { id: harvestId },
        data: {
          actualHarvestedQuantity: data.actualQuantity,
          actualQualityGrade: data.actualQualityGrade || harvest.qualityGrade,
          status: 'HARVEST_CONFIRMED',
        },
      });

      const totalReserved = harvest.totalReservedQuantity;
      const actualQty = data.actualQuantity;

      // Shortage handling - proportional allocation
      if (actualQty < totalReserved && harvest.reservations.length > 0) {
        const ratio = actualQty / totalReserved;
        for (const res of harvest.reservations) {
          const adjustedQty = Math.round(res.quantity * ratio * 100) / 100;
          const adjustedTotal = adjustedQty * res.pricePerUnit;
          const adjustedAdvance = Math.round(adjustedTotal * (res.advancePercentage / 100));
          const refund = res.advanceAmount - adjustedAdvance;

          await tx.harvestReservation.update({
            where: { id: res.id },
            data: {
              adjustedQuantity: adjustedQty,
              adjustedAdvance,
              adjustedTotalValue: adjustedTotal,
              refundAmount: Math.max(0, refund),
              status: 'ADJUSTED',
            },
          });

          await tx.harvestAllocation.create({
            data: {
              harvestId,
              reservationId: res.id,
              buyerId: res.buyerId,
              expectedQuantity: res.quantity,
              adjustedQuantity: adjustedQty,
              allocationType: 'PROPORTIONAL',
              reason: `Shortage: ${actualQty} ${harvest.unit} harvested vs ${totalReserved} reserved`,
            },
          });

          // Create refund if needed
          if (refund > 0) {
            await tx.harvestPayment.create({
              data: {
                reservationId: res.id,
                amount: refund,
                type: 'REFUND',
                method: 'DEMO_UPI',
                status: 'COMPLETED',
                transactionId: `HRV-RF-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
              },
            });
            await tx.notification.create({
              data: {
                userId: res.buyerId,
                title: 'Reservation Adjusted',
                message: `Your ${harvest.productName} reservation adjusted from ${res.quantity} to ${adjustedQty} ${harvest.unit}. Refund: ₹${refund}`,
                type: 'ORDER',
              },
            });
          }
        }
      } else {
        // No shortage - mark all as fulfilled
        for (const res of harvest.reservations) {
          await tx.harvestReservation.update({
            where: { id: res.id },
            data: { status: 'FULFILLED' },
          });
        }
      }

      // Notify farmer
      await tx.notification.create({
        data: {
          userId: farmerId,
          title: 'Harvest Confirmed',
          message: `You confirmed ${actualQty} ${harvest.unit} of ${harvest.productName}. ${actualQty < totalReserved ? 'Shortage handling applied.' : 'All reservations fulfilled.'}`,
          type: 'ORDER',
        },
      });

      return tx.expectedHarvest.findUnique({
        where: { id: harvestId },
        include: { reservations: true, allocations: true },
      });
    });
  }

  // ─── DELAY HANDLING ─────────────────────────────────────────────
  async updateHarvestDate(harvestId: string, farmerId: string, data: any) {
    const harvest = await prisma.expectedHarvest.findUnique({ where: { id: harvestId } });
    if (!harvest) throw new Error('Harvest not found');
    if (harvest.farmerId !== farmerId) throw new Error('Unauthorized');

    return prisma.$transaction(async (tx) => {
      await tx.harvestDelay.create({
        data: {
          harvestId,
          originalDate: harvest.expectedHarvestDate,
          newDate: new Date(data.newDate),
          reason: data.reason,
          reasonType: data.reasonType || 'OTHER',
        },
      });

      await tx.expectedHarvest.update({
        where: { id: harvestId },
        data: {
          expectedHarvestDate: new Date(data.newDate),
          newExpectedDate: new Date(data.newDate),
          status: 'DELAYED',
        },
      });

      // Notify all buyers with reservations
      const reservations = await tx.harvestReservation.findMany({ where: { harvestId } });
      for (const res of reservations) {
        await tx.notification.create({
          data: {
            userId: res.buyerId,
            title: 'Harvest Date Updated',
            message: `${harvest.productName} harvest delayed from ${harvest.expectedHarvestDate.toLocaleDateString()} to ${new Date(data.newDate).toLocaleDateString()}. Reason: ${data.reason}`,
            type: 'ORDER',
          },
        });
      }

      return tx.expectedHarvest.findUnique({ where: { id: harvestId } });
    });
  }

  // ─── BUYER MATCHING ─────────────────────────────────────────────
  async getMatches(harvestId: string) {
    const harvest = await prisma.expectedHarvest.findUnique({
      where: { id: harvestId },
      include: { farmer: { include: { FarmerProfile: true } } },
    });
    if (!harvest) throw new Error('Harvest not found');

    // Find buyers who have requirements matching this product
    const requirements = await prisma.buyerRequirement.findMany({
      where: {
        isActive: true,
        productName: { contains: harvest.productName.split(' ')[0] },
      },
      include: { offers: true },
    });

    const matches = requirements.map(req => {
      const buyerLat = (req as any).deliveryLatitude || 28.6;
      const buyerLng = (req as any).deliveryLongitude || 77.2;
      const R = 6371;
      const dLat = ((harvest.farmLatitude - buyerLat) * Math.PI) / 180;
      const dLng = ((harvest.farmLongitude - buyerLng) * Math.PI) / 180;
      const a = Math.sin(dLat / 2) ** 2 + Math.cos((buyerLat * Math.PI) / 180) * Math.cos((harvest.farmLatitude * Math.PI) / 180) * Math.sin(dLng / 2) ** 2;
      const dist = R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

      let score = 50;
      const reasons: string[] = [];
      if (req.productName.toLowerCase().includes(harvest.productName.toLowerCase().split(' ')[0])) { score += 20; reasons.push('Product match'); }
      if (req.quantity <= harvest.expectedQuantity) { score += 15; reasons.push('Quantity available'); }
      if (dist <= harvest.deliveryRadiusKm) { score += 10; reasons.push('Within delivery radius'); }
      if (req.maxPrice && req.maxPrice >= harvest.expectedPricePerUnit) { score += 5; reasons.push('Price compatible'); }

      return {
        buyerId: req.buyerId,
        productName: req.productName,
        requiredQuantity: req.quantity,
        maxPrice: req.maxPrice,
        distance: Math.round(dist * 10) / 10,
        matchScore: Math.min(score, 99),
        matchReasons: reasons,
        deliveryCity: req.deliveryCity,
      };
    });

    return matches.sort((a: any, b: any) => b.matchScore - a.matchScore);
  }

  // ─── AI RECOMMENDATION ──────────────────────────────────────────
  async getAIRecommendation(harvestId: string) {
    const harvest = await prisma.expectedHarvest.findUnique({
      where: { id: harvestId },
      include: { reservations: true },
    });
    if (!harvest) throw new Error('Harvest not found');

    // Check demand for this product
    const demands = await prisma.productDemand.findMany({
      where: { productName: { contains: harvest.productName.split(' ')[0] } },
      orderBy: { demandScore: 'desc' },
      take: 5,
    });

    const nearbyDemand = demands.reduce((sum, d) => sum + d.estimatedDemandKg, 0);
    const highDemandZones = demands.filter(d => d.demandLevel === 'HIGH').length;
    const avgScore = demands.length > 0 ? Math.round(demands.reduce((s, d) => s + d.demandScore, 0) / demands.length) : 50;

    const buyerReqs = await prisma.buyerRequirement.count({
      where: { productName: { contains: harvest.productName.split(' ')[0] }, isActive: true },
    });

    const demandLevel = avgScore > 70 ? 'HIGH' : avgScore > 40 ? 'MEDIUM' : 'LOW';

    let recommendation = '';
    if (nearbyDemand > harvest.expectedQuantity) {
      recommendation = `Strong nearby demand (${nearbyDemand} kg) exceeds your expected harvest (${harvest.expectedQuantity} ${harvest.unit}). Opening advance booking is highly recommended to secure buyers.`;
    } else if (buyerReqs > 3) {
      recommendation = `${buyerReqs} active buyer requirements found for ${harvest.productName}. Consider opening advance booking to match with interested buyers.`;
    } else {
      recommendation = `Moderate demand detected. Expected harvest aligns well with current market conditions. Advance booking can help secure early buyers.`;
    }

    return {
      demandLevel,
      nearbyDemandKg: nearbyDemand,
      potentialBuyers: buyerReqs,
      highDemandZones,
      avgDemandScore: avgScore,
      suggestedAdvanceBooking: avgScore > 40,
      recommendation,
      disclaimer: 'AI recommendations are advisory only. They do not guarantee sales, prices, or harvest output.',
    };
  }
}

export const harvestService = new HarvestService();
