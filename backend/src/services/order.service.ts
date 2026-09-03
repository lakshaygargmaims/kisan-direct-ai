import { prisma } from '../utils/prisma';
import { emitOrderCreated, emitOrderStatusChanged, emitOrderCancelled } from '../utils/socket';

const ORDER_STATUS_FLOW: Record<string, string[]> = {
  PENDING_ADVANCE: ['ADVANCE_PAID', 'CANCELLED'],
  ADVANCE_PAID: ['FARMER_ACCEPTED', 'CANCELLED'],
  FARMER_ACCEPTED: ['PREPARING', 'CANCELLED'],
  PREPARING: ['LOGISTICS_ASSIGNED', 'CANCELLED'],
  LOGISTICS_ASSIGNED: ['PICKED_UP', 'CANCELLED'],
  PICKED_UP: ['IN_TRANSIT'],
  IN_TRANSIT: ['DELIVERED'],
  DELIVERED: ['COMPLETED', 'DISPUTED'],
  COMPLETED: [],
  CANCELLED: [],
  REFUND_PENDING: ['REFUNDED'],
  REFUNDED: [],
  DISPUTED: [],
};

export class OrderService {
  async createOrder(buyerId: string, data: {
    productId: string;
    quantity: number;
    deliveryAddress: string;
    deliveryLatitude: number;
    deliveryLongitude: number;
    deliveryNotes?: string;
  }) {
    const product = await prisma.product.findUnique({
      where: { id: data.productId },
      include: { deliveryRule: true },
    });

    if (!product) throw new Error('Product not found');
    if (Number(product.availableQuantity) < data.quantity) throw new Error('Insufficient quantity');

    // Delivery radius check (simplified for demo)
    if (product.deliveryRule) {
      // In production, fetch farmer profile and check distance
    }

    const totalAmount = Number(product.pricePerKg) * data.quantity;
    const advanceAmount = totalAmount * 0.2; // 20% advance
    const platformFee = totalAmount * 0.025; // 2.5% platform fee

    const order = await prisma.order.create({
      data: {
        buyerId,
        farmerId: product.farmerId,
        productId: data.productId,
        quantity: data.quantity,
        pricePerKg: product.pricePerKg,
        totalAmount,
        advanceAmount,
        remainingAmount: totalAmount - advanceAmount,
        platformFee,
        deliveryAddress: data.deliveryAddress,
        deliveryLatitude: data.deliveryLatitude,
        deliveryLongitude: data.deliveryLongitude,
        deliveryNotes: data.deliveryNotes,
        status: 'PENDING_ADVANCE',
      },
    });

    // Reduce available quantity
    await prisma.product.update({
      where: { id: data.productId },
      data: { availableQuantity: { decrement: data.quantity } },
    });

    // Create status history
    await prisma.orderStatusHistory.create({
      data: {
        orderId: order.id,
        status: 'PENDING_ADVANCE',
        notes: 'Order created, awaiting advance payment',
      },
    });

    // Emit real-time event
    try {
      emitOrderCreated({
        orderId: order.id,
        status: 'PENDING_ADVANCE',
        farmerId: product.farmerId,
        buyerId,
        productName: product.name,
        quantity: data.quantity,
        totalAmount,
        timestamp: new Date().toISOString(),
      });
    } catch (_) { /* socket may not be initialized in tests */ }

    return order;
  }

  async getOrderById(orderId: string) {
    const order = await prisma.order.findUnique({
      where: { id: orderId },
      include: {
        product: { include: { category: true, images: true } },
        buyer: { select: { name: true, email: true, id: true } },
        farmer: { select: { name: true, email: true, id: true } },
        statusHistory: { orderBy: { createdAt: 'desc' } },
        delivery: true,
        payments: true,
        reviews: true,
      },
    });
    if (!order) throw new Error('Order not found');
    return order;
  }

  async getOrdersByUser(userId: string, role: string, params?: { status?: string; page?: number; limit?: number }) {
    const { status, page = 1, limit = 20 } = params || {};
    const where: any = {};

    if (role === 'CONSUMER' || role === 'B2B_BUYER') {
      where.buyerId = userId;
    } else if (role === 'FARMER' || role === 'FPO') {
      where.farmerId = userId;
    }

    if (status) where.status = status;

    const [orders, total] = await Promise.all([
      prisma.order.findMany({
        where,
        include: {
          product: { select: { name: true, unit: true, category: { select: { name: true } } } },
          buyer: { select: { name: true } },
          farmer: { select: { name: true } },
          delivery: { select: { status: true, estimatedArrival: true } },
        },
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
      }),
      prisma.order.count({ where }),
    ]);

    return { orders, total, page, limit, totalPages: Math.ceil(total / limit) };
  }

  async updateOrderStatus(orderId: string, newStatus: string, notes?: string) {
    const order = await prisma.order.findUnique({ where: { id: orderId } });
    if (!order) throw new Error('Order not found');

    const validNext = ORDER_STATUS_FLOW[order.status];
    if (!validNext || !validNext.includes(newStatus)) {
      throw new Error(`Cannot transition from ${order.status} to ${newStatus}`);
    }

    const updated = await prisma.order.update({
      where: { id: orderId },
      data: { status: newStatus },
    });

    await prisma.orderStatusHistory.create({
      data: {
        orderId,
        status: newStatus,
        notes: notes || `Status updated to ${newStatus}`,
      },
    });

    // Emit real-time event
    try {
      emitOrderStatusChanged({
        orderId,
        status: newStatus,
        farmerId: order.farmerId,
        buyerId: order.buyerId,
        timestamp: new Date().toISOString(),
      });
    } catch (_) {}

    return updated;
  }

  async cancelOrder(orderId: string, reason: string) {
    const order = await prisma.order.findUnique({ where: { id: orderId } });
    if (!order) throw new Error('Order not found');

    // Get cancellation policy
    const policy = await prisma.cancellationPolicy.findFirst({
      where: { isActive: true },
      orderBy: { createdAt: 'desc' },
    });

    const refundPercentage = this.calculateRefundPercentage(order.status, policy);
    const refundAmount = Number(order.advanceAmount) * refundPercentage;

    // Restore product quantity
    await prisma.product.update({
      where: { id: order.productId },
      data: { availableQuantity: { increment: order.quantity } },
    });

    const updated = await prisma.order.update({
      where: { id: orderId },
      data: { status: 'CANCELLED' },
    });

    await prisma.orderStatusHistory.create({
      data: {
        orderId,
        status: 'CANCELLED',
        notes: `Cancelled. Reason: ${reason}. Refund: ${refundPercentage * 100}% (₹${refundAmount})`,
      },
    });

    // Emit real-time event
    try {
      emitOrderCancelled({
        orderId,
        status: 'CANCELLED',
        farmerId: order.farmerId,
        buyerId: order.buyerId,
        timestamp: new Date().toISOString(),
      });
    } catch (_) {}

    return { order: updated, refundAmount, refundPercentage };
  }

  private calculateRefundPercentage(status: string, policy: any): number {
    if (!policy) {
      const defaults: Record<string, number> = {
        PENDING_ADVANCE: 1,
        ADVANCE_PAID: 0.9,
        FARMER_ACCEPTED: 0.75,
        PREPARING: 0.5,
        LOGISTICS_ASSIGNED: 0.25,
        PICKED_UP: 0.1,
      };
      return defaults[status] || 0;
    }

    switch (status) {
      case 'PENDING_ADVANCE': return policy.beforeAcceptance / 100;
      case 'ADVANCE_PAID': return policy.afterAcceptance / 100;
      case 'FARMER_ACCEPTED': return policy.afterPreparation / 100;
      case 'PREPARING': return policy.afterLogistics / 100;
      default: return policy.afterPickup / 100;
    }
  }

  private calculateDistance(lat1: number, lng1: number, lat2: number, lng2: number): number {
    const R = 6371;
    const dLat = ((lat2 - lat1) * Math.PI) / 180;
    const dLng = ((lng2 - lng1) * Math.PI) / 180;
    const a =
      Math.sin(dLat / 2) ** 2 +
      Math.cos((lat1 * Math.PI) / 180) * Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLng / 2) ** 2;
    return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  }
}

export const orderService = new OrderService();
