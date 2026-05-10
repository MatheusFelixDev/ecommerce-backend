import type { FastifyReply, FastifyRequest } from 'fastify';

import { createCategorySchema } from '../dtos/create-category.dto';
import { createCategoryService } from '../services/create-category.service';

export async function createCategoryController(
  request: FastifyRequest,
  reply: FastifyReply,
): Promise<void> {
  const body = createCategorySchema.parse(
    request.body,
  );

  const category = await createCategoryService.execute(
    body,
  );

  reply.status(201).send({
    success: true,
    data: {
      category,
    },
  });
}
