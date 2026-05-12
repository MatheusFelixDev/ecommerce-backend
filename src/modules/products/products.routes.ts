import type { FastifyInstance } from 'fastify';

import { authenticate } from '../../core/middlewares/authenticate';
import { authorize } from '../../core/middlewares/authorize';

import { createProductController } from './controllers/create-product.controller';
import { deleteProductController } from './controllers/delete-product.controller';
import { getProductBySlugController } from './controllers/get-product-by-slug.controller';
import { listProductsController } from './controllers/list-products.controller';
import { restoreProductController } from './controllers/restore-product.controller';
import { updateProductController } from './controllers/update-product.controller';

export async function productsRoutes(
  app: FastifyInstance,
): Promise<void> {
  app.get('/', listProductsController);

  app.get('/:slug', getProductBySlugController);

  app.delete(
    '/:id',
    {
      preHandler: [
        authenticate,
        authorize(['ADMIN']),
      ],
    },
    deleteProductController,
  );

  app.patch(
    '/:id/restore',
    {
      preHandler: [
        authenticate,
        authorize(['ADMIN']),
      ],
    },
    restoreProductController,
  );

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
