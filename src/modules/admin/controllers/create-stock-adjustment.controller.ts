import type { FastifyReply, FastifyRequest } from 'fastify';

import {
  createStockAdjustmentBodySchema,
  createStockAdjustmentParamsSchema,
} from '../dtos/create-stock-adjustment.dto';
import { createStockAdjustmentService } from '../services/create-stock-adjustment.service';

export async function createStockAdjustmentController(
  request: FastifyRequest,
  reply: FastifyReply,
): Promise<FastifyReply> {
  const params = createStockAdjustmentParamsSchema.parse(request.params);
  const body = createStockAdjustmentBodySchema.parse(request.body);

  const movement = await createStockAdjustmentService.execute({
    id: params.id,
    adminUserId: request.user.sub,
    quantityChange: body.quantityChange,
    reason: body.reason,
  });

  return reply.status(201).send({
    success: true,
    data: movement,
  });
}
