import type { FastifyReply, FastifyRequest } from 'fastify';

import { calculateShippingBodySchema } from '../dtos/calculate-shipping.dto';
import { calculateShippingService } from '../services/calculate-shipping.service';

export async function calculateShippingController(
  request: FastifyRequest,
  reply: FastifyReply,
): Promise<FastifyReply> {
  const body = calculateShippingBodySchema.parse(request.body);

  const shipping = await calculateShippingService.execute({
    userId: request.user.sub,
    addressId: body.addressId,
  });

  return reply.status(200).send({
    success: true,
    data: shipping,
  });
}
