import type { FastifyReply, FastifyRequest } from 'fastify';

import { resetPasswordSchema } from '../dtos/reset-password.dto';
import { resetPasswordService } from '../services/reset-password.service';

export async function resetPasswordController(
  request: FastifyRequest,
  reply: FastifyReply,
): Promise<void> {
  const body = resetPasswordSchema.parse(request.body);

  await resetPasswordService.execute(body);

  reply.status(204).send();
}
