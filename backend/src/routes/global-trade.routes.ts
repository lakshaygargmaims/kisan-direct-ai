import { Router } from 'express';
import { globalTradeController } from '../controllers/global-trade.controller';
import { authenticate, authorize } from '../middleware/auth';

const router = Router();

// ─── Products (public read, farmer write) ───
router.get('/products', (req, res) => globalTradeController.getGlobalProducts(req, res));
router.get('/products/:id', (req, res) => globalTradeController.getGlobalProduct(req, res));
router.post('/products', authenticate, authorize('FARMER', 'FPO'), (req, res) => globalTradeController.createGlobalProduct(req, res));

// ─── Buyer Profile ───
router.get('/buyer/profile', authenticate, (req, res) => globalTradeController.getBuyerProfile(req, res));
router.post('/buyer/profile', authenticate, (req, res) => globalTradeController.upsertBuyerProfile(req, res));

// ─── RFQ ───
router.get('/rfq', authenticate, (req, res) => globalTradeController.getRFQs(req, res));
router.post('/rfq', authenticate, (req, res) => globalTradeController.createRFQ(req, res));
router.get('/rfq/:id', (req, res) => globalTradeController.getRFQ(req, res));

// ─── Supplier Matching ───
router.get('/rfq/:id/matches', (req, res) => globalTradeController.getMatches(req, res));
router.post('/rfq/:id/match', (req, res) => globalTradeController.runMatching(req, res));

// ─── Supply Aggregation ───
router.get('/rfq/:id/aggregation', (req, res) => globalTradeController.getAggregation(req, res));
router.post('/rfq/:id/aggregate', (req, res) => globalTradeController.runAggregation(req, res));

// ─── Offers ───
router.post('/rfq/:id/offer', authenticate, authorize('FARMER', 'FPO'), (req, res) => globalTradeController.createOffer(req, res));
router.post('/offers/:id/accept', authenticate, (req, res) => globalTradeController.acceptOffer(req, res));

// ─── Shipping ───
router.get('/rfq/:id/shipping', (req, res) => globalTradeController.getShippingEstimate(req, res));

// ─── Shipments ───
router.post('/shipments', authenticate, (req, res) => globalTradeController.createShipment(req, res));
router.patch('/shipments/:id', authenticate, (req, res) => globalTradeController.updateShipment(req, res));

// ─── Eligibility ───
router.get('/eligibility', (req, res) => globalTradeController.checkEligibility(req, res));

// ─── Admin ───
router.get('/admin/stats', authenticate, authorize('ADMIN'), (req, res) => globalTradeController.getAdminStats(req, res));

export default router;
