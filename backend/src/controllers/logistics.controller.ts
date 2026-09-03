import { Response } from 'express';
import { logisticsService } from '../services/logistics.service';
import { AuthRequest } from '../types';

export class LogisticsController {
  async getClubbingOpportunities(req: AuthRequest, res: Response) {
    try {
      const opportunities = await logisticsService.findClubbingOpportunities(req.user!.userId);
      res.json({ success: true, data: opportunities });
    } catch (error: any) {
      res.status(500).json({ success: false, error: error.message });
    }
  }

  async acceptClubbing(req: AuthRequest, res: Response) {
    try {
      const result = await logisticsService.acceptClubbing(req.user!.userId, req.body);
      res.json({ success: true, data: result });
    } catch (error: any) {
      res.status(400).json({ success: false, error: error.message });
    }
  }

  async rejectClubbing(req: AuthRequest, res: Response) {
    try {
      const result = await logisticsService.rejectClubbing(req.params.routeId);
      res.json({ success: true, data: result });
    } catch (error: any) {
      res.status(400).json({ success: false, error: error.message });
    }
  }

  async estimateDelivery(req: AuthRequest, res: Response) {
    try {
      const quote = await logisticsService.estimateDeliveryQuote(req.body);
      res.json({ success: true, data: quote });
    } catch (error: any) {
      res.status(400).json({ success: false, error: error.message });
    }
  }

  async createDelivery(req: AuthRequest, res: Response) {
    try {
      const delivery = await logisticsService.createDelivery(req.body);
      res.status(201).json({ success: true, data: delivery });
    } catch (error: any) {
      res.status(400).json({ success: false, error: error.message });
    }
  }
}

export const logisticsController = new LogisticsController();
