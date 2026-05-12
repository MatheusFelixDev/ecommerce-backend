import type { FastifyReply, FastifyRequest } from 'fastify';

import { restoreProductParamsSchema } from '../dtos/restore-product.dto';
import { restoreProductService } from '../services/restore-product.service';

export async function restoreProductController(
  request: FastifyRequest,
  reply: FastifyReply,
): Promise<FastifyReply> {
  const params = restoreProductParamsSchema.parse(
    request.params,
  );

  const product = await restoreProductService.execute(params);

  return reply.status(200).send({
    success: true,
    data: product,
  });
}
