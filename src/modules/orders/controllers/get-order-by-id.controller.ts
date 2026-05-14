import type { FastifyReply, FastifyRequest } from 'fastify';

import { getOrderByIdParamsSchema } from '../dtos/get-order-by-id.dto';
import { getOrderByIdService } from '../services/get-order-by-id.service';

export async function getOrderByIdController(
  request: FastifyRequest,
  reply: FastifyReply,
): Promise<FastifyReply> {
  const params = getOrderByIdParamsSchema.parse(request.params);

  const order = await getOrderByIdService.execute({
    id: params.id,
    userId: request.user.sub,
  });

  return reply.status(200).send({
    success: true,
    data: order,
  });
}
