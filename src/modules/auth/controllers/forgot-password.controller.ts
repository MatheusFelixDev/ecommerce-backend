import type { FastifyReply, FastifyRequest } from 'fastify';

import { forgotPasswordSchema } from '../dtos/forgot-password.dto';
import { forgotPasswordService } from '../services/forgot-password.service';

export async function forgotPasswordController(
  request: FastifyRequest,
  reply: FastifyReply,
): Promise<void> {
  const body = forgotPasswordSchema.parse(request.body);

  await forgotPasswordService.execute(body);

  reply.status(200).send({
    success: true,
    data: {
      message:
        'If the e-mail is registered, password reset instructions will be sent.',
    },
  });
}
