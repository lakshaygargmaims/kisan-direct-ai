import { Router } from 'express';
import {
  getHeatmap, getZones, getProductDemandEndpoint, getNearby, getRecommendation,
} from '../controllers/demand.controller';

const router = Router();

router.get('/heatmap', getHeatmap);
router.get('/zones', getZones);
router.get('/product/:productName', getProductDemandEndpoint);
router.get('/nearby', getNearby);
router.get('/recommendation', getRecommendation);

export default router;
