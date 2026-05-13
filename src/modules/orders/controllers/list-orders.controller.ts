import type { FastifyReply, FastifyRequest } from 'fastify';

import { listOrdersQuerySchema } from '../dtos/list-orders.dto';
import { listOrdersService } from '../services/list-orders.service';

export async function listOrdersController(
  request: FastifyRequest,
  reply: FastifyReply,
): Promise<FastifyReply> {
  const query = listOrdersQuerySchema.parse(request.query);

  const result = await listOrdersService.execute({
    userId: request.user.sub,
    page: query.page,
    perPage: query.perPage,
    status: query.status,
  });

  return reply.status(200).send({
    success: true,
    data: result.orders,
    meta: result.meta,
  });
}
