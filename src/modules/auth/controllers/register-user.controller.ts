import type { FastifyReply, FastifyRequest } from 'fastify';

import { registerUserService } from '../services/register-user.service';
import { registerUserSchema } from '../validations/register-user.schema';

export async function registerUserController(
  request: FastifyRequest,
  reply: FastifyReply,
): Promise<void> {
  const data = registerUserSchema.parse(request.body);

  const user = await registerUserService.execute(data);

  reply.status(201).send({
    success: true,
    data: {
      user,
    },
  });
}
