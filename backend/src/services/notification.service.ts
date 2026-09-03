import { prisma } from '../utils/prisma';

export class NotificationService {
  async createNotification(data: {
    userId: string;
    title: string;
    message: string;
    type: string;
    data?: any;
    orderId?: string;
  }) {
    return prisma.notification.create({
      data: {
        userId: data.userId,
        title: data.title,
        message: data.message,
        type: data.type,
        data: data.data ? JSON.stringify(data.data) : undefined,
        orderId: data.orderId,
        isRead: false,
      },
    });
  }

  async getUserNotifications(userId: string, params?: { unreadOnly?: boolean; page?: number; limit?: number }) {
    const { unreadOnly = false, page = 1, limit = 20 } = params || {};
    const where: any = { userId };
    if (unreadOnly) where.isRead = false;

    const [notifications, total] = await Promise.all([
      prisma.notification.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
      }),
      prisma.notification.count({ where }),
    ]);

    const unreadCount = await prisma.notification.count({
      where: { userId, isRead: false },
    });

    return { notifications, total, unreadCount, page, limit };
  }

  async markAsRead(notificationId: string, userId: string) {
    return prisma.notification.updateMany({
      where: { id: notificationId, userId },
      data: { isRead: true },
    });
  }

  async markAllAsRead(userId: string) {
    return prisma.notification.updateMany({
      where: { userId, isRead: false },
      data: { isRead: true },
    });
  }

  // Convenience methods for common notifications
  async notifyOrderPlaced(buyerId: string, orderId: string) {
    return this.createNotification({
      userId: buyerId,
      title: 'Order Placed',
      message: 'Your order has been placed successfully. Please complete the advance payment.',
      type: 'ORDER',
      orderId,
    });
  }

  async notifyOrderAccepted(farmerId: string, orderId: string) {
    return this.createNotification({
      userId: farmerId,
      title: 'Order Accepted',
      message: 'A new order has been assigned to you.',
      type: 'ORDER',
      orderId,
    });
  }

  async notifyClubbingOpportunity(farmerId: string, data: any) {
    return this.createNotification({
      userId: farmerId,
      title: 'Order Clubbing Opportunity',
      message: `${data.orderCount} compatible orders can save you ₹${data.savings} on logistics!`,
      type: 'CLUBBING',
      data,
    });
  }

  async notifyDeliveryUpdate(userId: string, orderId: string, status: string) {
    const messages: Record<string, string> = {
      PICKED_UP: 'Your order has been picked up and is on its way!',
      IN_TRANSIT: 'Your order is in transit. Estimated arrival soon.',
      DELIVERED: 'Your order has been delivered!',
    };
    return this.createNotification({
      userId,
      title: 'Delivery Update',
      message: messages[status] || `Delivery status: ${status}`,
      type: 'DELIVERY',
      orderId,
    });
  }

  async notifyPayment(userId: string, orderId: string, type: string) {
    return this.createNotification({
      userId,
      title: 'Payment Update',
      message: type === 'refund' ? 'Your refund has been processed.' : 'Payment received successfully.',
      type: 'PAYMENT',
      orderId,
    });
  }
}

export const notificationService = new NotificationService();
