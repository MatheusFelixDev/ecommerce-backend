import type { FastifyReply, FastifyRequest } from 'fastify';

import type { UserRole } from '../../generated/prisma/client';
import { AppError } from '../errors/app-error';

export function authorize(allowedRoles: UserRole[]) {
  return async function authorizationMiddleware(
    request: FastifyRequest,
    _reply: FastifyReply,
  ): Promise<void> {
    const userRole = request.user.role;

    if (!allowedRoles.includes(userRole)) {
      throw new AppError('Forbidden access.', 403, 'FORBIDDEN_ACCESS');
    }
  };
}
