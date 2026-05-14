import type { FastifyInstance } from 'fastify';

import { addressesRoutes } from './addresses/addresses.routes';
import { adminRoutes } from './admin/admin.routes';
import { authRoutes } from './auth/auth.routes';
import { cartRoutes } from './cart/cart.routes';
import { categoriesRoutes } from './categories/categories.routes';
import { checkoutRoutes } from './checkout/checkout.routes';
import { healthRoutes } from './health/health.routes';
import { ordersRoutes } from './orders/orders.routes';
import { paymentsRoutes } from './payments/payments.routes';
import { productsRoutes } from './products/products.routes';
import { usersRoutes } from './users/users.routes';

export async function registerRoutes(app: FastifyInstance): Promise<void> {
  await app.register(healthRoutes, {
    prefix: '/health',
  });

  await app.register(authRoutes, {
    prefix: '/auth',
  });

  await app.register(usersRoutes, {
    prefix: '/users',
  });

  await app.register(addressesRoutes, {
    prefix: '/addresses',
  });

  await app.register(categoriesRoutes, {
    prefix: '/categories',
  });

  await app.register(productsRoutes, {
    prefix: '/products',
  });

  await app.register(cartRoutes, {
    prefix: '/cart',
  });

  await app.register(checkoutRoutes, {
    prefix: '/checkout',
  });

  await app.register(ordersRoutes, {
    prefix: '/orders',
  });

  await app.register(paymentsRoutes, {
    prefix: '/payments',
  });

  await app.register(adminRoutes, {
    prefix: '/admin',
  });
}
