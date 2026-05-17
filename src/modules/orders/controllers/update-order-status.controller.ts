import type { FastifyReply, FastifyRequest } from 'fastify';

import {
  updateOrderStatusBodySchema,
  updateOrderStatusParamsSchema,
} from '../dtos/update-order-status.dto';
import { updateOrderStatusService } from '../services/update-order-status.service';

export async function updateOrderStatusController(
  request: FastifyRequest,
  reply: FastifyReply,
): Promise<FastifyReply> {
  const params = updateOrderStatusParamsSchema.parse(request.params);
  const body = updateOrderStatusBodySchema.parse(request.body);

  const order = await updateOrderStatusService.execute({
    id: params.id,
    status: body.status,
    trackingCode: body.trackingCode,
    trackingUrl: body.trackingUrl,
  });

  return reply.status(200).send({
    success: true,
    data: order,
  });
}
