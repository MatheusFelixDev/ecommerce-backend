import type { FastifyReply, FastifyRequest } from 'fastify';

import {
  updateCartItemQuantityBodySchema,
  updateCartItemQuantityParamsSchema,
} from '../dtos/update-cart-item-quantity.dto';
import { updateCartItemQuantityService } from '../services/update-cart-item-quantity.service';

export async function updateCartItemQuantityController(
  request: FastifyRequest,
  reply: FastifyReply,
): Promise<FastifyReply> {
  const params = updateCartItemQuantityParamsSchema.parse(
    request.params,
  );
  const body = updateCartItemQuantityBodySchema.parse(
    request.body,
  );

  const cart = await updateCartItemQuantityService.execute({
    id: params.id,
    userId: request.user.sub,
    quantity: body.quantity,
  });

  return reply.status(200).send({
    success: true,
    data: cart,
  });
}
