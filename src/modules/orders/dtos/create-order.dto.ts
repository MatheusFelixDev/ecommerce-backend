import { z } from 'zod';

export const createOrderBodySchema = z.object({
  addressId: z.string().uuid(),
  shippingServiceCode: z.string().trim().min(1),
  paymentMethod: z.enum(['CREDIT_CARD', 'PIX', 'BOLETO']),
  couponCode: z.string().trim().min(1).nullable().optional(),
}).strict();

export type CreateOrderBody = z.infer<
  typeof createOrderBodySchema
>;
