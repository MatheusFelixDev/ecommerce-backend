import type { FastifyInstance } from 'fastify';

import { authenticate } from '../../core/middlewares/authenticate';
import { authorize } from '../../core/middlewares/authorize';

import { createCategoryController } from './controllers/create-category.controller';
import { deleteCategoryController } from './controllers/delete-category.controller';
import { getCategoryBySlugController } from './controllers/get-category-by-slug.controller';
import { listCategoriesController } from './controllers/list-categories.controller';
import { updateCategoryController } from './controllers/update-category.controller';

export async function categoriesRoutes(
  app: FastifyInstance,
): Promise<void> {
  app.get('/', listCategoriesController);

  app.get('/:slug', getCategoryBySlugController);

  app.post(
    '/',
    {
      preHandler: [
        authenticate,
        authorize(['ADMIN']),
      ],
    },
    createCategoryController,
  );

  app.patch(
    '/:id',
    {
      preHandler: [
        authenticate,
        authorize(['ADMIN']),
      ],
    },
    updateCategoryController,
  );

  app.delete(
    '/:id',
    {
      preHandler: [
        authenticate,
        authorize(['ADMIN']),
      ],
    },
    deleteCategoryController,
  );
}
