import { z } from 'zod';

export const getProductsQuerySchema = z.object({
  search: z.string().max(200).optional(),
  category: z.string().max(50).optional(),
  minPrice: z.coerce.number().min(0).optional(),
  maxPrice: z.coerce.number().min(0).optional(),
  organic: z.enum(['true', 'false']).optional(),
  city: z.string().max(100).optional(),
  lat: z.coerce.number().min(-90).max(90).optional(),
  lng: z.coerce.number().min(-180).max(180).optional(),
  radius: z.coerce.number().min(1).max(10000).optional(),
  sortBy: z.enum(['nearest', 'cheapest', 'best_rated', 'newest']).optional(),
  farmerId: z.string().optional(),
  page: z.coerce.number().int().min(1).optional(),
  limit: z.coerce.number().int().min(1).max(100).optional(),
});

const deliveryRuleSchema = z.object({
  deliveryMode: z.string().max(50).optional(),
  maxDeliveryRadiusKm: z.number().min(1).max(10000).optional(),
  interstateAllowed: z.boolean().optional(),
  coldChainRequired: z.boolean().optional(),
  maximumTransitHours: z.number().int().min(1).max(720).optional(),
  sameDayRequired: z.boolean().optional(),
}).strict().optional();

export const createProductSchema = z.object({
  name: z.string().min(1, 'Product name is required').max(200),
  description: z.string().max(2000).optional(),
  pricePerKg: z.number().min(0.01, 'Price must be positive'),
  availableQuantity: z.number().min(0, 'Quantity cannot be negative'),
  minOrderQuantity: z.number().min(0).optional(),
  qualityGrade: z.enum(['A+', 'A', 'B+', 'B', 'C', 'D']).optional(),
  organicCertified: z.boolean().optional(),
  harvestDate: z.string().refine((v) => !v || /^\d{4}-\d{2}-\d{2}$/.test(v), { message: 'Harvest date must be YYYY-MM-DD' }).optional(),
  shelfLife: z.number().int().min(0).optional(),
  storageRequirement: z.string().max(200).optional(),
  coldChainRequired: z.boolean().optional(),
  categoryId: z.string().optional(),
  deliveryRule: deliveryRuleSchema,
});

export const updateProductSchema = createProductSchema.partial();

export const productIdParamSchema = z.object({
  id: z.string().min(1, 'Product ID is required'),
});

export type GetProductsQuery = z.infer<typeof getProductsQuerySchema>;
export type CreateProductInput = z.infer<typeof createProductSchema>;
