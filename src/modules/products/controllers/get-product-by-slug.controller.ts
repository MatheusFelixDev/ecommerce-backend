import type { FastifyReply, FastifyRequest } from 'fastify';

import { getProductBySlugParamsSchema } from '../dtos/get-product-by-slug.dto';
import { getProductBySlugService } from '../services/get-product-by-slug.service';

export async function getProductBySlugController(
  request: FastifyRequest,
  reply: FastifyReply,
): Promise<FastifyReply> {
  const params = getProductBySlugParamsSchema.parse(
    request.params,
  );

  const product = await getProductBySlugService.execute(params);

  return reply.status(200).send({
    success: true,
    data: product,
  });
}
