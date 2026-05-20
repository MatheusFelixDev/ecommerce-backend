import type { FastifyInstance, RouteOptions } from 'fastify';

import { UserRole } from '../../generated/prisma/client';
import { authenticate } from '../../core/middlewares/authenticate';
import { authorize } from '../../core/middlewares/authorize';
import { adminCheckController } from './controllers/admin-check.controller';
import { forgotPasswordController } from './controllers/forgot-password.controller';
import { getAuthenticatedUserController } from './controllers/get-authenticated-user.controller';
import { loginUserController } from './controllers/login-user.controller';
import { logoutUserController } from './controllers/logout-user.controller';
import { refreshTokenController } from './controllers/refresh-token.controller';
import { registerUserController } from './controllers/register-user.controller';
import { resetPasswordController } from './controllers/reset-password.controller';

type RouteRateLimitConfig = NonNullable<RouteOptions['config']>['rateLimit'];

const strictAuthRateLimit: RouteRateLimitConfig = {
  max: 10,
  timeWindow: '1 minute',
};

const tokenAuthRateLimit: RouteRateLimitConfig = {
  max: 30,
  timeWindow: '1 minute',
};

export async function authRoutes(app: FastifyInstance): Promise<void> {
  app.post(
    '/register',
    {
      config: {
        rateLimit: strictAuthRateLimit,
      },
    },
    registerUserController,
  );

  app.post(
    '/login',
    {
      config: {
        rateLimit: strictAuthRateLimit,
      },
    },
    loginUserController,
  );

  app.post(
    '/refresh',
    {
      config: {
        rateLimit: tokenAuthRateLimit,
      },
    },
    refreshTokenController,
  );

  app.post(
    '/logout',
    {
      config: {
        rateLimit: tokenAuthRateLimit,
      },
    },
    logoutUserController,
  );

  app.post(
    '/forgot-password',
    {
      config: {
        rateLimit: strictAuthRateLimit,
      },
    },
    forgotPasswordController,
  );

  app.post(
    '/reset-password',
    {
      config: {
        rateLimit: strictAuthRateLimit,
      },
    },
    resetPasswordController,
  );

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
