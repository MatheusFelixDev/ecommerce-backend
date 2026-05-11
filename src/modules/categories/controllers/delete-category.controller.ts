import type { FastifyReply, FastifyRequest } from 'fastify';
import { z } from 'zod';

import { deleteCategoryService } from '../services/delete-category.service';

const deleteCategoryParamsSchema = z.object({
  id: z.string().uuid(),
});

export async function deleteCategoryController(
  request: FastifyRequest,
  reply: FastifyReply,
): Promise<void> {
  const { id } = deleteCategoryParamsSchema.parse(
    request.params,
  );

  await deleteCategoryService.execute(id);

  reply.status(204).send();
}
