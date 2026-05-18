import type { FastifyReply, FastifyRequest } from 'fastify';

import { listAdminUsersQuerySchema } from '../dtos/list-admin-users.dto';
import { listAdminUsersService } from '../services/list-admin-users.service';

export async function listAdminUsersController(
  request: FastifyRequest,
  reply: FastifyReply,
): Promise<FastifyReply> {
  const query = listAdminUsersQuerySchema.parse(request.query);

  const { users, meta } = await listAdminUsersService.execute(query);

  return reply.status(200).send({
    success: true,
    data: users,
    meta,
  });
}
