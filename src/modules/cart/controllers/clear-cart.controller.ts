import type { FastifyReply, FastifyRequest } from 'fastify';

import { clearCartService } from '../services/clear-cart.service';

export async function clearCartController(
  request: FastifyRequest,
  reply: FastifyReply,
): Promise<FastifyReply> {
  const cart = await clearCartService.execute({
    userId: request.user.sub,
  });

  return reply.status(200).send({
    success: true,
    data: cart,
  });
}
