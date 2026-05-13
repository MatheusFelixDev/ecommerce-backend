import type { FastifyReply, FastifyRequest } from 'fastify';

import { listCartService } from '../services/list-cart.service';

export async function listCartController(
  request: FastifyRequest,
  reply: FastifyReply,
): Promise<FastifyReply> {
  const userId = request.user.sub;

  const cart = await listCartService.execute({
    userId,
  });

  return reply.status(200).send({
    success: true,
    data: cart,
  });
}
