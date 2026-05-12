import type { FastifyInstance } from 'fastify';

import { authenticate } from '../../core/middlewares/authenticate';
import { authorize } from '../../core/middlewares/authorize';

import { createProductController } from './controllers/create-product.controller';

export async function productsRoutes(
  app: FastifyInstance,
): Promise<void> {
  app.post(
    '/',
    {
      preHandler: [
        authenticate,
        authorize(['ADMIN']),
      ],
    },
    createProductController,
  );
}
