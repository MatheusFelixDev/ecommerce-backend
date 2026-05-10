import type { FastifyReply, FastifyRequest } from 'fastify';

import { env } from '../../../config/env';
import { refreshTokenService } from '../services/refresh-token.service';
import { refreshTokenSchema } from '../validations/refresh-token.schema';

export async function refreshTokenController(
  request: FastifyRequest,
  reply: FastifyReply,
): Promise<void> {
  const data = refreshTokenSchema.parse(request.body);

  const result = await refreshTokenService.execute(data);

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
