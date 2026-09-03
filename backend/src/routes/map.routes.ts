import { Router, Request, Response } from 'express';
import { prisma } from '../utils/prisma';
import { validate } from '../middleware/validate';
import { mapFarmersQuerySchema } from '../validators';

const router = Router();

router.get('/farmers', validate(mapFarmersQuerySchema, 'query'), async (req: Request, res: Response) => {
  try {
    const { lat, lng, radius = 50, product } = req.query;
    const farmers = await prisma.farmerProfile.findMany({
      include: { user: { select: { name: true, id: true } } },
    });

    let result = farmers.map((f: any) => ({
      id: f.userId,
      name: f.farmName,
      lat: f.latitude,
      lng: f.longitude,
      city: f.city,
      specializations: f.specializations,
      trustScore: f.trustScore,
      organic: f.organicCertified,
      type: 'farmer',
    }));

    // Filter by distance if coordinates provided
    if (lat && lng) {
      const userLat = Number(lat);
      const userLng = Number(lng);
      const maxRadius = Number(radius);
      result = result.filter((f: any) => {
        const dist = calculateDistance(userLat, userLng, f.lat, f.lng);
        return dist <= maxRadius;
      });
    }

    res.json({ success: true, data: result });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

router.get('/buyers', async (req: Request, res: Response) => {
  try {
    const buyers = await prisma.buyerProfile.findMany({
      include: { user: { select: { name: true, id: true } } },
    });
    const result = buyers.map((b: any) => ({
      id: b.userId,
      name: b.businessName,
      lat: b.latitude,
      lng: b.longitude,
      city: b.city,
      type: 'buyer',
      businessType: b.businessType,
    }));
    res.json({ success: true, data: result });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

router.get('/hubs', async (req: Request, res: Response) => {
  try {
    const hubs = await prisma.collectionHub.findMany({ where: { isActive: true } });
    res.json({ success: true, data: hubs });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

router.get('/demand', async (req: Request, res: Response) => {
  try {
    // Demo demand data
    const demands = [
      { product: 'Tomato', lat: 28.5245, lng: 77.2066, quantity: 500, maxPrice: 30, city: 'South Delhi' },
      { product: 'Onion', lat: 28.6300, lng: 77.2170, quantity: 1000, maxPrice: 25, city: 'Connaught Place' },
      { product: 'Potato', lat: 28.4595, lng: 77.0266, quantity: 2000, maxPrice: 20, city: 'Gurugram' },
      { product: 'Milk', lat: 28.6692, lng: 77.4538, quantity: 200, maxPrice: 60, city: 'Ghaziabad' },
    ];
    res.json({ success: true, data: demands });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

function calculateDistance(lat1: number, lng1: number, lat2: number, lng2: number): number {
  const R = 6371;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLng = ((lng2 - lng1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((lat1 * Math.PI) / 180) * Math.cos((lat2 * Math.PI) / 180) * Math.sin(dLng / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

export default router;
