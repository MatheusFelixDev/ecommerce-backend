import { z } from 'zod';

export const createOrderBodySchema = z.object({
  addressId: z.string().uuid(),
});

export type CreateOrderBody = z.infer<
  typeof createOrderBodySchema
>;
