import { Router } from 'express';
import { logisticsController } from '../controllers/logistics.controller';
import { authenticate, authorize } from '../middleware/auth';
import { validate } from '../middleware/validate';
import { acceptClubbingSchema, routeIdParamSchema, deliveryQuoteSchema, createDeliverySchema } from '../validators';

const router = Router();

// Order-clubbing endpoints act on the CALLING farmer's own orders (farmerId = req.user.userId)
router.get('/clubbing', authenticate, authorize('FARMER', 'FPO'), (req, res) => logisticsController.getClubbingOpportunities(req, res));
router.post('/clubbing/accept', authenticate, authorize('FARMER', 'FPO'), validate(acceptClubbingSchema, 'body'), (req, res) => logisticsController.acceptClubbing(req, res));
router.post('/clubbing/:routeId/reject', authenticate, authorize('FARMER', 'FPO'), validate(routeIdParamSchema, 'params'), (req, res) => logisticsController.rejectClubbing(req, res));
router.post('/quote', authenticate, validate(deliveryQuoteSchema, 'body'), (req, res) => logisticsController.estimateDelivery(req, res));
router.post('/create', authenticate, validate(createDeliverySchema, 'body'), (req, res) => logisticsController.createDelivery(req, res));

export default router;
