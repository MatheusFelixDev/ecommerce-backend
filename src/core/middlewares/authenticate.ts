import type { FastifyReply, FastifyRequest } from 'fastify';

import { AppError } from '../errors/app-error';

export async function authenticate(
  request: FastifyRequest,
  _reply: FastifyReply,
): Promise<void> {
  try {
    await request.jwtVerify();
  } catch {
    throw new AppError('Authentication required.', 401, 'AUTHENTICATION_REQUIRED');
  }
}
