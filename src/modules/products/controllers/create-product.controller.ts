import type { FastifyReply, FastifyRequest } from 'fastify';

import { createProductSchema } from '../dtos/create-product.dto';
import { createProductService } from '../services/create-product.service';

export async function createProductController(
  request: FastifyRequest,
  reply: FastifyReply,
): Promise<FastifyReply> {
  const data = createProductSchema.parse(request.body);

  const product = await createProductService.execute(data);

  return reply.status(201).send({
    success: true,
    data: product,
  });
}
