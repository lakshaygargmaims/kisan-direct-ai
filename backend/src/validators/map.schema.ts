import { z } from 'zod';

export const mapFarmersQuerySchema = z.object({
  lat: z.coerce.number().min(-90).max(90).optional(),
  lng: z.coerce.number().min(-180).max(180).optional(),
  radius: z.coerce.number().min(1).max(10000).default(50),
  product: z.string().max(100).optional(),
});
