import type { FastifyReply, FastifyRequest } from 'fastify';

import {
  updateProductBodySchema,
  updateProductParamsSchema,
} from '../dtos/update-product.dto';
import { updateProductService } from '../services/update-product.service';

export async function updateProductController(
  request: FastifyRequest,
  reply: FastifyReply,
): Promise<FastifyReply> {
  const params = updateProductParamsSchema.parse(
    request.params,
  );

  const data = updateProductBodySchema.parse(request.body);

  const product = await updateProductService.execute(
    params,
    data,
  );

  return reply.status(200).send({
    success: true,
    data: product,
  });
}
