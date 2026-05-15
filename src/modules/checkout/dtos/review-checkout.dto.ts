import { z } from 'zod';

export const reviewCheckoutBodySchema = z.object({
  addressId: z.string().uuid(),
  shippingServiceCode: z.string().trim().min(1),
  paymentMethod: z.enum(['CREDIT_CARD', 'PIX', 'BOLETO']),
  couponCode: z.string().trim().min(1).nullable().optional(),
});

export type ReviewCheckoutBody = z.infer<
  typeof reviewCheckoutBodySchema
>;
