import type { FastifyReply, FastifyRequest } from 'fastify';

import { requestEmailChangeSchema } from '../dtos/request-email-change.dto';
import { requestEmailChangeService } from '../services/request-email-change.service';

export async function requestEmailChangeController(
  request: FastifyRequest,
  reply: FastifyReply,
): Promise<void> {
  const body = requestEmailChangeSchema.parse(request.body);

  const result = await requestEmailChangeService.execute(
    request.user.sub,
    body,
  );

  reply.status(200).send({
    success: true,
    data: {
      message:
        'E-mail change confirmation instructions will be sent.',
      emailChangeToken: result.emailChangeToken,
    },
  });
}
