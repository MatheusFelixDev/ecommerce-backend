import type { FastifyReply, FastifyRequest } from 'fastify';

import { updateUserProfileSchema } from '../dtos/update-user-profile.dto';
import { updateUserProfileService } from '../services/update-user-profile.service';

export async function updateUserProfileController(
  request: FastifyRequest,
  reply: FastifyReply,
): Promise<void> {
  const body = updateUserProfileSchema.parse(request.body);

  const user = await updateUserProfileService.execute(
    request.user.sub,
    body,
  );

  reply.status(200).send({
    success: true,
    data: {
      user,
    },
  });
}
