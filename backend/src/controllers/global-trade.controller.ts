import { Request, Response } from 'express';
import { globalTradeService } from '../services/global-trade.service';
import { AuthRequest } from '../types';

export class GlobalTradeController {

  // ─── Products ───
  async getGlobalProducts(req: Request, res: Response) {
    try {
      const result = await globalTradeService.getGlobalProducts(req.query);
      res.json({ success: true, data: result });
    } catch (error: any) {
      res.status(400).json({ success: false, error: error.message });
    }
  }

  async getGlobalProduct(req: Request, res: Response) {
    try {
      const product = await globalTradeService.getGlobalProduct(req.params.id);
      if (!product) { res.status(404).json({ success: false, error: 'Product not found' }); return; }
      res.json({ success: true, data: product });
    } catch (error: any) {
      res.status(400).json({ success: false, error: error.message });
    }
  }

  async createGlobalProduct(req: AuthRequest, res: Response) {
    try {
      const product = await globalTradeService.createGlobalProduct(req.body, req.user!.userId);
      res.json({ success: true, data: product });
    } catch (error: any) {
      res.status(400).json({ success: false, error: error.message });
    }
  }

  // ─── Buyer Profile ───
  async getBuyerProfile(req: AuthRequest, res: Response) {
    try {
      const profile = await globalTradeService.getBuyerProfile(req.user!.userId);
      res.json({ success: true, data: profile });
    } catch (error: any) {
      res.status(400).json({ success: false, error: error.message });
    }
  }

  async upsertBuyerProfile(req: AuthRequest, res: Response) {
    try {
      const profile = await globalTradeService.upsertBuyerProfile(req.user!.userId, req.body);
      res.json({ success: true, data: profile });
    } catch (error: any) {
      res.status(400).json({ success: false, error: error.message });
    }
  }

  // ─── RFQ ───
  async createRFQ(req: AuthRequest, res: Response) {
    try {
      const rfq = await globalTradeService.createRFQ(req.body, req.user!.userId);
      res.json({ success: true, data: rfq });
    } catch (error: any) {
      res.status(400).json({ success: false, error: error.message });
    }
  }

  async getRFQs(req: AuthRequest, res: Response) {
    try {
      const isAdmin = req.user!.role === 'ADMIN';
      const rfqs = await globalTradeService.getRFQs(isAdmin ? undefined : req.user!.userId, req.query);
      res.json({ success: true, data: { rfqs } });
    } catch (error: any) {
      res.status(400).json({ success: false, error: error.message });
    }
  }

  async getRFQ(req: Request, res: Response) {
    try {
      const rfq = await globalTradeService.getRFQ(req.params.id);
      if (!rfq) { res.status(404).json({ success: false, error: 'RFQ not found' }); return; }
      res.json({ success: true, data: rfq });
    } catch (error: any) {
      res.status(400).json({ success: false, error: error.message });
    }
  }

  // ─── Matches ───
  async getMatches(req: Request, res: Response) {
    try {
      const rfq = await globalTradeService.getRFQ(req.params.id);
      res.json({ success: true, data: { matches: rfq?.matches || [] } });
    } catch (error: any) {
      res.status(400).json({ success: false, error: error.message });
    }
  }

  async runMatching(req: Request, res: Response) {
    try {
      const matches = await globalTradeService.runSupplierMatching(req.params.id);
      res.json({ success: true, data: { matches } });
    } catch (error: any) {
      res.status(400).json({ success: false, error: error.message });
    }
  }

  // ─── Aggregation ───
  async getAggregation(req: Request, res: Response) {
    try {
      const rfq = await globalTradeService.getRFQ(req.params.id);
      res.json({ success: true, data: { aggregation: rfq?.aggregations?.[0] || null } });
    } catch (error: any) {
      res.status(400).json({ success: false, error: error.message });
    }
  }

  async runAggregation(req: Request, res: Response) {
    try {
      const agg = await globalTradeService.runSupplyAggregation(req.params.id);
      res.json({ success: true, data: { aggregation: agg } });
    } catch (error: any) {
      res.status(400).json({ success: false, error: error.message });
    }
  }

  // ─── Offers ───
  async createOffer(req: AuthRequest, res: Response) {
    try {
      const offer = await globalTradeService.createOffer(req.body, req.user!.userId);
      res.json({ success: true, data: offer });
    } catch (error: any) {
      res.status(400).json({ success: false, error: error.message });
    }
  }

  async acceptOffer(req: AuthRequest, res: Response) {
    try {
      const offer = await globalTradeService.acceptOffer(req.params.id, req.user!.userId);
      res.json({ success: true, data: offer });
    } catch (error: any) {
      res.status(400).json({ success: false, error: error.message });
    }
  }

  // ─── Shipping ───
  async getShippingEstimate(req: Request, res: Response) {
    try {
      const estimates = await globalTradeService.getShippingEstimate(req.params.id);
      res.json({ success: true, data: { estimates } });
    } catch (error: any) {
      res.status(400).json({ success: false, error: error.message });
    }
  }

  // ─── Shipments ───
  async createShipment(req: AuthRequest, res: Response) {
    try {
      const shipment = await globalTradeService.createShipment(req.body.rfqId, req.body);
      res.json({ success: true, data: shipment });
    } catch (error: any) {
      res.status(400).json({ success: false, error: error.message });
    }
  }

  async updateShipment(req: Request, res: Response) {
    try {
      const shipment = await globalTradeService.updateShipmentStatus(req.params.id, req.body.status, req.body.notes);
      res.json({ success: true, data: shipment });
    } catch (error: any) {
      res.status(400).json({ success: false, error: error.message });
    }
  }

  // ─── Eligibility ───
  async checkEligibility(req: Request, res: Response) {
    try {
      const productId = req.query.productId as string;
      const destination = req.query.destination as string;
      if (!productId || !destination) {
        res.status(400).json({ success: false, error: 'productId and destination are required' });
        return;
      }
      const result = await globalTradeService.checkEligibility(productId, destination, parseFloat(req.query.quantity as string));
      res.json({ success: true, data: result });
    } catch (error: any) {
      res.status(400).json({ success: false, error: error.message });
    }
  }

  // ─── Admin ───
  async getAdminStats(req: Request, res: Response) {
    try {
      const stats = await globalTradeService.getAdminStats();
      res.json({ success: true, data: stats });
    } catch (error: any) {
      res.status(400).json({ success: false, error: error.message });
    }
  }
}

export const globalTradeController = new GlobalTradeController();
