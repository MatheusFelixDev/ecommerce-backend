import type { FastifyReply, FastifyRequest } from 'fastify';

import {
  updateAdminUserRoleBodySchema,
  updateAdminUserRoleParamsSchema,
} from '../dtos/update-admin-user-role.dto';
import { updateAdminUserRoleService } from '../services/update-admin-user-role.service';

export async function updateAdminUserRoleController(
  request: FastifyRequest,
  reply: FastifyReply,
): Promise<FastifyReply> {
  const params = updateAdminUserRoleParamsSchema.parse(request.params);
  const body = updateAdminUserRoleBodySchema.parse(request.body);

  const user = await updateAdminUserRoleService.execute({
    id: params.id,
    adminUserId: request.user.sub,
    role: body.role,
  });

  return reply.status(200).send({
    success: true,
    data: user,
  });
}
