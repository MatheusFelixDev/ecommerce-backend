import { z } from 'zod';

export const updateOrderStatusParamsSchema = z.object({
  id: z.string().uuid(),
}).strict();

export const updateOrderStatusBodySchema = z.object({
  status: z.enum(['PROCESSING', 'SEPARATED', 'SHIPPED', 'DELIVERED']),
  trackingCode: z.string().trim().min(1).nullable().optional(),
  trackingUrl: z.string().trim().url().nullable().optional(),
}).strict();

export type UpdateOrderStatusParams = z.infer<
  typeof updateOrderStatusParamsSchema
>;

export type UpdateOrderStatusBody = z.infer<
  typeof updateOrderStatusBodySchema
>;
