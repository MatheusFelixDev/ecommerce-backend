import type { FastifyInstance } from 'fastify';

import { authenticate } from '../../core/middlewares/authenticate';

import { addCartItemController } from './controllers/add-cart-item.controller';
import { clearCartController } from './controllers/clear-cart.controller';
import { listCartController } from './controllers/list-cart.controller';
import { removeCartItemController } from './controllers/remove-cart-item.controller';
import { updateCartItemQuantityController } from './controllers/update-cart-item-quantity.controller';

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

  app.post(
    '/',
    {
      preHandler: [authenticate],
    },
    addCartItemController,
  );

  app.patch(
    '/:id',
    {
      preHandler: [authenticate],
    },
    updateCartItemQuantityController,
  );

  app.delete(
    '/',
    {
      preHandler: [authenticate],
    },
    clearCartController,
  );

  app.delete(
    '/:id',
    {
      preHandler: [authenticate],
    },
    removeCartItemController,
  );
}
