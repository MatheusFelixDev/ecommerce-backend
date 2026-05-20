import { z } from 'zod';

export const listStockMovementsParamsSchema = z.object({
  id: z.string().uuid(),
}).strict();

export const listStockMovementsQuerySchema = z.object({
  page: z.coerce
    .number()
    .int()
    .positive()
    .optional()
    .default(1),

  perPage: z.coerce
    .number()
    .int()
    .positive()
    .max(100)
    .optional()
    .default(10),
}).strict();

export type ListStockMovementsParams = z.infer<
  typeof listStockMovementsParamsSchema
>;

export type ListStockMovementsQuery = z.infer<
  typeof listStockMovementsQuerySchema
>;
