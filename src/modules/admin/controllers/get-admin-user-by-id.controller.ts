import type { FastifyReply, FastifyRequest } from 'fastify';

import { getAdminUserByIdParamsSchema } from '../dtos/get-admin-user-by-id.dto';
import { getAdminUserByIdService } from '../services/get-admin-user-by-id.service';

export async function getAdminUserByIdController(
  request: FastifyRequest,
  reply: FastifyReply,
): Promise<FastifyReply> {
  const params = getAdminUserByIdParamsSchema.parse(request.params);

  const user = await getAdminUserByIdService.execute(params);

  return reply.status(200).send({
    success: true,
    data: user,
  });
}
