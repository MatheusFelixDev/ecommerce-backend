import type { FastifyReply, FastifyRequest } from 'fastify';

import { logoutUserService } from '../services/logout-user.service';
import { logoutUserSchema } from '../validations/logout-user.schema';

export async function logoutUserController(
  request: FastifyRequest,
  reply: FastifyReply,
): Promise<void> {
  const data = logoutUserSchema.parse(request.body);

  await logoutUserService.execute(data);

  reply.status(200).send({
    success: true,
    data: {
      message: 'Logout completed successfully.',
    },
  });
}
