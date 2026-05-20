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
  name: string;
  slug: string;
};

type TestProduct = {
  id: string;
  categoryId: string;
  name: string;
  slug: string;
  sku: string;
};

describe('Products routes', () => {
  let app: FastifyInstance;
  let adminAuthorization: string;
  let customerAuthorization: string;

  beforeAll(async () => {
    app = await buildTestApp();

    adminAuthorization = buildAuthorizationHeader(app, {
      role: UserRole.ADMIN,
    });

    customerAuthorization = buildAuthorizationHeader(app, {
      role: UserRole.CUSTOMER,
    });
  });

  beforeEach(async () => {
    await clearDatabase();
  });

  afterAll(async () => {
    await app.close();
    await disconnectDatabase();
  });

  async function createCategory(
    name = 'Games e Consoles',
    slug = 'games-e-consoles',
  ): Promise<TestCategory> {
    return prisma.category.create({
      data: {
        name,
        slug,
        description: 'Categoria de testes.',
      },
    });
  }

  async function createProduct(
    categoryId: string,
    overrides: Partial<{
      name: string;
      sku: string;
      priceInCents: number;
      discountInCents: number;
      stock: number;
      status: 'DRAFT' | 'ACTIVE' | 'INACTIVE';
    }> = {},
  ): Promise<TestProduct> {
    const response = await app.inject({
      method: 'POST',
      url: '/api/products',
      headers: {
        authorization: adminAuthorization,
      },
      payload: {
        categoryId,
        name: overrides.name ?? 'Controle Xbox Series',
        description: 'Controle sem fio para Xbox.',
        sku: overrides.sku ?? 'ctrl-xbox-series',
        priceInCents: overrides.priceInCents ?? 39990,
        discountInCents: overrides.discountInCents ?? 5000,
        stock: overrides.stock ?? 10,
        status: overrides.status ?? 'ACTIVE',
        images: [
          {
            url: 'https://example.com/images/controle-xbox.jpg',
            altText: 'Controle Xbox Series',
          },
        ],
      },
    });

    const body = response.json();

    expect(response.statusCode).toBe(201);

    return body.data;
  }

  it('should create a product when user has ADMIN role', async () => {
    const category = await createCategory();

    const response = await app.inject({
      method: 'POST',
      url: '/api/products',
      headers: {
        authorization: adminAuthorization,
      },
      payload: {
        categoryId: category.id,
        name: 'Controle Xbox Series',
        description: 'Controle sem fio para Xbox.',
        sku: 'ctrl-xbox-series',
        priceInCents: 39990,
        discountInCents: 5000,
        stock: 10,
        status: 'ACTIVE',
        images: [
          {
            url: 'https://example.com/images/controle-xbox.jpg',
            altText: 'Controle Xbox Series',
          },
        ],
      },
    });

    const body = response.json();

    expect(response.statusCode).toBe(201);
    expect(body.success).toBe(true);
    expect(body.data).toEqual(
      expect.objectContaining({
        id: expect.any(String),
        categoryId: category.id,
        name: 'Controle Xbox Series',
        slug: 'controle-xbox-series',
        description: 'Controle sem fio para Xbox.',
        sku: 'CTRL-XBOX-SERIES',
        priceInCents: 39990,
        discountInCents: 5000,
        stock: 10,
        status: 'ACTIVE',
        isActive: true,
        createdAt: expect.any(String),
        updatedAt: expect.any(String),
      }),
    );
    expect(body.data.category).toEqual(
      expect.objectContaining({
        id: category.id,
        name: category.name,
        slug: category.slug,
      }),
    );
    expect(body.data.images).toEqual([
      expect.objectContaining({
        id: expect.any(String),
        productId: body.data.id,
        url: 'https://example.com/images/controle-xbox.jpg',
        altText: 'Controle Xbox Series',
        position: 0,
        isMain: true,
        createdAt: expect.any(String),
        updatedAt: expect.any(String),
      }),
    ]);
  });

  it('should not create a product when category does not exist', async () => {
    const response = await app.inject({
      method: 'POST',
      url: '/api/products',
      headers: {
        authorization: adminAuthorization,
      },
      payload: {
        categoryId: '11111111-1111-4111-8111-111111111111',
        name: 'Controle Xbox Series',
        sku: 'ctrl-xbox-series',
        priceInCents: 39990,
        discountInCents: 5000,
        stock: 10,
      },
    });

    const body = response.json();

    expect(response.statusCode).toBe(404);
    expect(body).toEqual({
      success: false,
      error: {
        code: 'CATEGORY_NOT_FOUND',
        message: 'Category not found.',
      },
    });
  });

  it('should not create a product with duplicated slug', async () => {
    const category = await createCategory();

    await createProduct(category.id, {
      name: 'Controle Xbox Series',
      sku: 'ctrl-xbox-series',
    });

    const response = await app.inject({
      method: 'POST',
      url: '/api/products',
      headers: {
        authorization: adminAuthorization,
      },
      payload: {
        categoryId: category.id,
        name: 'Controle Xbox Series',
        sku: 'ctrl-xbox-series-2',
        priceInCents: 39990,
        discountInCents: 5000,
        stock: 10,
      },
    });

    const body = response.json();

    expect(response.statusCode).toBe(409);
    expect(body).toEqual({
      success: false,
      error: {
        code: 'PRODUCT_ALREADY_EXISTS',
        message: 'Product already exists.',
      },
    });
  });

  it('should not create a product with duplicated SKU', async () => {
    const category = await createCategory();

    await createProduct(category.id, {
      name: 'Controle Xbox Series',
      sku: 'ctrl-xbox-series',
    });

    const response = await app.inject({
      method: 'POST',
      url: '/api/products',
      headers: {
        authorization: adminAuthorization,
      },
      payload: {
        categoryId: category.id,
        name: 'Headset Gamer',
        sku: 'ctrl-xbox-series',
        priceInCents: 29990,
        discountInCents: 3000,
        stock: 5,
      },
    });

    const body = response.json();

    expect(response.statusCode).toBe(409);
    expect(body).toEqual({
      success: false,
      error: {
        code: 'PRODUCT_SKU_ALREADY_EXISTS',
        message: 'Product SKU already exists.',
      },
    });
  });

  it('should not create a product when discount is greater than or equal to price', async () => {
    const category = await createCategory();

    const response = await app.inject({
      method: 'POST',
      url: '/api/products',
      headers: {
        authorization: adminAuthorization,
      },
      payload: {
        categoryId: category.id,
        name: 'Controle Xbox Series',
        sku: 'ctrl-xbox-series',
        priceInCents: 39990,
        discountInCents: 39990,
        stock: 10,
      },
    });

    const body = response.json();

    expect(response.statusCode).toBe(400);
    expect(body).toEqual({
      success: false,
      error: {
        code: 'INVALID_PRODUCT_DISCOUNT',
        message: 'Discount must be lower than product price.',
      },
    });
  });

  it('should not create a product when user has CUSTOMER role', async () => {
    const category = await createCategory();

    const response = await app.inject({
      method: 'POST',
      url: '/api/products',
      headers: {
        authorization: customerAuthorization,
      },
      payload: {
        categoryId: category.id,
        name: 'Controle Xbox Series',
        sku: 'ctrl-xbox-series',
        priceInCents: 39990,
        discountInCents: 5000,
        stock: 10,
      },
    });

    const body = response.json();

    expect(response.statusCode).toBe(403);
    expect(body).toEqual({
      success: false,
      error: {
        code: 'FORBIDDEN_ACCESS',
        message: 'Forbidden access.',
      },
    });
  });

  it('should list active products with pagination metadata', async () => {
    const category = await createCategory();

    await createProduct(category.id, {
      name: 'Controle Xbox Series',
      sku: 'ctrl-xbox-series',
      priceInCents: 39990,
    });

    await createProduct(category.id, {
      name: 'Headset Gamer',
      sku: 'headset-gamer',
      priceInCents: 29990,
    });

    const response = await app.inject({
      method: 'GET',
      url: '/api/products?page=1&perPage=10&sortBy=price&sortOrder=asc',
    });

    const body = response.json();

    expect(response.statusCode).toBe(200);
    expect(body.success).toBe(true);
    expect(body.data).toHaveLength(2);
    expect(body.data[0]).toEqual(
      expect.objectContaining({
        name: 'Headset Gamer',
        slug: 'headset-gamer',
        sku: 'HEADSET-GAMER',
        priceInCents: 29990,
        isActive: true,
        status: 'ACTIVE',
      }),
    );
    expect(body.data[1]).toEqual(
      expect.objectContaining({
        name: 'Controle Xbox Series',
        slug: 'controle-xbox-series',
        sku: 'CTRL-XBOX-SERIES',
        priceInCents: 39990,
        isActive: true,
        status: 'ACTIVE',
      }),
    );
    expect(body.meta).toEqual({
      page: 1,
      perPage: 10,
      total: 2,
      totalPages: 1,
    });
  });

  it('should filter products by search and stock availability', async () => {
    const category = await createCategory();

    await createProduct(category.id, {
      name: 'Controle Xbox Series',
      sku: 'ctrl-xbox-series',
      stock: 10,
    });

    await createProduct(category.id, {
      name: 'Headset Gamer',
      sku: 'headset-gamer',
      stock: 0,
    });

    const response = await app.inject({
      method: 'GET',
      url: '/api/products?search=controle&inStock=true',
    });

    const body = response.json();

    expect(response.statusCode).toBe(200);
    expect(body.success).toBe(true);
    expect(body.data).toHaveLength(1);
    expect(body.data[0]).toEqual(
      expect.objectContaining({
        name: 'Controle Xbox Series',
        stock: 10,
      }),
    );
  });

  it('should return invalid price range when min price is greater than max price', async () => {
    const response = await app.inject({
      method: 'GET',
      url: '/api/products?minPriceInCents=50000&maxPriceInCents=10000',
    });

    const body = response.json();

    expect(response.statusCode).toBe(400);
    expect(body).toEqual({
      success: false,
      error: {
        code: 'INVALID_PRICE_RANGE',
        message: 'Minimum price cannot be greater than maximum price.',
      },
    });
  });

  it('should get a product by slug with related products', async () => {
    const category = await createCategory();

    await createProduct(category.id, {
      name: 'Headset Gamer',
      sku: 'headset-gamer',
    });

    await createProduct(category.id, {
      name: 'Controle Xbox Series',
      sku: 'ctrl-xbox-series',
    });

    const response = await app.inject({
      method: 'GET',
      url: '/api/products/controle-xbox-series',
    });

    const body = response.json();

    expect(response.statusCode).toBe(200);
    expect(body.success).toBe(true);
    expect(body.data.product).toEqual(
      expect.objectContaining({
        name: 'Controle Xbox Series',
        slug: 'controle-xbox-series',
        sku: 'CTRL-XBOX-SERIES',
        isActive: true,
        status: 'ACTIVE',
      }),
    );
    expect(body.data.relatedProducts).toHaveLength(1);
    expect(body.data.relatedProducts[0]).toEqual(
      expect.objectContaining({
        name: 'Headset Gamer',
        slug: 'headset-gamer',
      }),
    );
  });

  it('should return not found when product slug does not exist', async () => {
    const response = await app.inject({
      method: 'GET',
      url: '/api/products/not-found-product',
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

  it('should update a product when user has ADMIN role', async () => {
    const category = await createCategory();
    const product = await createProduct(category.id);

    const response = await app.inject({
      method: 'PATCH',
      url: `/api/products/${product.id}`,
      headers: {
        authorization: adminAuthorization,
      },
      payload: {
        name: 'Controle Xbox Atualizado',
        sku: 'ctrl-xbox-updated',
        priceInCents: 42990,
        discountInCents: 7000,
        stock: 15,
      },
    });

    const body = response.json();

    expect(response.statusCode).toBe(200);
    expect(body.success).toBe(true);
    expect(body.data).toEqual(
      expect.objectContaining({
        id: product.id,
        name: 'Controle Xbox Atualizado',
        slug: 'controle-xbox-atualizado',
        sku: 'CTRL-XBOX-UPDATED',
        priceInCents: 42990,
        discountInCents: 7000,
        stock: 15,
        isActive: true,
      }),
    );
  });

  it('should soft delete a product when user has ADMIN role', async () => {
    const category = await createCategory();
    const product = await createProduct(category.id);

    const response = await app.inject({
      method: 'DELETE',
      url: `/api/products/${product.id}`,
      headers: {
        authorization: adminAuthorization,
      },
    });

    const body = response.json();

    expect(response.statusCode).toBe(200);
    expect(body.success).toBe(true);
    expect(body.data).toEqual(
      expect.objectContaining({
        id: product.id,
        isActive: false,
      }),
    );

    const listResponse = await app.inject({
      method: 'GET',
      url: '/api/products',
    });

    const listBody = listResponse.json();

    expect(listResponse.statusCode).toBe(200);
    expect(listBody.data).toHaveLength(0);
  });

  it('should restore a soft deleted product when user has ADMIN role', async () => {
    const category = await createCategory();
    const product = await createProduct(category.id);

    await app.inject({
      method: 'DELETE',
      url: `/api/products/${product.id}`,
      headers: {
        authorization: adminAuthorization,
      },
    });

    const response = await app.inject({
      method: 'PATCH',
      url: `/api/products/${product.id}/restore`,
      headers: {
        authorization: adminAuthorization,
      },
    });

    const body = response.json();

    expect(response.statusCode).toBe(200);
    expect(body.success).toBe(true);
    expect(body.data).toEqual(
      expect.objectContaining({
        id: product.id,
        isActive: true,
      }),
    );
  });
  it('should not create a product without token', async () => {
    const category = await createCategory();

    const response = await app.inject({
      method: 'POST',
      url: '/api/products',
      payload: {
        categoryId: category.id,
        name: 'Controle Xbox Series',
        sku: 'ctrl-xbox-series',
        priceInCents: 39990,
        discountInCents: 5000,
        stock: 10,
      },
    });

    expect(response.statusCode).toBe(401);
  });

  it('should not create a product when category is inactive', async () => {
    const inactiveCategory = await prisma.category.create({
      data: {
        name: 'Categoria Inativa',
        slug: 'categoria-inativa',
        description: 'Categoria inativa para testes.',
        isActive: false,
      },
    });

    const response = await app.inject({
      method: 'POST',
      url: '/api/products',
      headers: {
        authorization: adminAuthorization,
      },
      payload: {
        categoryId: inactiveCategory.id,
        name: 'Produto Categoria Inativa',
        sku: 'produto-categoria-inativa',
        priceInCents: 39990,
        discountInCents: 5000,
        stock: 10,
      },
    });

    const body = response.json();

    expect(response.statusCode).toBe(404);
    expect(body).toEqual({
      success: false,
      error: {
        code: 'CATEGORY_NOT_FOUND',
        message: 'Category not found.',
      },
    });
  });

  it('should filter products by category slug and price range', async () => {
    const gamesCategory = await createCategory(
      'Games e Consoles',
      'games-e-consoles',
    );

    const booksCategory = await createCategory(
      'Livros',
      'livros',
    );

    await createProduct(gamesCategory.id, {
      name: 'Controle Xbox Series',
      sku: 'ctrl-xbox-series',
      priceInCents: 39990,
    });

    await createProduct(gamesCategory.id, {
      name: 'Headset Gamer',
      sku: 'headset-gamer',
      priceInCents: 29990,
    });

    await createProduct(booksCategory.id, {
      name: 'Livro Clean Code',
      sku: 'livro-clean-code',
      priceInCents: 45990,
    });

    const response = await app.inject({
      method: 'GET',
      url: '/api/products?categorySlug=games-e-consoles&minPriceInCents=30000&maxPriceInCents=50000',
    });

    const body = response.json();

    expect(response.statusCode).toBe(200);
    expect(body.success).toBe(true);
    expect(body.data).toHaveLength(1);
    expect(body.data[0]).toEqual(
      expect.objectContaining({
        name: 'Controle Xbox Series',
        slug: 'controle-xbox-series',
        sku: 'CTRL-XBOX-SERIES',
        priceInCents: 39990,
      }),
    );
    expect(body.meta.total).toBe(1);
  });

  it('should not update a product with empty payload', async () => {
    const category = await createCategory();
    const product = await createProduct(category.id);

    const response = await app.inject({
      method: 'PATCH',
      url: `/api/products/${product.id}`,
      headers: {
        authorization: adminAuthorization,
      },
      payload: {},
    });

    const body = response.json();

    expect(response.statusCode).toBe(400);
    expect(body).toEqual({
      success: false,
      error: {
        code: 'EMPTY_UPDATE_PAYLOAD',
        message: 'At least one field must be provided.',
      },
    });
  });

  it('should not update a product when discount is greater than or equal to price', async () => {
    const category = await createCategory();
    const product = await createProduct(category.id);

    const response = await app.inject({
      method: 'PATCH',
      url: `/api/products/${product.id}`,
      headers: {
        authorization: adminAuthorization,
      },
      payload: {
        priceInCents: 30000,
        discountInCents: 30000,
      },
    });

    const body = response.json();

    expect(response.statusCode).toBe(400);
    expect(body).toEqual({
      success: false,
      error: {
        code: 'INVALID_PRODUCT_DISCOUNT',
        message: 'Discount must be lower than product price.',
      },
    });
  });

  it('should not delete a product without token', async () => {
    const response = await app.inject({
      method: 'DELETE',
      url: '/api/products/11111111-1111-4111-8111-111111111111',
    });

    expect(response.statusCode).toBe(401);
  });


});
