import type { FastifyReply, FastifyRequest } from 'fastify';

import { cancelOrderParamsSchema } from '../../orders/dtos/cancel-order.dto';
import { adminCancelOrderService } from '../services/admin-cancel-order.service';

export async function adminCancelOrderController(
  request: FastifyRequest,
  reply: FastifyReply,
): Promise<FastifyReply> {
  const params = cancelOrderParamsSchema.parse(request.params);

  const order = await adminCancelOrderService.execute(params);

  return reply.status(200).send({
    success: true,
    data: order,
  });
}
