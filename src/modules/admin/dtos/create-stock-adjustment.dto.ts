import { z } from 'zod';

export const createStockAdjustmentParamsSchema = z.object({
  id: z.string().uuid(),
}).strict();

export const createStockAdjustmentBodySchema = z.object({
  quantityChange: z
    .number()
    .int()
    .refine((value) => value !== 0, {
      message: 'Quantity change must be different from zero.',
    }),

  reason: z
    .string()
    .trim()
    .min(3)
    .max(255),
}).strict();

export type CreateStockAdjustmentParams = z.infer<
  typeof createStockAdjustmentParamsSchema
>;

export type CreateStockAdjustmentBody = z.infer<
  typeof createStockAdjustmentBodySchema
>;
