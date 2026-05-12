import type { FastifyReply, FastifyRequest } from 'fastify';

import { listProductsSchema } from '../dtos/list-products.dto';
import { listProductsService } from '../services/list-products.service';

export async function listProductsController(
  request: FastifyRequest,
  reply: FastifyReply,
): Promise<FastifyReply> {
  const filters = listProductsSchema.parse(request.query);

  const { products, meta } =
    await listProductsService.execute(filters);

  return reply.status(200).send({
    success: true,
    data: products,
    meta,
  });
}
