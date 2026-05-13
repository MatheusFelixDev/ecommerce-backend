import type { FastifyReply, FastifyRequest } from 'fastify';

import { addCartItemBodySchema } from '../dtos/add-cart-item.dto';
import { addCartItemService } from '../services/add-cart-item.service';

export async function addCartItemController(
  request: FastifyRequest,
  reply: FastifyReply,
): Promise<FastifyReply> {
  const body = addCartItemBodySchema.parse(request.body);

  const cart = await addCartItemService.execute({
    userId: request.user.sub,
    productId: body.productId,
    quantity: body.quantity,
  });

  return reply.status(201).send({
    success: true,
    data: cart,
  });
}
