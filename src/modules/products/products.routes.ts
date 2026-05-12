import type { FastifyInstance } from 'fastify';

import { authenticate } from '../../core/middlewares/authenticate';
import { authorize } from '../../core/middlewares/authorize';

import { createProductController } from './controllers/create-product.controller';
import { listProductsController } from './controllers/list-products.controller';

export async function productsRoutes(
  app: FastifyInstance,
): Promise<void> {
  app.get('/', listProductsController);

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
