import type { FastifyReply, FastifyRequest } from 'fastify';

import {
  updateAdminUserStatusBodySchema,
  updateAdminUserStatusParamsSchema,
} from '../dtos/update-admin-user-status.dto';
import { updateAdminUserStatusService } from '../services/update-admin-user-status.service';

export async function updateAdminUserStatusController(
  request: FastifyRequest,
  reply: FastifyReply,
): Promise<FastifyReply> {
  const params = updateAdminUserStatusParamsSchema.parse(request.params);
  const body = updateAdminUserStatusBodySchema.parse(request.body);

  const user = await updateAdminUserStatusService.execute({
    id: params.id,
    adminUserId: request.user.sub,
    isActive: body.isActive,
  });

  return reply.status(200).send({
    success: true,
    data: user,
  });
}
