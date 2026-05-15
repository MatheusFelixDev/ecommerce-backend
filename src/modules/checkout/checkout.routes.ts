import type { FastifyInstance } from 'fastify';

import { authenticate } from '../../core/middlewares/authenticate';

import { calculateShippingController } from './controllers/calculate-shipping.controller';
import { reviewCheckoutController } from './controllers/review-checkout.controller';

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

  app.post(
    '/review',
    {
      preHandler: [authenticate],
    },
    reviewCheckoutController,
  );
}
