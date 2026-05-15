import type { FastifyReply, FastifyRequest } from 'fastify';

import { reviewCheckoutBodySchema } from '../dtos/review-checkout.dto';
import { reviewCheckoutService } from '../services/review-checkout.service';

export async function reviewCheckoutController(
  request: FastifyRequest,
  reply: FastifyReply,
): Promise<FastifyReply> {
  const body = reviewCheckoutBodySchema.parse(request.body);

  const checkout = await reviewCheckoutService.execute({
    userId: request.user.sub,
    addressId: body.addressId,
    shippingServiceCode: body.shippingServiceCode,
    paymentMethod: body.paymentMethod,
    couponCode: body.couponCode,
  });

  return reply.status(200).send({
    success: true,
    data: checkout,
  });
}
