import { prisma } from '../utils/prisma';
import { emitPaymentReceived, emitOrderStatusChanged } from '../utils/socket';

export class PaymentService {
  async createPayment(orderId: string, userId: string, amount: number) {
    const order = await prisma.order.findUnique({
      where: { id: orderId },
      include: { buyer: true },
    });
    if (!order) throw new Error('Order not found');
    if (order.buyerId !== userId) throw new Error('Unauthorized');
    // Server-side money rule: the payment must equal the order's computed
    // advance. Never trust a client-supplied amount for financial records.
    const expected = Number(order.advanceAmount);
    if (!Number.isFinite(amount) || Math.abs(amount - expected) > 0.01) {
      throw new Error(`Payment amount must equal the advance of ₹${expected.toFixed(2)}`);
    }
    if (order.status !== 'PENDING_ADVANCE') {
      throw new Error(`Advance already settled for this order (status: ${order.status})`);
    }

    const transactionId = `TXN-${Date.now()}-${Math.random().toString(36).substr(2, 8)}`;

    // Demo mode: simulate successful payment
    const payment = await prisma.payment.create({
      data: {
        orderId,
        userId,
        amount,
        method: 'DEMO_UPI',
        status: 'COMPLETED',
        transactionId,
        providerReference: `demo-ref-${transactionId}`,
        platformFee: amount * 0.025,
        farmerShare: amount * 0.85,
        logisticsFee: amount * 0.075,
      },
    });

    // Update order status
    if (order.status === 'PENDING_ADVANCE') {
      await prisma.order.update({
        where: { id: orderId },
        data: { status: 'ADVANCE_PAID', advancePaidAt: new Date() },
      });
      await prisma.orderStatusHistory.create({
        data: { orderId, status: 'ADVANCE_PAID', notes: `Advance payment of ₹${amount} completed (Demo)` },
      });
    }

    // Emit real-time events
    try {
      emitPaymentReceived({
        orderId,
        status: 'ADVANCE_PAID',
        farmerId: order.farmerId,
        buyerId: order.buyerId,
        amount,
        timestamp: new Date().toISOString(),
      });
      emitOrderStatusChanged({
        orderId,
        status: 'ADVANCE_PAID',
        farmerId: order.farmerId,
        buyerId: order.buyerId,
        timestamp: new Date().toISOString(),
      });
    } catch (_) {}

    return {
      payment,
      message: 'Demo payment processed successfully',
      mode: 'DEMO',
    };
  }

  async getPaymentsByOrder(orderId: string) {
    return prisma.payment.findMany({
      where: { orderId },
      orderBy: { createdAt: 'desc' },
    });
  }

  async processRefund(orderId: string, amount: number, reason: string) {
    const refundId = `REF-${Date.now()}-${Math.random().toString(36).substr(2, 8)}`;
    const order = await prisma.order.findUnique({ where: { id: orderId } });

    const refund = await prisma.payment.create({
      data: {
        orderId,
        userId: order?.buyerId || 'system',
        amount: -amount,
        method: 'DEMO_REFUND',
        status: 'COMPLETED',
        transactionId: refundId,
        providerReference: `demo-refund-${refundId}`,
        platformFee: 0,
        farmerShare: 0,
        logisticsFee: 0,
      },
    });

    return {
      refund,
      refundId,
      amount,
      reason,
      message: 'Demo refund processed',
      mode: 'DEMO',
    };
  }

  async getSettlements(farmerId: string) {
    const orders = await prisma.order.findMany({
      where: { farmerId, status: 'COMPLETED' },
      include: { payments: true },
    });

    let totalEarnings = 0;
    let totalPlatformFees = 0;
    let totalLogisticsFees = 0;

    for (const order of orders) {
      for (const payment of order.payments) {
        if (Number(payment.amount) > 0) {
          totalEarnings += Number(payment.farmerShare);
          totalPlatformFees += Number(payment.platformFee);
          totalLogisticsFees += Number(payment.logisticsFee);
        }
      }
    }

    return {
      totalEarnings: Math.round(totalEarnings),
      totalPlatformFees: Math.round(totalPlatformFees),
      totalLogisticsFees: Math.round(totalLogisticsFees),
      completedOrders: orders.length,
      settlements: orders.map(o => ({
        orderId: o.id,
        amount: Number(o.totalAmount),
        farmerShare: o.payments.reduce((sum, p) => sum + Number(p.farmerShare), 0),
        date: o.createdAt,
      })),
    };
  }
}

export const paymentService = new PaymentService();
