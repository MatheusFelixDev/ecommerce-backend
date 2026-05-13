import type { FastifyReply, FastifyRequest } from 'fastify';

import { updateCartItemQuantityParamsSchema } from '../dtos/update-cart-item-quantity.dto';
import { removeCartItemService } from '../services/remove-cart-item.service';

export async function removeCartItemController(
  request: FastifyRequest,
  reply: FastifyReply,
): Promise<FastifyReply> {
  const params = updateCartItemQuantityParamsSchema.parse(
    request.params,
  );

  const cart = await removeCartItemService.execute({
    id: params.id,
    userId: request.user.sub,
  });

  return reply.status(200).send({
    success: true,
    data: cart,
  });
}
