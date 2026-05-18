import type { FastifyInstance } from 'fastify';

import { authenticate } from '../../core/middlewares/authenticate';
import { authorize } from '../../core/middlewares/authorize';

import { createStockAdjustmentController } from './controllers/create-stock-adjustment.controller';
import { getAdminUserByIdController } from './controllers/get-admin-user-by-id.controller';
import { getSalesReportController } from './controllers/get-sales-report.controller';
import { getTopProductsReportController } from './controllers/get-top-products-report.controller';
import { listAdminUsersController } from './controllers/list-admin-users.controller';
import { listStockMovementsController } from './controllers/list-stock-movements.controller';
import { updateAdminUserRoleController } from './controllers/update-admin-user-role.controller';
import { updateAdminUserStatusController } from './controllers/update-admin-user-status.controller';

export async function adminRoutes(
  app: FastifyInstance,
): Promise<void> {
  app.get(
    '/reports/sales',
    {
      preHandler: [
        authenticate,
        authorize(['ADMIN']),
      ],
    },
    getSalesReportController,
  );

  app.get(
    '/reports/top-products',
    {
      preHandler: [
        authenticate,
        authorize(['ADMIN']),
      ],
    },
    getTopProductsReportController,
  );

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

  app.patch(
    '/users/:id/status',
    {
      preHandler: [
        authenticate,
        authorize(['ADMIN']),
      ],
    },
    updateAdminUserStatusController,
  );

  app.patch(
    '/users/:id/role',
    {
      preHandler: [
        authenticate,
        authorize(['ADMIN']),
      ],
    },
    updateAdminUserRoleController,
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
