import type { FastifyInstance } from 'fastify';

import { authenticate } from '../../core/middlewares/authenticate';
import { authorize } from '../../core/middlewares/authorize';

import { createStockAdjustmentController } from './controllers/create-stock-adjustment.controller';

export async function adminRoutes(
  app: FastifyInstance,
): Promise<void> {
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
}
