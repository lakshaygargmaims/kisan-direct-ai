import { Response } from 'express';
import { adminService } from '../services/admin.service';
import { AuthRequest } from '../types';

export class AdminController {
  async getDashboard(req: AuthRequest, res: Response) {
    try {
      const stats = await adminService.getDashboardStats();
      res.json({ success: true, data: stats });
    } catch (error: any) {
      res.status(500).json({ success: false, error: error.message });
    }
  }

  async getAnalytics(req: AuthRequest, res: Response) {
    try {
      const analytics = await adminService.getOrderAnalytics(req.query as any);
      res.json({ success: true, data: analytics });
    } catch (error: any) {
      res.status(500).json({ success: false, error: error.message });
    }
  }

  async getUsers(req: AuthRequest, res: Response) {
    try {
      const result = await adminService.getUsers({
        role: req.query.role as string,
        page: req.query.page ? Number(req.query.page) : undefined,
        limit: req.query.limit ? Number(req.query.limit) : undefined,
      });
      res.json({ success: true, data: result });
    } catch (error: any) {
      res.status(500).json({ success: false, error: error.message });
    }
  }

  async updateUserStatus(req: AuthRequest, res: Response) {
    try {
      const user = await adminService.updateUserStatus(req.params.id, req.body);
      res.json({ success: true, data: user });
    } catch (error: any) {
      res.status(400).json({ success: false, error: error.message });
    }
  }

  async getCancellationPolicy(req: AuthRequest, res: Response) {
    try {
      const policy = await adminService.getCancellationPolicy();
      res.json({ success: true, data: policy });
    } catch (error: any) {
      res.status(500).json({ success: false, error: error.message });
    }
  }

  async updateCancellationPolicy(req: AuthRequest, res: Response) {
    try {
      const policy = await adminService.updateCancellationPolicy(req.body);
      res.json({ success: true, data: policy });
    } catch (error: any) {
      res.status(400).json({ success: false, error: error.message });
    }
  }

  async getDisputes(req: AuthRequest, res: Response) {
    try {
      const result = await adminService.getDisputes({
        status: req.query.status as string,
        page: req.query.page ? Number(req.query.page) : undefined,
        limit: req.query.limit ? Number(req.query.limit) : undefined,
      });
      res.json({ success: true, data: result });
    } catch (error: any) {
      res.status(500).json({ success: false, error: error.message });
    }
  }

  async resolveDispute(req: AuthRequest, res: Response) {
    try {
      const dispute = await adminService.resolveDispute(
        req.params.id,
        req.body.resolution,
        req.body.refundAmount
      );
      res.json({ success: true, data: dispute });
    } catch (error: any) {
      res.status(400).json({ success: false, error: error.message });
    }
  }
}

export const adminController = new AdminController();
