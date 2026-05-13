import { z } from 'zod';

export const orderStatusSchema = z.enum([
  'PENDING',
  'PAID',
  'PROCESSING',
  'SHIPPED',
  'DELIVERED',
  'CANCELED',
]);

export const listOrdersQuerySchema = z.object({
  page: z.coerce.number().int().positive().default(1),
  perPage: z.coerce.number().int().positive().max(100).default(10),
  status: orderStatusSchema.optional(),
});

export type ListOrdersQuery = z.infer<
  typeof listOrdersQuerySchema
>;
