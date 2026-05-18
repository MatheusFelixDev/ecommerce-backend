import type { FastifyInstance } from 'fastify';

import { authenticate } from '../../core/middlewares/authenticate';
import { authorize } from '../../core/middlewares/authorize';

import { createStockAdjustmentController } from './controllers/create-stock-adjustment.controller';
import { getAdminUserByIdController } from './controllers/get-admin-user-by-id.controller';
import { listAdminUsersController } from './controllers/list-admin-users.controller';
import { listStockMovementsController } from './controllers/list-stock-movements.controller';

export async function adminRoutes(
  app: FastifyInstance,
): Promise<void> {
  app.get(
    '/users',
    {
      preHandler: [
        authenticate,
        authorize(['ADMIN']),
      ],
    },
    listAdminUsersController,
  );

  app.get(
    '/users/:id',
    {
      preHandler: [
        authenticate,
        authorize(['ADMIN']),
      ],
    },
    getAdminUserByIdController,
  );

  app.post(
    '/products/:id/stock-adjustments',
    {
      preHandler: [
        authenticate,
        authorize(['ADMIN']),
      ],
    },
    createStockAdjustmentController,
  );

  app.get(
    '/products/:id/stock-movements',
    {
      preHandler: [
        authenticate,
        authorize(['ADMIN']),
      ],
    },
    listStockMovementsController,
  );
}
