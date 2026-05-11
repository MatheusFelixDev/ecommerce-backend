import type { FastifyReply, FastifyRequest } from 'fastify';

import { updateUserPasswordSchema } from '../dtos/update-user-password.dto';
import { updateUserPasswordService } from '../services/update-user-password.service';

export async function updateUserPasswordController(
  request: FastifyRequest,
  reply: FastifyReply,
): Promise<void> {
  const body = updateUserPasswordSchema.parse(request.body);

  await updateUserPasswordService.execute(
    request.user.sub,
    body,
  );

  reply.status(204).send();
}
