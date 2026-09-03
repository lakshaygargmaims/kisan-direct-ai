import { Router } from 'express';
import { harvestController } from '../controllers/harvest.controller';
import { authenticate, authorize } from '../middleware/auth';
import { validate } from '../middleware/validate';
import { createHarvestSchema, updateHarvestSchema, reserveHarvestSchema, confirmHarvestSchema, updateHarvestDateSchema, harvestIdParamSchema } from '../validators/harvest.schema';

const router = Router();

// Public / authenticated routes
router.get('/', (req, res) => harvestController.getHarvests(req, res));
router.get('/upcoming', (req, res) => harvestController.getHarvests({ ...req, query: { ...req.query, upcoming: 'true' } } as any, res));
router.get('/:id', validate(harvestIdParamSchema, 'params'), (req, res) => harvestController.getHarvestById(req, res));
router.get('/:id/matches', validate(harvestIdParamSchema, 'params'), (req, res) => harvestController.getMatches(req, res));
router.get('/:id/ai-recommendation', validate(harvestIdParamSchema, 'params'), (req, res) => harvestController.getAIRecommendation(req, res));
router.get('/:id/reservations', validate(harvestIdParamSchema, 'params'), (req, res) => harvestController.getReservations(req, res));

// My reservations
router.get('/my/reservations', authenticate, (req, res) => harvestController.getMyReservations(req, res));

// Farmer routes
router.post('/', authenticate, authorize('FARMER', 'FPO'), validate(createHarvestSchema, 'body'), (req, res) => harvestController.createHarvest(req, res));
router.put('/:id', authenticate, authorize('FARMER', 'FPO'), validate(updateHarvestSchema, 'body'), (req, res) => harvestController.updateHarvest(req, res));
router.delete('/:id', authenticate, authorize('FARMER', 'FPO'), (req, res) => harvestController.deleteHarvest(req, res));
router.post('/:id/confirm', authenticate, authorize('FARMER', 'FPO'), validate(confirmHarvestSchema, 'body'), (req, res) => harvestController.confirmHarvest(req, res));
router.post('/:id/update-date', authenticate, authorize('FARMER', 'FPO'), validate(updateHarvestDateSchema, 'body'), (req, res) => harvestController.updateHarvestDate(req, res));

// Buyer reservation
router.post('/:id/reserve', authenticate, authorize('CONSUMER', 'B2B_BUYER'), validate(reserveHarvestSchema, 'body'), (req, res) => harvestController.reserveHarvest(req, res));

export default router;
