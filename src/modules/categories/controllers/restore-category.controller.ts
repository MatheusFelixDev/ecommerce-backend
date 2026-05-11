import type { FastifyReply, FastifyRequest } from 'fastify';
import { z } from 'zod';

import { restoreCategoryService } from '../services/restore-category.service';

const restoreCategoryParamsSchema = z.object({
  id: z.string().uuid(),
});

export async function restoreCategoryController(
  request: FastifyRequest,
  reply: FastifyReply,
): Promise<void> {
  const { id } = restoreCategoryParamsSchema.parse(
    request.params,
  );

  const category = await restoreCategoryService.execute(id);

  reply.status(200).send({
    success: true,
    data: {
      category,
    },
  });
}
