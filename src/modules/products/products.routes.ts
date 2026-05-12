import type { FastifyInstance } from 'fastify';

import { authenticate } from '../../core/middlewares/authenticate';
import { authorize } from '../../core/middlewares/authorize';

import { createProductController } from './controllers/create-product.controller';
import { getProductBySlugController } from './controllers/get-product-by-slug.controller';
import { listProductsController } from './controllers/list-products.controller';
import { updateProductController } from './controllers/update-product.controller';

export async function productsRoutes(
  app: FastifyInstance,
): Promise<void> {
  app.get('/', listProductsController);

  app.get('/:slug', getProductBySlugController);

  app.patch(
    '/:id',
    {
      preHandler: [
        authenticate,
        authorize(['ADMIN']),
      ],
    },
    updateProductController,
  );

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
