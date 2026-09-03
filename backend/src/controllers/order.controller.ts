import { Response } from 'express';
import { orderService } from '../services/order.service';
import { AuthRequest } from '../types';
import { prisma } from '../utils/prisma';

export class OrderController {
  async createOrder(req: AuthRequest, res: Response) {
    try {
      const order = await orderService.createOrder(req.user!.userId, req.body);
      res.status(201).json({ success: true, data: order });
    } catch (error: any) {
      res.status(400).json({ success: false, error: error.message });
    }
  }

  async getOrders(req: AuthRequest, res: Response) {
    try {
      const result = await orderService.getOrdersByUser(
        req.user!.userId,
        req.user!.role,
        {
          status: req.query.status as string,
          page: req.query.page ? Number(req.query.page) : undefined,
          limit: req.query.limit ? Number(req.query.limit) : undefined,
        }
      );
      res.json({ success: true, data: result });
    } catch (error: any) {
      res.status(500).json({ success: false, error: error.message });
    }
  }

  async getOrderById(req: AuthRequest, res: Response) {
    try {
      const order = await orderService.getOrderById(req.params.id);
      res.json({ success: true, data: order });
    } catch (error: any) {
      res.status(404).json({ success: false, error: error.message });
    }
  }

  async updateStatus(req: AuthRequest, res: Response) {
    try {
      const order = await prisma.order.findUnique({ where: { id: req.params.id }, select: { farmerId: true, buyerId: true } });
      if (!order) return res.status(404).json({ success: false, error: 'Order not found' });

      const userId = req.user!.userId;
      const role = req.user!.role;
      const isFarmer = order.farmerId === userId;
      const isAdmin = role === 'ADMIN';

      if (!isFarmer && !isAdmin) {
        return res.status(403).json({ success: false, error: 'Only the seller or admin can update order status' });
      }

      const updated = await orderService.updateOrderStatus(
        req.params.id,
        req.body.status,
        req.body.notes
      );
      res.json({ success: true, data: updated });
    } catch (error: any) {
      res.status(400).json({ success: false, error: error.message });
    }
  }

  async cancelOrder(req: AuthRequest, res: Response) {
    try {
      const order = await prisma.order.findUnique({ where: { id: req.params.id }, select: { buyerId: true } });
      if (!order) return res.status(404).json({ success: false, error: 'Order not found' });

      const userId = req.user!.userId;
      const role = req.user!.role;
      if (order.buyerId !== userId && role !== 'ADMIN') {
        return res.status(403).json({ success: false, error: 'Only the buyer or admin can cancel this order' });
      }

      const result = await orderService.cancelOrder(req.params.id, req.body.reason);
      res.json({ success: true, data: result });
    } catch (error: any) {
      res.status(400).json({ success: false, error: error.message });
    }
  }
}

export const orderController = new OrderController();
