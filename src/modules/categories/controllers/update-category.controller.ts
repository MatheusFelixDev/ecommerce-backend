import type { FastifyReply, FastifyRequest } from 'fastify';
import { z } from 'zod';

import { updateCategorySchema } from '../dtos/update-category.dto';
import { updateCategoryService } from '../services/update-category.service';

const updateCategoryParamsSchema = z.object({
  id: z.string().uuid(),
});

export async function updateCategoryController(
  request: FastifyRequest,
  reply: FastifyReply,
): Promise<void> {
  const { id } = updateCategoryParamsSchema.parse(
    request.params,
  );

  const body = updateCategorySchema.parse(request.body);

  const category = await updateCategoryService.execute(
    id,
    body,
  );

  reply.status(200).send({
    success: true,
    data: {
      category,
    },
  });
}
