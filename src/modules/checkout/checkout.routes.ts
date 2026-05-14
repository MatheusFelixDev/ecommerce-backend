import type { FastifyInstance } from 'fastify';

import { authenticate } from '../../core/middlewares/authenticate';

import { calculateShippingController } from './controllers/calculate-shipping.controller';

export async function checkoutRoutes(
  app: FastifyInstance,
): Promise<void> {
  app.post(
    '/shipping',
    {
      preHandler: [authenticate],
    },
    calculateShippingController,
  );
}
