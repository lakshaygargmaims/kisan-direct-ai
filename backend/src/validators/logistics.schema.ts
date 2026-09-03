import { z } from 'zod';

export const acceptClubbingSchema = z.object({
  routeId: z.string().min(1, 'Route ID is required'),
  orders: z.array(z.object({
    orderId: z.string().min(1),
  })).min(1, 'At least one order is required'),
  totalQuantity: z.number().min(0.01),
  vehicleType: z.string().min(1),
  totalDistance: z.number().min(0),
  estimatedTime: z.number().int().min(0),
  separateCost: z.number().min(0),
  clubbedCost: z.number().min(0),
  savings: z.number().min(0),
});

export const routeIdParamSchema = z.object({
  routeId: z.string().min(1, 'Route ID is required'),
});

export const deliveryQuoteSchema = z.object({
  pickupLat: z.number().min(-90).max(90),
  pickupLng: z.number().min(-180).max(180),
  dropoffLat: z.number().min(-90).max(90),
  dropoffLng: z.number().min(-180).max(180),
  weight: z.number().min(0.01, 'Weight must be positive'),
  coldChain: z.boolean(),
});

export const createDeliverySchema = z.object({
  orderId: z.string().optional(),
  estimatedTime: z.number().min(0).optional(),
  pickupLat: z.number().min(-90).max(90).optional(),
  pickupLng: z.number().min(-180).max(180).optional(),
  dropoffLat: z.number().min(-90).max(90).optional(),
  dropoffLng: z.number().min(-180).max(180).optional(),
}).refine(
  (data) => data.orderId || (data.pickupLat !== undefined),
  'Either orderId or pickup coordinates must be provided',
);

export type AcceptClubbingInput = z.infer<typeof acceptClubbingSchema>;
export type DeliveryQuoteInput = z.infer<typeof deliveryQuoteSchema>;
