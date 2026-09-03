import { Request, Response, NextFunction } from 'express';
import {
  generateHeatmapData,
  getProductDemand,
  getAIRecommendation,
  getNearbyDemand,
} from '../services/demand.service';

function num(val: string | undefined, fallback: number) {
  return parseFloat(val || '') || fallback;
}

export function getHeatmap(req: Request, res: Response) {
  const data = generateHeatmapData(
    (req.query.product as string) || 'Tomato',
    num(req.query.lat as string, 28.6139),
    num(req.query.lng as string, 77.2090),
    num(req.query.radius as string, 50),
  );
  res.json({ success: true, data });
}

export function getZones(req: Request, res: Response) {
  const data = generateHeatmapData(
    (req.query.product as string) || 'Tomato',
    num(req.query.lat as string, 28.6139),
    num(req.query.lng as string, 77.2090),
    num(req.query.radius as string, 100),
  );
  res.json({ success: true, data: data.zones });
}

export function getProductDemandEndpoint(req: Request, res: Response) {
  const data = getProductDemand(
    req.params.productName,
    num(req.query.lat as string, 28.6139),
    num(req.query.lng as string, 77.2090),
    num(req.query.radius as string, 50),
  );
  res.json({ success: true, data });
}

export function getNearby(req: Request, res: Response) {
  const data = getNearbyDemand(
    num(req.query.lat as string, 28.6139),
    num(req.query.lng as string, 77.2090),
    num(req.query.radius as string, 25),
  );
  res.json({ success: true, data });
}

export function getRecommendation(req: Request, res: Response) {
  const data = getAIRecommendation(
    (req.query.product as string) || 'Tomato',
    num(req.query.lat as string, 28.6139),
    num(req.query.lng as string, 77.2090),
  );
  res.json({ success: true, data });
}
