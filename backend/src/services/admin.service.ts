import { prisma } from '../utils/prisma';

export class AdminService {
  async getDashboardStats() {
    const [
      totalFarmers,
      totalConsumers,
      totalBuyers,
      totalFPOs,
      totalOrders,
      totalProducts,
      activeOrders,
      completedOrders,
      totalRevenue,
      totalDisputes,
      pendingDisputes,
    ] = await Promise.all([
      prisma.user.count({ where: { role: 'FARMER', isActive: true } }),
      prisma.user.count({ where: { role: 'CONSUMER', isActive: true } }),
      prisma.user.count({ where: { role: 'B2B_BUYER', isActive: true } }),
      prisma.user.count({ where: { role: 'FPO', isActive: true } }),
      prisma.order.count(),
      prisma.product.count({ where: { isActive: true } }),
      prisma.order.count({ where: { status: { in: ['ADVANCE_PAID', 'FARMER_ACCEPTED', 'PREPARING', 'LOGISTICS_ASSIGNED', 'PICKED_UP', 'IN_TRANSIT'] } } }),
      prisma.order.count({ where: { status: 'COMPLETED' } }),
      prisma.payment.aggregate({ _sum: { amount: true }, where: { amount: { gt: 0 } } }),
      prisma.dispute.count(),
      prisma.dispute.count({ where: { status: 'PENDING' } }),
    ]);

    return {
      users: {
        farmers: totalFarmers,
        consumers: totalConsumers,
        buyers: totalBuyers,
        fpos: totalFPOs,
        total: totalFarmers + totalConsumers + totalBuyers + totalFPOs,
      },
      orders: {
        total: totalOrders,
        active: activeOrders,
        completed: completedOrders,
      },
      products: totalProducts,
      revenue: Number(totalRevenue._sum.amount || 0),
      disputes: {
        total: totalDisputes,
        pending: pendingDisputes,
      },
    };
  }

  async getOrderAnalytics(params?: { startDate?: string; endDate?: string }) {
    // Generate sample chart data for demo
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    const ordersOverTime = months.map((month, i) => ({
      month,
      orders: Math.floor(Math.random() * 100) + 50,
      revenue: Math.floor(Math.random() * 500000) + 100000,
    }));

    const categoryDistribution = [
      { name: 'Vegetables', value: 35 },
      { name: 'Fruits', value: 20 },
      { name: 'Grains', value: 25 },
      { name: 'Dairy', value: 10 },
      { name: 'Spices', value: 5 },
      { name: 'Pulses', value: 5 },
    ];

    return {
      ordersOverTime,
      categoryDistribution,
      averageOrderValue: 4500,
      logisticsSavings: 28500,
      cancellationRate: 8.5,
    };
  }

  async getUsers(params: { role?: string; page?: number; limit?: number }) {
    const { role, page = 1, limit = 20 } = params;
    const where: any = {};
    if (role) where.role = role;

    const [users, total] = await Promise.all([
      prisma.user.findMany({
        where,
        select: {
          id: true, email: true, name: true, role: true, phone: true,
          isActive: true, isVerified: true, createdAt: true,
        },
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
      }),
      prisma.user.count({ where }),
    ]);

    return { users, total, page, limit, totalPages: Math.ceil(total / limit) };
  }

  async updateUserStatus(userId: string, data: { isActive?: boolean; isVerified?: boolean }) {
    const updateData: any = {};
    if (data.isActive !== undefined) updateData.isActive = data.isActive;
    if (data.isVerified !== undefined) updateData.isVerified = data.isVerified;
    return prisma.user.update({
      where: { id: userId },
      data: updateData,
    });
  }

  async getCancellationPolicy() {
    let policy = await prisma.cancellationPolicy.findFirst({
      where: { isActive: true },
      orderBy: { createdAt: 'desc' },
    });

    if (!policy) {
      policy = await prisma.cancellationPolicy.create({
        data: {
          name: 'Default Policy',
          beforeAcceptance: 100,
          afterAcceptance: 90,
          afterPreparation: 75,
          afterLogistics: 50,
          afterPickup: 10,
          isActive: true,
        },
      });
    }

    return policy;
  }

  async updateCancellationPolicy(data: any) {
    // Deactivate old policies
    await prisma.cancellationPolicy.updateMany({
      where: { isActive: true },
      data: { isActive: false },
    });

    return prisma.cancellationPolicy.create({
      data: { name: data.name || 'Policy', ...data, isActive: true },
    });
  }

  async getDisputes(params: { status?: string; page?: number; limit?: number }) {
    const { status, page = 1, limit = 20 } = params;
    const where: any = {};
    if (status) where.status = status;

    const [disputes, total] = await Promise.all([
      prisma.dispute.findMany({
        where,
        include: {
          order: { select: { id: true, totalAmount: true, status: true } },
          reporter: { select: { name: true, email: true, role: true } },
        },
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
      }),
      prisma.dispute.count({ where }),
    ]);

    return { disputes, total, page, limit, totalPages: Math.ceil(total / limit) };
  }

  async resolveDispute(disputeId: string, resolution: string, refundAmount?: number) {
    const dispute = await prisma.dispute.update({
      where: { id: disputeId },
      data: {
        status: 'RESOLVED',
        resolution,
        refundAmount: refundAmount || 0,
        resolvedAt: new Date(),
      },
    });

    return dispute;
  }
}

export const adminService = new AdminService();
