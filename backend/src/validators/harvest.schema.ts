import { z } from 'zod';

export const createHarvestSchema = z.object({
  productName: z.string().min(1),
  description: z.string().optional(),
  categoryId: z.string().optional(),
  expectedHarvestDate: z.string().transform(v => new Date(v)),
  expectedQuantity: z.number().positive(),
  unit: z.string().default('kg'),
  qualityGrade: z.string().default('A'),
  expectedPricePerUnit: z.number().positive(),
  minBookingQuantity: z.number().positive().default(1),
  maxBookingPerBuyer: z.number().positive().optional(),
  farmLatitude: z.number(),
  farmLongitude: z.number(),
  farmAddress: z.string().optional(),
  deliveryRadiusKm: z.number().positive().default(50),
  deliveryType: z.enum(['LOCAL', 'INTERSTATE', 'PICKUP']).default('LOCAL'),
  coldChainRequired: z.boolean().default(false),
  advanceBookingEnabled: z.boolean().default(true),
  advancePercentage: z.number().min(1).max(100).default(20),
  bookingOpenDate: z.string().optional().transform(v => v ? new Date(v) : undefined),
  bookingCloseDate: z.string().optional().transform(v => v ? new Date(v) : undefined),
  notes: z.string().optional(),
});

export const updateHarvestSchema = createHarvestSchema.partial();

export const reserveHarvestSchema = z.object({
  quantity: z.number().positive(),
  deliveryAddress: z.string().min(1),
  deliveryLatitude: z.number(),
  deliveryLongitude: z.number(),
  acknowledged: z.boolean().refine(v => v === true, { message: 'You must acknowledge the terms' }),
});

export const confirmHarvestSchema = z.object({
  actualQuantity: z.number().positive(),
  actualQualityGrade: z.string().optional(),
  harvestDate: z.string().optional().transform(v => v ? new Date(v) : undefined),
});

export const updateHarvestDateSchema = z.object({
  newDate: z.string().transform(v => new Date(v)),
  reason: z.string().min(1),
  reasonType: z.enum(['WEATHER', 'CROP_CONDITION', 'OPERATIONAL', 'OTHER']).default('OTHER'),
});

export const harvestIdParamSchema = z.object({
  id: z.string().min(1),
});
