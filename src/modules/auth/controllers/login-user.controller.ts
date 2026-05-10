import type { FastifyReply, FastifyRequest } from 'fastify';

import { env } from '../../../config/env';
import { loginUserService } from '../services/login-user.service';
import { loginUserSchema } from '../validations/login-user.schema';

export async function loginUserController(
  request: FastifyRequest,
  reply: FastifyReply,
): Promise<void> {
  const data = loginUserSchema.parse(request.body);

  const result = await loginUserService.execute(data);

  const accessToken = request.server.jwt.sign(
    {
      role: result.user.role,
    },
    {
      sub: result.user.id,
      expiresIn: env.jwtExpiresIn,
    },
  );

  reply.status(200).send({
    success: true,
    data: {
      user: result.user,
      tokens: {
        accessToken,
        refreshToken: result.refreshToken,
      },
    },
  });
}
