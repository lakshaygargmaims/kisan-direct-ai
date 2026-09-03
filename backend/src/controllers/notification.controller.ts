import { Response } from 'express';
import { notificationService } from '../services/notification.service';
import { AuthRequest } from '../types';

export class NotificationController {
  async getNotifications(req: AuthRequest, res: Response) {
    try {
      const result = await notificationService.getUserNotifications(req.user!.userId, {
        unreadOnly: req.query.unreadOnly === 'true',
        page: req.query.page ? Number(req.query.page) : undefined,
        limit: req.query.limit ? Number(req.query.limit) : undefined,
      });
      res.json({ success: true, data: result });
    } catch (error: any) {
      res.status(500).json({ success: false, error: error.message });
    }
  }

  async markAsRead(req: AuthRequest, res: Response) {
    try {
      await notificationService.markAsRead(req.params.id, req.user!.userId);
      res.json({ success: true });
    } catch (error: any) {
      res.status(400).json({ success: false, error: error.message });
    }
  }

  async markAllAsRead(req: AuthRequest, res: Response) {
    try {
      await notificationService.markAllAsRead(req.user!.userId);
      res.json({ success: true });
    } catch (error: any) {
      res.status(400).json({ success: false, error: error.message });
    }
  }
}

export const notificationController = new NotificationController();
