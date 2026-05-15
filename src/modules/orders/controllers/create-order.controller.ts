import type { FastifyReply, FastifyRequest } from 'fastify';

import { createOrderBodySchema } from '../dtos/create-order.dto';
import { createOrderService } from '../services/create-order.service';

export async function createOrderController(
  request: FastifyRequest,
  reply: FastifyReply,
): Promise<FastifyReply> {
  const body = createOrderBodySchema.parse(request.body);

  const order = await createOrderService.execute({
    userId: request.user.sub,
    addressId: body.addressId,
    shippingServiceCode: body.shippingServiceCode,
    paymentMethod: body.paymentMethod,
    couponCode: body.couponCode,
  });

  return reply.status(201).send({
    success: true,
    data: order,
  });
}
