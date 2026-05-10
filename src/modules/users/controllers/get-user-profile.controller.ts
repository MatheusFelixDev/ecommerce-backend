import type { FastifyReply, FastifyRequest } from 'fastify';

import { getUserProfileService } from '../services/get-user-profile.service';

export async function getUserProfileController(
  request: FastifyRequest,
  reply: FastifyReply,
): Promise<void> {
  const user = await getUserProfileService.execute(
    request.user.sub,
  );

  reply.status(200).send({
    success: true,
    data: {
      user,
    },
  });
}
