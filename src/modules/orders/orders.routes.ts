import type { FastifyInstance } from 'fastify';

import { authenticate } from '../../core/middlewares/authenticate';

import { createOrderController } from './controllers/create-order.controller';

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
}
