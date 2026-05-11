import type { FastifyReply, FastifyRequest } from 'fastify';

import { listCategoriesService } from '../services/list-categories.service';

export async function listCategoriesController(
  _request: FastifyRequest,
  reply: FastifyReply,
): Promise<void> {
  const categories = await listCategoriesService.execute();

  reply.status(200).send({
    success: true,
    data: {
      categories,
    },
  });
}
