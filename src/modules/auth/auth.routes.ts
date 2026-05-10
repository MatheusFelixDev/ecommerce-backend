import type { FastifyInstance } from 'fastify';

import { UserRole } from '../../generated/prisma/client';
import { authenticate } from '../../core/middlewares/authenticate';
import { authorize } from '../../core/middlewares/authorize';
import { adminCheckController } from './controllers/admin-check.controller';
import { getAuthenticatedUserController } from './controllers/get-authenticated-user.controller';
import { loginUserController } from './controllers/login-user.controller';
import { logoutUserController } from './controllers/logout-user.controller';
import { refreshTokenController } from './controllers/refresh-token.controller';
import { registerUserController } from './controllers/register-user.controller';

export async function authRoutes(app: FastifyInstance): Promise<void> {
  app.post('/register', registerUserController);
  app.post('/login', loginUserController);
  app.post('/refresh', refreshTokenController);
  app.post('/logout', logoutUserController);

  app.get(
    '/me',
    {
      preHandler: [authenticate],
    },
    getAuthenticatedUserController,
  );

  app.get(
    '/admin-check',
    {
      preHandler: [authenticate, authorize([UserRole.ADMIN])],
    },
    adminCheckController,
  );
}
