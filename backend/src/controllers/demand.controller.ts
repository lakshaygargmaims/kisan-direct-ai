import { Request, Response } from 'express';
import {
  generateHeatmapData,
  getProductDemand,
  getAIRecommendation,
  getNearbyDemand,
} from '../services/demand.service';

function num(val: string | undefined, fallback: number) {
  return parseFloat(val || '') || fallback;
}

export async function getHeatmap(req: Request, res: Response) {
  try {
    const data = await generateHeatmapData(
      (req.query.product as string) || 'Tomato',
      num(req.query.lat as string, 28.6139),
      num(req.query.lng as string, 77.2090),
      num(req.query.radius as string, 50),
    );
    res.json({ success: true, data });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
}

export async function getZones(req: Request, res: Response) {
  try {
    const data = await generateHeatmapData(
      (req.query.product as string) || 'Tomato',
      num(req.query.lat as string, 28.6139),
      num(req.query.lng as string, 77.2090),
      num(req.query.radius as string, 100),
    );
    res.json({ success: true, data: data.zones });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
}

export async function getProductDemandEndpoint(req: Request, res: Response) {
  try {
    const data = await getProductDemand(
      req.params.productName,
      num(req.query.lat as string, 28.6139),
      num(req.query.lng as string, 77.2090),
      num(req.query.radius as string, 50),
    );
    res.json({ success: true, data });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
}

export async function getNearby(req: Request, res: Response) {
  try {
    const data = await getNearbyDemand(
      num(req.query.lat as string, 28.6139),
      num(req.query.lng as string, 77.2090),
      num(req.query.radius as string, 25),
    );
    res.json({ success: true, data });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
}

export async function getRecommendation(req: Request, res: Response) {
  try {
    const data = await getAIRecommendation(
      (req.query.product as string) || 'Tomato',
      num(req.query.lat as string, 28.6139),
      num(req.query.lng as string, 77.2090),
    );
    res.json({ success: true, data });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
}
