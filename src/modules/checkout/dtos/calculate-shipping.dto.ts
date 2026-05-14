import { z } from 'zod';

export const calculateShippingBodySchema = z.object({
  addressId: z.string().uuid(),
});

export type CalculateShippingBody = z.infer<
  typeof calculateShippingBodySchema
>;
