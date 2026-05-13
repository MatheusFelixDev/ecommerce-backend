import type { FastifyInstance } from 'fastify';

import { authenticate } from '../../core/middlewares/authenticate';

import { listCartController } from './controllers/list-cart.controller';

export async function cartRoutes(
  app: FastifyInstance,
): Promise<void> {
  app.get(
    '/',
    {
      preHandler: [authenticate],
    },
    listCartController,
  );
}
