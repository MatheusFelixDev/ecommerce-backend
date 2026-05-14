import type { FastifyInstance } from 'fastify';

import { authenticate } from '../../core/middlewares/authenticate';

import { createOrderController } from './controllers/create-order.controller';
import { getOrderByIdController } from './controllers/get-order-by-id.controller';
import { listOrdersController } from './controllers/list-orders.controller';

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
}
