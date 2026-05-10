import type { FastifyInstance } from 'fastify';

import { authenticate } from '../../core/middlewares/authenticate';
import { getUserProfileController } from './controllers/get-user-profile.controller';
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
}
