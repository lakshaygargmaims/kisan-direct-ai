import { z } from 'zod';

export const getNotificationsQuerySchema = z.object({
  unreadOnly: z.enum(['true', 'false']).optional(),
  page: z.coerce.number().int().min(1).optional(),
  limit: z.coerce.number().int().min(1).max(100).optional(),
});

export const notificationIdParamSchema = z.object({
  id: z.string().min(1, 'Notification ID is required'),
});
