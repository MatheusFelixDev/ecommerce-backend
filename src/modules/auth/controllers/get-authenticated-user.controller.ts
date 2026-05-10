import type { FastifyReply, FastifyRequest } from 'fastify';

import { getAuthenticatedUserService } from '../services/get-authenticated-user.service';

export async function getAuthenticatedUserController(
  request: FastifyRequest,
  reply: FastifyReply,
): Promise<void> {
  const user = await getAuthenticatedUserService.execute(request.user.sub);

  reply.status(200).send({
    success: true,
    data: {
      user,
    },
  });
}
