import type { FastifyInstance } from 'fastify';

import { authenticate } from '../../core/middlewares/authenticate';

import { createOrderController } from './controllers/create-order.controller';
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
}
