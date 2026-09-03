import { z } from 'zod';

export const createPaymentSchema = z.object({
  orderId: z.string().min(1, 'Order ID is required'),
  amount: z.number().min(0.01, 'Amount must be positive').max(10_000_000, 'Amount too large'),
});

export const refundSchema = z.object({
  amount: z.number().min(0.01, 'Refund amount must be positive').max(10_000_000),
  reason: z.string().min(1, 'Refund reason is required').max(500),
});

export const paymentOrderIdParamSchema = z.object({
  orderId: z.string().min(1, 'Order ID is required'),
});

export type CreatePaymentInput = z.infer<typeof createPaymentSchema>;
export type RefundInput = z.infer<typeof refundSchema>;
