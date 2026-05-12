import type { FastifyInstance } from 'fastify';

import { authenticate } from '../../core/middlewares/authenticate';
import { confirmEmailChangeController } from './controllers/confirm-email-change.controller';
import { getUserProfileController } from './controllers/get-user-profile.controller';
import { requestEmailChangeController } from './controllers/request-email-change.controller';
import { updateUserPasswordController } from './controllers/update-user-password.controller';
import { updateUserProfileController } from './controllers/update-user-profile.controller';

export async function usersRoutes(
  app: FastifyInstance,
): Promise<void> {
  app.get(
    '/profile',
    {
      preHandler: [authenticate],
    },
    getUserProfileController,
  );

  app.patch(
    '/profile',
    {
      preHandler: [authenticate],
    },
    updateUserProfileController,
  );

  app.patch(
    '/profile/password',
    {
      preHandler: [authenticate],
    },
    updateUserPasswordController,
  );

  app.post(
    '/profile/email/request',
    {
      preHandler: [authenticate],
    },
    requestEmailChangeController,
  );

  app.post(
    '/profile/email/confirm',
    {
      preHandler: [authenticate],
    },
    confirmEmailChangeController,
  );
}
