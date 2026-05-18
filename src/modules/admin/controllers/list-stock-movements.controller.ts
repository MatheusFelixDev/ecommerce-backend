import type { FastifyReply, FastifyRequest } from 'fastify';

import {
  listStockMovementsParamsSchema,
  listStockMovementsQuerySchema,
} from '../dtos/list-stock-movements.dto';
import { listStockMovementsService } from '../services/list-stock-movements.service';

export async function listStockMovementsController(
  request: FastifyRequest,
  reply: FastifyReply,
): Promise<FastifyReply> {
  const params = listStockMovementsParamsSchema.parse(request.params);
  const query = listStockMovementsQuerySchema.parse(request.query);

  const { movements, meta } =
    await listStockMovementsService.execute({
      id: params.id,
      page: query.page,
      perPage: query.perPage,
    });

  return reply.status(200).send({
    success: true,
    data: movements,
    meta,
  });
}
