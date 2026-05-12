import type { FastifyReply, FastifyRequest } from 'fastify';

import { confirmEmailChangeSchema } from '../dtos/confirm-email-change.dto';
import { mapUserProfile } from '../mappers/user-profile.mapper';
import { confirmEmailChangeService } from '../services/confirm-email-change.service';

export async function confirmEmailChangeController(
  request: FastifyRequest,
  reply: FastifyReply,
): Promise<void> {
  const body = confirmEmailChangeSchema.parse(request.body);

  const user = await confirmEmailChangeService.execute(
    request.user.sub,
    body,
  );

  reply.status(200).send({
    success: true,
    data: {
      user: mapUserProfile(user),
    },
  });
}
