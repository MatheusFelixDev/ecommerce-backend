import type { FastifyReply, FastifyRequest } from 'fastify';

import { deleteProductParamsSchema } from '../dtos/delete-product.dto';
import { deleteProductService } from '../services/delete-product.service';

export async function deleteProductController(
  request: FastifyRequest,
  reply: FastifyReply,
): Promise<FastifyReply> {
  const params = deleteProductParamsSchema.parse(
    request.params,
  );

  const product = await deleteProductService.execute(params);

  return reply.status(200).send({
    success: true,
    data: product,
  });
}
