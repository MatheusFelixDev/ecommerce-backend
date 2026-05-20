import { z } from 'zod';

export const updateCartItemQuantityParamsSchema = z.object({
  id: z.string().uuid(),
}).strict();

export const updateCartItemQuantityBodySchema = z.object({
  quantity: z.number().int().positive(),
}).strict();

export type UpdateCartItemQuantityParams = z.infer<
  typeof updateCartItemQuantityParamsSchema
>;

export type UpdateCartItemQuantityBody = z.infer<
  typeof updateCartItemQuantityBodySchema
>;
