import { z } from 'zod';

export const addCartItemBodySchema = z.object({
  productId: z.string().uuid(),
  quantity: z.number().int().positive(),
});

export type AddCartItemBody = z.infer<typeof addCartItemBodySchema>;
