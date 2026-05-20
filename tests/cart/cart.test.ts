import type { FastifyInstance } from 'fastify';
import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest';

import { UserRole } from '../../src/generated/prisma/client';
import { prisma } from '../../src/infra/prisma/client';
import { buildAuthorizationHeader } from '../helpers/auth-test-helper';
import { buildTestApp } from '../helpers/build-test-app';
import {
  clearDatabase,
  disconnectDatabase,
} from '../helpers/database-test-helper';

type TestCategory = {
  id: string;
};

type TestUser = {
  id: string;
};

type TestProduct = {
  id: string;
};

type CartResponse = {
  items: Array<{
    id: string;
    productId: string;
    quantity: number;
    unitPriceInCents: number;
    unitDiscountInCents: number;
    subtotalInCents: number;
    discountInCents: number;
    totalInCents: number;
  }>;
  summary: {
    itemsCount: number;
    totalQuantity: number;
    subtotalInCents: number;
    discountInCents: number;
    totalInCents: number;
  };
};

describe('Cart routes', () => {
  let app: FastifyInstance;

  beforeAll(async () => {
    app = await buildTestApp();
  });

  beforeEach(async () => {
    await clearDatabase();
  });

  afterAll(async () => {
    await app.close();
    await disconnectDatabase();
  });

  async function createUser(
    email = 'cart.customer@example.com',
  ): Promise<TestUser> {
    return prisma.user.create({
      data: {
        name: 'Cart Customer',
        email,
        passwordHash: 'hashed-password-for-tests',
        role: UserRole.CUSTOMER,
      },
    });
  }

  async function createCategory(): Promise<TestCategory> {
    return prisma.category.create({
      data: {
        name: 'Games e Consoles',
        slug: 'games-e-consoles',
        description: 'Categoria de testes.',
      },
    });
  }

  async function createProduct(
    categoryId: string,
    overrides: Partial<{
      name: string;
      slug: string;
      sku: string;
      priceInCents: number;
      discountInCents: number;
      stock: number;
      status: 'DRAFT' | 'ACTIVE' | 'INACTIVE';
      isActive: boolean;
    }> = {},
  ): Promise<TestProduct> {
    return prisma.product.create({
      data: {
        categoryId,
        name: overrides.name ?? 'Controle Xbox Series',
        slug: overrides.slug ?? 'controle-xbox-series',
        description: 'Produto de testes.',
        sku: overrides.sku ?? 'CTRL-XBOX-SERIES',
        priceInCents: overrides.priceInCents ?? 39990,
        discountInCents: overrides.discountInCents ?? 5000,
        stock: overrides.stock ?? 10,
        status: overrides.status ?? 'ACTIVE',
        isActive: overrides.isActive ?? true,
        images: {
          create: [
            {
              url: 'https://example.com/images/controle-xbox.jpg',
              altText: 'Controle Xbox Series',
              position: 0,
              isMain: true,
            },
          ],
        },
      },
    });
  }

  function authHeader(userId: string): string {
    return buildAuthorizationHeader(app, {
      userId,
      role: UserRole.CUSTOMER,
    });
  }

  async function addItem(
    productId: string,
    authorization: string,
    quantity = 2,
  ): Promise<CartResponse> {
    const response = await app.inject({
      method: 'POST',
      url: '/api/cart',
      headers: {
        authorization,
      },
      payload: {
        productId,
        quantity,
      },
    });

    const body = response.json();

    expect(response.statusCode).toBe(201);

    return body.data;
  }

  it('should return empty cart for authenticated user', async () => {
    const user = await createUser();

    const response = await app.inject({
      method: 'GET',
      url: '/api/cart',
      headers: {
        authorization: authHeader(user.id),
      },
    });

    const body = response.json();

    expect(response.statusCode).toBe(200);
    expect(body).toEqual({
      success: true,
      data: {
        items: [],
        summary: {
          itemsCount: 0,
          totalQuantity: 0,
          subtotalInCents: 0,
          discountInCents: 0,
          totalInCents: 0,
        },
      },
    });
  });

  it('should not list cart without token', async () => {
    const response = await app.inject({
      method: 'GET',
      url: '/api/cart',
    });

    const body = response.json();

    expect(response.statusCode).toBe(401);
    expect(body).toEqual({
      success: false,
      error: {
        code: 'AUTHENTICATION_REQUIRED',
        message: 'Authentication required.',
      },
    });
  });

  it('should add a product to cart', async () => {
    const user = await createUser();
    const category = await createCategory();
    const product = await createProduct(category.id);

    const response = await app.inject({
      method: 'POST',
      url: '/api/cart',
      headers: {
        authorization: authHeader(user.id),
      },
      payload: {
        productId: product.id,
        quantity: 2,
      },
    });

    const body = response.json();

    expect(response.statusCode).toBe(201);
    expect(body.success).toBe(true);
    expect(body.data.items).toHaveLength(1);
    expect(body.data.items[0]).toEqual(
      expect.objectContaining({
        id: expect.any(String),
        productId: product.id,
        quantity: 2,
        unitPriceInCents: 39990,
        unitDiscountInCents: 5000,
        subtotalInCents: 79980,
        discountInCents: 10000,
        totalInCents: 69980,
      }),
    );
    expect(body.data.items[0].product).toEqual(
      expect.objectContaining({
        id: product.id,
        name: 'Controle Xbox Series',
        slug: 'controle-xbox-series',
      }),
    );
    expect(body.data.summary).toEqual({
      itemsCount: 1,
      totalQuantity: 2,
      subtotalInCents: 79980,
      discountInCents: 10000,
      totalInCents: 69980,
    });
  });

  it('should increment quantity when adding the same product again', async () => {
    const user = await createUser();
    const category = await createCategory();
    const product = await createProduct(category.id);
    const authorization = authHeader(user.id);

    await addItem(product.id, authorization, 2);

    const cart = await addItem(product.id, authorization, 3);

    expect(cart.items).toHaveLength(1);
    expect(cart.items[0]).toEqual(
      expect.objectContaining({
        productId: product.id,
        quantity: 5,
        subtotalInCents: 199950,
        discountInCents: 25000,
        totalInCents: 174950,
      }),
    );
    expect(cart.summary).toEqual({
      itemsCount: 1,
      totalQuantity: 5,
      subtotalInCents: 199950,
      discountInCents: 25000,
      totalInCents: 174950,
    });
  });

  it('should not add product when stock is insufficient', async () => {
    const user = await createUser();
    const category = await createCategory();
    const product = await createProduct(category.id, {
      stock: 1,
    });

    const response = await app.inject({
      method: 'POST',
      url: '/api/cart',
      headers: {
        authorization: authHeader(user.id),
      },
      payload: {
        productId: product.id,
        quantity: 2,
      },
    });

    const body = response.json();

    expect(response.statusCode).toBe(400);
    expect(body).toEqual({
      success: false,
      error: {
        code: 'INSUFFICIENT_STOCK',
        message: 'Insufficient product stock.',
      },
    });
  });

  it('should not add unavailable product', async () => {
    const user = await createUser();
    const category = await createCategory();
    const product = await createProduct(category.id, {
      status: 'INACTIVE',
    });

    const response = await app.inject({
      method: 'POST',
      url: '/api/cart',
      headers: {
        authorization: authHeader(user.id),
      },
      payload: {
        productId: product.id,
        quantity: 1,
      },
    });

    const body = response.json();

    expect(response.statusCode).toBe(400);
    expect(body).toEqual({
      success: false,
      error: {
        code: 'PRODUCT_UNAVAILABLE',
        message: 'Product is unavailable.',
      },
    });
  });

  it('should update cart item quantity', async () => {
    const user = await createUser();
    const category = await createCategory();
    const product = await createProduct(category.id);
    const authorization = authHeader(user.id);

    const cart = await addItem(product.id, authorization, 2);
    const itemId = cart.items[0].id;

    const response = await app.inject({
      method: 'PATCH',
      url: `/api/cart/${itemId}`,
      headers: {
        authorization,
      },
      payload: {
        quantity: 4,
      },
    });

    const body = response.json();

    expect(response.statusCode).toBe(200);
    expect(body.success).toBe(true);
    expect(body.data.items).toHaveLength(1);
    expect(body.data.items[0]).toEqual(
      expect.objectContaining({
        id: itemId,
        productId: product.id,
        quantity: 4,
        subtotalInCents: 159960,
        discountInCents: 20000,
        totalInCents: 139960,
      }),
    );
    expect(body.data.summary).toEqual({
      itemsCount: 1,
      totalQuantity: 4,
      subtotalInCents: 159960,
      discountInCents: 20000,
      totalInCents: 139960,
    });
  });

  it('should not update cart item from another user', async () => {
    const owner = await createUser('cart.owner@example.com');
    const anotherUser = await createUser('cart.another@example.com');
    const category = await createCategory();
    const product = await createProduct(category.id);

    const ownerAuthorization = authHeader(owner.id);
    const anotherUserAuthorization = authHeader(anotherUser.id);

    const cart = await addItem(product.id, ownerAuthorization, 2);
    const itemId = cart.items[0].id;

    const response = await app.inject({
      method: 'PATCH',
      url: `/api/cart/${itemId}`,
      headers: {
        authorization: anotherUserAuthorization,
      },
      payload: {
        quantity: 4,
      },
    });

    const body = response.json();

    expect(response.statusCode).toBe(404);
    expect(body).toEqual({
      success: false,
      error: {
        code: 'CART_ITEM_NOT_FOUND',
        message: 'Cart item not found.',
      },
    });
  });

  it('should remove cart item', async () => {
    const user = await createUser();
    const category = await createCategory();
    const product = await createProduct(category.id);
    const authorization = authHeader(user.id);

    const cart = await addItem(product.id, authorization, 2);
    const itemId = cart.items[0].id;

    const response = await app.inject({
      method: 'DELETE',
      url: `/api/cart/${itemId}`,
      headers: {
        authorization,
      },
    });

    const body = response.json();

    expect(response.statusCode).toBe(200);
    expect(body).toEqual({
      success: true,
      data: {
        items: [],
        summary: {
          itemsCount: 0,
          totalQuantity: 0,
          subtotalInCents: 0,
          discountInCents: 0,
          totalInCents: 0,
        },
      },
    });
  });


  it('should not add product without token', async () => {
    const response = await app.inject({
      method: 'POST',
      url: '/api/cart',
      payload: {
        productId: '11111111-1111-4111-8111-111111111111',
        quantity: 1,
      },
    });

    expect(response.statusCode).toBe(401);
  });

  it('should not add product when product does not exist', async () => {
    const user = await createUser();

    const response = await app.inject({
      method: 'POST',
      url: '/api/cart',
      headers: {
        authorization: authHeader(user.id),
      },
      payload: {
        productId: '11111111-1111-4111-8111-111111111111',
        quantity: 1,
      },
    });

    const body = response.json();

    expect(response.statusCode).toBe(404);
    expect(body).toEqual({
      success: false,
      error: {
        code: 'PRODUCT_NOT_FOUND',
        message: 'Product not found.',
      },
    });
  });

  it('should not add product with invalid quantity', async () => {
    const user = await createUser();
    const category = await createCategory();
    const product = await createProduct(category.id);

    const response = await app.inject({
      method: 'POST',
      url: '/api/cart',
      headers: {
        authorization: authHeader(user.id),
      },
      payload: {
        productId: product.id,
        quantity: 0,
      },
    });

    expect(response.statusCode).toBe(400);
  });

  it('should not update cart item quantity above product stock', async () => {
    const user = await createUser();
    const category = await createCategory();
    const product = await createProduct(category.id, {
      stock: 3,
    });
    const authorization = authHeader(user.id);

    const cart = await addItem(product.id, authorization, 2);
    const itemId = cart.items[0].id;

    const response = await app.inject({
      method: 'PATCH',
      url: `/api/cart/${itemId}`,
      headers: {
        authorization,
      },
      payload: {
        quantity: 4,
      },
    });

    const body = response.json();

    expect(response.statusCode).toBe(400);
    expect(body).toEqual({
      success: false,
      error: {
        code: 'INSUFFICIENT_STOCK',
        message: 'Insufficient product stock.',
      },
    });
  });

  it('should not remove cart item from another user', async () => {
    const owner = await createUser('cart.remove.owner@example.com');
    const anotherUser = await createUser('cart.remove.another@example.com');
    const category = await createCategory();
    const product = await createProduct(category.id);

    const ownerAuthorization = authHeader(owner.id);
    const anotherUserAuthorization = authHeader(anotherUser.id);

    const cart = await addItem(product.id, ownerAuthorization, 2);
    const itemId = cart.items[0].id;

    const response = await app.inject({
      method: 'DELETE',
      url: `/api/cart/${itemId}`,
      headers: {
        authorization: anotherUserAuthorization,
      },
    });

    const body = response.json();

    expect(response.statusCode).toBe(404);
    expect(body).toEqual({
      success: false,
      error: {
        code: 'CART_ITEM_NOT_FOUND',
        message: 'Cart item not found.',
      },
    });
  });

  it('should not clear cart without token', async () => {
    const response = await app.inject({
      method: 'DELETE',
      url: '/api/cart',
    });

    expect(response.statusCode).toBe(401);
  });

  it('should clear cart', async () => {
    const user = await createUser();
    const category = await createCategory();
    const product = await createProduct(category.id);
    const authorization = authHeader(user.id);

    await addItem(product.id, authorization, 2);

    const response = await app.inject({
      method: 'DELETE',
      url: '/api/cart',
      headers: {
        authorization,
      },
    });

    const body = response.json();

    expect(response.statusCode).toBe(200);
    expect(body).toEqual({
      success: true,
      data: {
        items: [],
        summary: {
          itemsCount: 0,
          totalQuantity: 0,
          subtotalInCents: 0,
          discountInCents: 0,
          totalInCents: 0,
        },
      },
    });
  });
});
