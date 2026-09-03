import { Response } from 'express';
import { paymentService } from '../services/payment.service';
import { AuthRequest } from '../types';
import { prisma } from '../utils/prisma';

export class PaymentController {
  async createPayment(req: AuthRequest, res: Response) {
    try {
      const { orderId, amount } = req.body;
      const result = await paymentService.createPayment(orderId, req.user!.userId, amount);
      res.json({ success: true, data: result });
    } catch (error: any) {
      res.status(400).json({ success: false, error: error.message });
    }
  }

  async getPayments(req: AuthRequest, res: Response) {
    try {
      const order = await prisma.order.findUnique({ where: { id: req.params.orderId }, select: { buyerId: true, farmerId: true } });
      if (!order) return res.status(404).json({ success: false, error: 'Order not found' });

      const userId = req.user!.userId;
      const role = req.user!.role;
      if (order.buyerId !== userId && order.farmerId !== userId && role !== 'ADMIN') {
        return res.status(403).json({ success: false, error: 'Unauthorized to view these payments' });
      }

      const payments = await paymentService.getPaymentsByOrder(req.params.orderId);
      res.json({ success: true, data: payments });
    } catch (error: any) {
      res.status(500).json({ success: false, error: error.message });
    }
  }

  async processRefund(req: AuthRequest, res: Response) {
    try {
      const order = await prisma.order.findUnique({ where: { id: req.params.orderId }, select: { buyerId: true } });
      if (!order) return res.status(404).json({ success: false, error: 'Order not found' });

      const userId = req.user!.userId;
      const role = req.user!.role;
      if (order.buyerId !== userId && role !== 'ADMIN') {
        return res.status(403).json({ success: false, error: 'Only the buyer or admin can request a refund' });
      }

      const { orderId } = req.params;
      const { amount, reason } = req.body;
      const result = await paymentService.processRefund(orderId, amount, reason);
      res.json({ success: true, data: result });
    } catch (error: any) {
      res.status(400).json({ success: false, error: error.message });
    }
  }

  async getSettlements(req: AuthRequest, res: Response) {
    try {
      const settlements = await paymentService.getSettlements(req.user!.userId);
      res.json({ success: true, data: settlements });
    } catch (error: any) {
      res.status(500).json({ success: false, error: error.message });
    }
  }
}

export const paymentController = new PaymentController();
