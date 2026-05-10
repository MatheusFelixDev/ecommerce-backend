import '@fastify/jwt';

import type { UserRole } from '../generated/prisma/client';

declare module '@fastify/jwt' {
  interface FastifyJWT {
    payload: {
      role: UserRole;
    };
    user: {
      sub: string;
      role: UserRole;
      iat: number;
      exp: number;
    };
  }
}
