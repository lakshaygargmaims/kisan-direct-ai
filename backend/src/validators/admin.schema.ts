import { z } from 'zod';

const ROLES = ['CONSUMER', 'FARMER', 'FPO', 'B2B_BUYER', 'LOGISTICS', 'ADMIN'] as const;

export const getUsersQuerySchema = z.object({
  role: z.enum(ROLES).optional(),
  page: z.coerce.number().int().min(1).optional(),
  limit: z.coerce.number().int().min(1).max(100).optional(),
});

export const userIdParamSchema = z.object({
  id: z.string().min(1, 'User ID is required'),
});

export const updateUserStatusSchema = z.object({
  isActive: z.boolean({ required_error: 'isActive is required' }),
});

export const updateCancellationPolicySchema = z.object({
  name: z.string().max(100).optional(),
  beforeAcceptance: z.number().int().min(0).max(100).optional(),
  afterAcceptance: z.number().int().min(0).max(100).optional(),
  afterPreparation: z.number().int().min(0).max(100).optional(),
  afterLogistics: z.number().int().min(0).max(100).optional(),
  afterPickup: z.number().int().min(0).max(100).optional(),
  isActive: z.boolean().optional(),
});

export const disputesQuerySchema = z.object({
  status: z.enum(['PENDING', 'IN_REVIEW', 'RESOLVED', 'DISMISSED']).optional(),
  page: z.coerce.number().int().min(1).optional(),
  limit: z.coerce.number().int().min(1).max(100).optional(),
});

export const resolveDisputeSchema = z.object({
  resolution: z.string().min(1, 'Resolution is required').max(2000),
  refundAmount: z.number().min(0).optional(),
});

export const disputeIdParamSchema = z.object({
  id: z.string().min(1, 'Dispute ID is required'),
});

export const analyticsQuerySchema = z.object({
  startDate: z.string().datetime().optional(),
  endDate: z.string().datetime().optional(),
  product: z.string().max(100).optional(),
  region: z.string().max(100).optional(),
}).optional();
