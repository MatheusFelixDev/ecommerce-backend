import type { FastifyReply, FastifyRequest } from 'fastify';

import { cancelOrderParamsSchema } from '../dtos/cancel-order.dto';
import { cancelOrderService } from '../services/cancel-order.service';

export async function cancelOrderController(
  request: FastifyRequest,
  reply: FastifyReply,
): Promise<FastifyReply> {
  const params = cancelOrderParamsSchema.parse(request.params);

  const order = await cancelOrderService.execute({
    id: params.id,
    userId: request.user.sub,
  });

  return reply.status(200).send({
    success: true,
    data: order,
  });
}
