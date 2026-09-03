import { z } from 'zod';

const ORDER_STATUSES = [
  'PENDING_ADVANCE', 'ADVANCE_PAID', 'FARMER_ACCEPTED', 'PREPARING',
  'LOGISTICS_ASSIGNED', 'PICKED_UP', 'IN_TRANSIT', 'DELIVERED',
  'COMPLETED', 'CANCELLED', 'REFUND_PENDING', 'REFUNDED', 'DISPUTED',
] as const;

export const createOrderSchema = z.object({
  productId: z.string().min(1, 'Product ID is required'),
  quantity: z.number().min(0.01, 'Quantity must be positive'),
  deliveryAddress: z.string().min(5, 'Delivery address is required').max(500),
  deliveryLatitude: z.number().min(-90).max(90),
  deliveryLongitude: z.number().min(-180).max(180),
  deliveryNotes: z.string().max(500).optional(),
});

export const getOrdersQuerySchema = z.object({
  status: z.enum(ORDER_STATUSES).optional(),
  page: z.coerce.number().int().min(1).optional(),
  limit: z.coerce.number().int().min(1).max(100).optional(),
});

export const orderIdParamSchema = z.object({
  id: z.string().min(1, 'Order ID is required'),
});

export const updateOrderStatusSchema = z.object({
  status: z.enum(ORDER_STATUSES, { errorMap: () => ({ message: 'Invalid order status' }) }),
  notes: z.string().max(500).optional(),
});

export const cancelOrderSchema = z.object({
  reason: z.string().min(1, 'Cancellation reason is required').max(500),
});

export type CreateOrderInput = z.infer<typeof createOrderSchema>;
export type UpdateOrderStatusInput = z.infer<typeof updateOrderStatusSchema>;
