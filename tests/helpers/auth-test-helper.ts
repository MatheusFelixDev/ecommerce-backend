import { randomUUID } from 'node:crypto';

import type { FastifyInstance } from 'fastify';

import { UserRole } from '../../src/generated/prisma/client';

type BuildAccessTokenOptions = {
  userId?: string;
  role?: UserRole;
};

export function buildAccessToken(
  app: FastifyInstance,
  options: BuildAccessTokenOptions = {},
): string {
  const userId = options.userId ?? randomUUID();
  const role = options.role ?? UserRole.CUSTOMER;

  return app.jwt.sign(
    {
      role,
    },
    {
      sub: userId,
      expiresIn: '1d',
    },
  );
}

export function buildAuthorizationHeader(
  app: FastifyInstance,
  options: BuildAccessTokenOptions = {},
): string {
  const accessToken = buildAccessToken(app, options);

  return `Bearer ${accessToken}`;
}
