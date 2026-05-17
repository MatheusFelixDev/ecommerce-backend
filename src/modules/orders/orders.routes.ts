import type { FastifyInstance } from 'fastify';

import { authenticate } from '../../core/middlewares/authenticate';
import { authorize } from '../../core/middlewares/authorize';

import { cancelOrderController } from './controllers/cancel-order.controller';
import { createOrderController } from './controllers/create-order.controller';
import { getOrderByIdController } from './controllers/get-order-by-id.controller';
import { listOrdersController } from './controllers/list-orders.controller';
import { updateOrderStatusController } from './controllers/update-order-status.controller';

export async function ordersRoutes(
  app: FastifyInstance,
): Promise<void> {
  app.post(
    '/',
    {
      preHandler: [authenticate],
    },
    createOrderController,
  );

  app.get(
    '/',
    {
      preHandler: [authenticate],
    },
    listOrdersController,
  );

  app.get(
    '/:id',
    {
      preHandler: [authenticate],
    },
    getOrderByIdController,
  );

  app.patch(
    '/:id/status',
    {
      preHandler: [
        authenticate,
        authorize(['ADMIN']),
      ],
    },
    updateOrderStatusController,
  );

  app.patch(
    '/:id/cancel',
    {
      preHandler: [authenticate],
    },
    cancelOrderController,
  );
}
