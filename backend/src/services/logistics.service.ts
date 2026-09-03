import { prisma } from '../utils/prisma';

// Haversine formula
function calculateDistance(lat1: number, lng1: number, lat2: number, lng2: number): number {
  const R = 6371;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLng = ((lng2 - lng1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((lat1 * Math.PI) / 180) *
    Math.cos((lat2 * Math.PI) / 180) *
    Math.sin(dLng / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

interface ClubCandidate {
  orderId: string;
  buyerId: string;
  buyerLat: number;
  buyerLng: number;
  quantity: number;
  totalAmount: number;
  distanceFromFarmer: number;
  compatible: boolean;
  reason: string;
  buyerName?: string;
  buyerCity?: string;
  productName?: string;
}

interface ClubbedRoute {
  routeId: string;
  orders: ClubCandidate[];
  totalQuantity: number;
  vehicleType: string;
  vehicleCapacity: number;
  totalDistance: number;
  estimatedTime: number;
  separateCost: number;
  clubbedCost: number;
  savings: number;
  optimizedSequence: { buyerId: string; lat: number; lng: number; orderId: string }[];
}

const VEHICLES: Record<string, { capacity: number; costPerKm: number; costPerTrip: number }> = {
  'TWO_WHEELER': { capacity: 30, costPerKm: 8, costPerTrip: 50 },
  'THREE_WHEELER': { capacity: 200, costPerKm: 12, costPerTrip: 100 },
  'SMALL_TRUCK': { capacity: 700, costPerKm: 18, costPerTrip: 200 },
  'LARGE_TRUCK': { capacity: 2000, costPerKm: 25, costPerTrip: 400 },
};

export class LogisticsService {
  async findClubbingOpportunities(farmerId: string) {
    const farmerProfile = await prisma.farmerProfile.findFirst({ where: { userId: farmerId } });
    if (!farmerProfile) throw new Error('Farmer profile not found');

    // Get pending/accepted orders for this farmer
    const orders = await prisma.order.findMany({
      where: {
        farmerId,
        status: { in: ['ADVANCE_PAID', 'FARMER_ACCEPTED'] },
      },
      include: {
        buyer: { select: { id: true, name: true } },
        product: { select: { name: true } },
      },
    });

    if (orders.length < 2) return [];

    // Exclude orders already in a club
    const alreadyClubbed = await prisma.orderClubMember.findMany({
      where: { orderId: { in: orders.map(o => o.id) } },
      select: { orderId: true },
    });
    const clubbedIds = new Set(alreadyClubbed.map(m => m.orderId));
    const eligibleOrders = orders.filter(o => !clubbedIds.has(o.id));

    if (eligibleOrders.length < 2) return [];

    // Build a lookup for buyer info
    const buyerInfo: Record<string, { name: string; city?: string }> = {};
    for (const o of eligibleOrders) {
      if (o.buyer && !buyerInfo[o.buyerId]) {
        const profile = await prisma.buyerProfile.findFirst({ where: { userId: o.buyerId } });
        buyerInfo[o.buyerId] = { name: o.buyer.name, city: profile?.city };
      }
    }

    // Build a lookup for product names
    const productInfo: Record<string, string> = {};
    for (const o of eligibleOrders) {
      if (o.product && !productInfo[o.productId]) {
        productInfo[o.productId] = o.product.name;
      }
    }

    const candidates: ClubCandidate[] = eligibleOrders.map((order: any) => {
      const distance = calculateDistance(
        farmerProfile.latitude, farmerProfile.longitude,
        order.deliveryLatitude, order.deliveryLongitude
      );
      return {
        orderId: order.id,
        buyerId: order.buyerId,
        buyerLat: order.deliveryLatitude,
        buyerLng: order.deliveryLongitude,
        quantity: order.quantity,
        totalAmount: order.totalAmount,
        distanceFromFarmer: distance,
        compatible: true,
        reason: '',
        buyerName: buyerInfo[order.buyerId]?.name || 'Unknown',
        buyerCity: buyerInfo[order.buyerId]?.city || '',
        productName: productInfo[order.productId] || 'Unknown',
      };
    });

    // Group compatible orders
    const routes = this.clusterOrders(candidates, farmerProfile.latitude, farmerProfile.longitude);
    return routes;
  }

  private clusterOrders(candidates: ClubCandidate[], farmerLat: number, farmerLng: number): ClubbedRoute[] {
    // Sort by distance
    candidates.sort((a, b) => a.distanceFromFarmer - b.distanceFromFarmer);

    const routes: ClubbedRoute[] = [];
    const used = new Set<string>();

    for (const candidate of candidates) {
      if (used.has(candidate.orderId)) continue;

      const cluster: ClubCandidate[] = [candidate];
      used.add(candidate.orderId);

      for (const other of candidates) {
        if (used.has(other.orderId)) continue;

        const clusterDistances = cluster.map(c => c.distanceFromFarmer);
        const maxDist = Math.max(...clusterDistances);
        const totalQty = cluster.reduce((sum, c) => sum + c.quantity, 0);

        // Add if within reasonable distance and capacity
        if (other.distanceFromFarmer - candidate.distanceFromFarmer < 15 &&
          totalQty + other.quantity < 700) {
          // Check mutual proximity
          const mutualDist = calculateDistance(
            candidate.buyerLat, candidate.buyerLng,
            other.buyerLat, other.buyerLng
          );
          if (mutualDist < 20) {
            cluster.push(other);
            used.add(other.orderId);
          }
        }
      }

      if (cluster.length >= 2) {
        const totalQuantity = cluster.reduce((sum, c) => sum + c.quantity, 0);
        const vehicle = this.selectVehicle(totalQuantity);

        const optimizedRoute = this.optimizeRoute(farmerLat, farmerLng, cluster);

        const separateCost = cluster.reduce((sum, c) => {
          const vehicleCost = VEHICLES['SMALL_TRUCK'];
          return sum + vehicleCost.costPerTrip + (c.distanceFromFarmer * vehicleCost.costPerKm);
        }, 0);

        const totalRouteDistance = this.calculateRouteDistance(
          [{ lat: farmerLat, lng: farmerLng, }, ...optimizedRoute.map(r => ({ lat: r.lat, lng: r.lng }))]
        );

        const clubbedCost = vehicle.costPerTrip + (totalRouteDistance * vehicle.costPerKm);

        routes.push({
          routeId: `club-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`,
          orders: cluster,
          totalQuantity,
          vehicleType: vehicle.type,
          vehicleCapacity: vehicle.capacity,
          totalDistance: Math.round(totalRouteDistance * 10) / 10,
          estimatedTime: Math.round(totalRouteDistance * 2), // ~30km/h average
          separateCost: Math.round(separateCost),
          clubbedCost: Math.round(clubbedCost),
          savings: Math.round(separateCost - clubbedCost),
          optimizedSequence: optimizedRoute,
        });
      }
    }

    return routes;
  }

  private selectVehicle(quantity: number) {
    const types = Object.entries(VEHICLES).sort((a, b) => a[1].capacity - b[1].capacity);
    for (const [type, v] of types) {
      if (v.capacity >= quantity * 1.1) return { type, ...v };
    }
    return { type: 'LARGE_TRUCK', ...VEHICLES['LARGE_TRUCK'] };
  }

  private optimizeRoute(
    farmerLat: number, farmerLng: number,
    cluster: ClubCandidate[]
  ): { buyerId: string; lat: number; lng: number; orderId: string }[] {
    // Simple nearest-neighbor TSP heuristic
    const points = cluster.map(c => ({ lat: c.buyerLat, lng: c.buyerLng, orderId: c.orderId, buyerId: c.buyerId }));
    const route: typeof points = [];
    const used = new Set<number>();
    let currentLat = farmerLat;
    let currentLng = farmerLng;

    for (let i = 0; i < points.length; i++) {
      let nearest = -1;
      let nearestDist = Infinity;
      for (let j = 0; j < points.length; j++) {
        if (used.has(j)) continue;
        const d = calculateDistance(currentLat, currentLng, points[j].lat, points[j].lng);
        if (d < nearestDist) {
          nearestDist = d;
          nearest = j;
        }
      }
      if (nearest >= 0) {
        route.push(points[nearest]);
        used.add(nearest);
        currentLat = points[nearest].lat;
        currentLng = points[nearest].lng;
      }
    }

    return route;
  }

  private calculateRouteDistance(points: { lat: number; lng: number }[]): number {
    let dist = 0;
    for (let i = 1; i < points.length; i++) {
      dist += calculateDistance(points[i - 1].lat, points[i - 1].lng, points[i].lat, points[i].lng);
    }
    return dist;
  }

  async estimateDeliveryQuote(data: {
    pickupLat: number;
    pickupLng: number;
    dropoffLat: number;
    dropoffLng: number;
    weight: number;
    coldChain: boolean;
  }) {
    const distance = calculateDistance(data.pickupLat, data.pickupLng, data.dropoffLat, data.dropoffLng);
    const vehicle = this.selectVehicle(data.weight);

    const baseFare = vehicle.costPerTrip;
    const distanceCharge = Math.round(distance * vehicle.costPerKm);
    const handlingCharge = Math.round(data.weight * 2);
    const specialHandling = data.coldChain ? Math.round(distanceCharge * 0.5) : 0;
    const total = baseFare + distanceCharge + handlingCharge + specialHandling;

    return {
      baseFare,
      distanceCharge,
      handlingCharge,
      specialHandling,
      total: Math.round(total),
      distance: Math.round(distance * 10) / 10,
      estimatedTime: Math.round(distance * 2), // minutes
      vehicleType: vehicle.type,
      vehicleCapacity: vehicle.capacity,
      provider: 'DEMO',
      note: 'Demo mode - simulated delivery quote',
    };
  }

  async acceptClubbing(farmerId: string, routeData: {
    routeId: string;
    orders: { orderId: string }[];
    totalQuantity: number;
    vehicleType: string;
    totalDistance: number;
    estimatedTime: number;
    separateCost: number;
    clubbedCost: number;
    savings: number;
  }) {
    // Verify all orders belong to this farmer
    const orderIds = routeData.orders.map(o => o.orderId);
    const orders = await prisma.order.findMany({
      where: { id: { in: orderIds }, farmerId },
    });
    if (orders.length !== orderIds.length) {
      throw new Error('One or more orders do not belong to this farmer');
    }

    // Check if any order is already in a club (prevent double-clubbing)
    const existingMembers = await prisma.orderClubMember.findMany({
      where: { orderId: { in: orderIds } },
    });
    if (existingMembers.length > 0) {
      const alreadyClubbed = existingMembers.map(m => m.orderId);
      throw new Error(`Orders already clubbed: ${alreadyClubbed.join(', ')}`);
    }

    // Create the club record
    const club = await prisma.orderClub.create({
      data: {
        farmerId,
        totalQuantity: routeData.totalQuantity,
        vehicleType: routeData.vehicleType,
        totalDistance: routeData.totalDistance,
        estimatedTime: routeData.estimatedTime,
        separateCost: routeData.separateCost,
        clubbedCost: routeData.clubbedCost,
        savings: routeData.savings,
        status: 'ACCEPTED',
      },
    });

    // Create member records
    for (const o of routeData.orders) {
      await prisma.orderClubMember.create({
        data: { clubId: club.id, orderId: o.orderId },
      });
    }

    return {
      clubId: club.id,
      status: 'ACCEPTED',
      orders: orderIds.length,
      savings: routeData.savings,
      message: `Clubbing accepted. ${orderIds.length} orders will be delivered together, saving ₹${routeData.savings}.`,
    };
  }

  async rejectClubbing(routeId: string) {
    return {
      routeId,
      status: 'REJECTED',
      message: 'Clubbing proposal rejected.',
    };
  }

  async createDelivery(data: any) {
    // Demo delivery creation
    const deliveryId = `DEL-${Date.now()}-${Math.random().toString(36).substr(2, 6)}`;
    return {
      id: deliveryId,
      status: 'BOOKED',
      estimatedPickup: new Date(Date.now() + 30 * 60 * 1000),
      estimatedArrival: new Date(Date.now() + data.estimatedTime * 60 * 1000),
      driver: {
        name: 'Demo Driver',
        phone: '+91-9999999999',
        vehicle: 'Demo Vehicle',
        vehicleNumber: 'DEMO-001',
      },
      note: 'Demo mode - simulated delivery',
    };
  }
}

export const logisticsService = new LogisticsService();
