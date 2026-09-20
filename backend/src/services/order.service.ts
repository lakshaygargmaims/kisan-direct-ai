import { prisma } from '../utils/prisma';
import { emitOrderCreated, emitOrderStatusChanged, emitOrderCancelled } from '../utils/socket';
import { coldStorageService } from './cold-storage.service';

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
    // Claim stock atomically: a guarded decrement inside a transaction closes
    // the concurrent-order race (two buyers both passing a plain read-check
    // against the same availableQuantity and overselling the last stock).
    const { order: created, product, totalAmount } = await prisma.$transaction(async (tx: any) => {
      const claimed = await tx.product.updateMany({
        where: { id: data.productId, availableQuantity: { gte: data.quantity } },
        data: { availableQuantity: { decrement: data.quantity } },
      });
      if (claimed.count === 0) {
        const exists = await tx.product.findUnique({ where: { id: data.productId }, select: { id: true } });
        throw new Error(exists ? 'Insufficient quantity' : 'Product not found');
      }

      const product = await tx.product.findUnique({
        where: { id: data.productId },
        include: { deliveryRule: true },
      });
      if (!product) throw new Error('Product not found');

      // Delivery radius check (simplified for demo)
      if (product.deliveryRule) {
        // In production, fetch farmer profile and check distance
      }

      const totalAmount = Number(product.pricePerKg) * data.quantity;
      const advanceAmount = totalAmount * 0.2; // 20% advance
      const platformFee = totalAmount * 0.025; // 2.5% platform fee

      const order = await tx.order.create({
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

      await tx.orderStatusHistory.create({
        data: {
          orderId: order.id,
          status: 'PENDING_ADVANCE',
          notes: 'Order created, awaiting advance payment',
        },
      });

      return { order, product, totalAmount };
    });

    // If this product is backed by a cold-storage batch, deduct from the batch (FIFO)
    // so stored inventory stays in sync with marketplace sales. Runs after the
    // transaction commits: recordSaleFromBatch uses its own guarded updates, and
    // batch sync failures are logged for reconciliation rather than failing the order.
    try {
      const uncovered = await coldStorageService.recordSaleFromBatch(product.name, data.quantity);
      if (uncovered > 0) {
        // Part of the order came from regular (non-stored) stock — nothing to do,
        // the product row already tracked it. Logged for audit visibility.
        console.log(`[order ${created.id}] ${uncovered}kg sold from regular stock (not cold storage)`);
      }
    } catch (e: any) {
      // Don't fail the order if batch sync fails — log for reconciliation.
      console.error(`[order ${created.id}] cold-storage batch sync failed:`, e.message);
    }

    // Emit real-time event
    try {
      emitOrderCreated({
        orderId: created.id,
        status: 'PENDING_ADVANCE',
        farmerId: product.farmerId,
        buyerId,
        productName: product.name,
        quantity: data.quantity,
        totalAmount,
        timestamp: new Date().toISOString(),
      });
    } catch (_) { /* socket may not be initialized in tests */ }

    return created;
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
    // Single-transaction cancel: a status re-check inside the transaction makes
    // double-cancel idempotent-safe (second cancel 400s instead of double-
    // restoring inventory and double-refunding).
    return prisma.$transaction(async (tx: any) => {
      const order = await tx.order.findUnique({ where: { id: orderId } });
      if (!order) throw new Error('Order not found');
      if (order.status === 'CANCELLED') throw new Error('Order is already cancelled');
      if (order.status === 'REFUNDED') throw new Error('Refunded orders cannot be cancelled');

      // Get cancellation policy
      const policy = await tx.cancellationPolicy.findFirst({
        where: { isActive: true },
        orderBy: { createdAt: 'desc' },
      });

      const refundPercentage = this.calculateRefundPercentage(order.status, policy);
      const refundAmount = Number(order.advanceAmount) * refundPercentage;

      // Restore product quantity (only while still inside the transaction,
      // so a cancelled order can never restore stock twice)
      await tx.product.update({
        where: { id: order.productId },
        data: { availableQuantity: { increment: order.quantity } },
      });

      const updated = await tx.order.update({
        where: { id: orderId },
        data: { status: 'CANCELLED' },
      });

      await tx.orderStatusHistory.create({
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
    });
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
