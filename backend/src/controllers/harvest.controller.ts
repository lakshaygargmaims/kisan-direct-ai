import { Request, Response } from 'express';
import { harvestService } from '../services/harvest.service';
import { AuthRequest } from '../types';

export class HarvestController {
  async createHarvest(req: AuthRequest, res: Response) {
    try {
      const harvest = await harvestService.createHarvest(req.user!.userId, req.body);
      res.status(201).json({ success: true, data: harvest });
    } catch (error: any) {
      res.status(400).json({ success: false, error: error.message });
    }
  }

  async getHarvests(req: Request, res: Response) {
    try {
      const result = await harvestService.getHarvests({
        search: req.query.search as string,
        category: req.query.category as string,
        status: req.query.status as string,
        farmerId: req.query.farmerId as string,
        upcoming: req.query.upcoming as string,
        lat: req.query.lat ? Number(req.query.lat) : undefined,
        lng: req.query.lng ? Number(req.query.lng) : undefined,
        radius: req.query.radius ? Number(req.query.radius) : undefined,
        page: req.query.page ? Number(req.query.page) : undefined,
        limit: req.query.limit ? Number(req.query.limit) : undefined,
      });
      res.json({ success: true, data: result });
    } catch (error: any) {
      res.status(500).json({ success: false, error: error.message });
    }
  }

  async getHarvestById(req: Request, res: Response) {
    try {
      const harvest = await harvestService.getHarvestById(req.params.id);
      res.json({ success: true, data: harvest });
    } catch (error: any) {
      res.status(404).json({ success: false, error: error.message });
    }
  }

  async updateHarvest(req: AuthRequest, res: Response) {
    try {
      const harvest = await harvestService.updateHarvest(req.params.id, req.user!.userId, req.body);
      res.json({ success: true, data: harvest });
    } catch (error: any) {
      res.status(400).json({ success: false, error: error.message });
    }
  }

  async deleteHarvest(req: AuthRequest, res: Response) {
    try {
      await harvestService.deleteHarvest(req.params.id, req.user!.userId);
      res.json({ success: true, message: 'Harvest deleted' });
    } catch (error: any) {
      res.status(400).json({ success: false, error: error.message });
    }
  }

  async reserveHarvest(req: AuthRequest, res: Response) {
    try {
      const reservation = await harvestService.reserveHarvest(req.params.id, req.user!.userId, req.body);
      res.status(201).json({ success: true, data: reservation });
    } catch (error: any) {
      res.status(400).json({ success: false, error: error.message });
    }
  }

  async getReservations(req: Request, res: Response) {
    try {
      const reservations = await harvestService.getReservations(req.params.id);
      res.json({ success: true, data: reservations });
    } catch (error: any) {
      res.status(500).json({ success: false, error: error.message });
    }
  }

  async getMyReservations(req: AuthRequest, res: Response) {
    try {
      const reservations = await harvestService.getMyReservations(req.user!.userId);
      res.json({ success: true, data: reservations });
    } catch (error: any) {
      res.status(500).json({ success: false, error: error.message });
    }
  }

  async confirmHarvest(req: AuthRequest, res: Response) {
    try {
      const harvest = await harvestService.confirmHarvest(req.params.id, req.user!.userId, req.body);
      res.json({ success: true, data: harvest });
    } catch (error: any) {
      res.status(400).json({ success: false, error: error.message });
    }
  }

  async updateHarvestDate(req: AuthRequest, res: Response) {
    try {
      const harvest = await harvestService.updateHarvestDate(req.params.id, req.user!.userId, req.body);
      res.json({ success: true, data: harvest });
    } catch (error: any) {
      res.status(400).json({ success: false, error: error.message });
    }
  }

  async getMatches(req: Request, res: Response) {
    try {
      const matches = await harvestService.getMatches(req.params.id);
      res.json({ success: true, data: matches });
    } catch (error: any) {
      res.status(500).json({ success: false, error: error.message });
    }
  }

  async getAIRecommendation(req: Request, res: Response) {
    try {
      const recommendation = await harvestService.getAIRecommendation(req.params.id);
      res.json({ success: true, data: recommendation });
    } catch (error: any) {
      res.status(500).json({ success: false, error: error.message });
    }
  }
}

export const harvestController = new HarvestController();
