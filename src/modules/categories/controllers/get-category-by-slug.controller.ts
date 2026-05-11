import type { FastifyReply, FastifyRequest } from 'fastify';
import { z } from 'zod';

import { getCategoryBySlugService } from '../services/get-category-by-slug.service';

const getCategoryBySlugParamsSchema = z.object({
  slug: z.string().trim().min(1),
});

export async function getCategoryBySlugController(
  request: FastifyRequest,
  reply: FastifyReply,
): Promise<void> {
  const { slug } = getCategoryBySlugParamsSchema.parse(
    request.params,
  );

  const category = await getCategoryBySlugService.execute(
    slug,
  );

  reply.status(200).send({
    success: true,
    data: {
      category,
    },
  });
}
