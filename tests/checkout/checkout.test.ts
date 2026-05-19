import { randomUUID } from 'node:crypto';

import type { FastifyInstance } from 'fastify';
import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest';

import { ProductStatus, UserRole } from '../../src/generated/prisma/client';
import { prisma } from '../../src/infra/prisma/client';
import { buildAuthorizationHeader } from '../helpers/auth-test-helper';
import { buildTestApp } from '../helpers/build-test-app';
import {
  clearDatabase,
  disconnectDatabase,
} from '../helpers/database-test-helper';

type TestUser = {
  id: string;
};

type TestAddress = {
  id: string;
};

type TestProduct = {
  id: string;
};

describe('Checkout routes', () => {
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

  function authHeader(userId: string): string {
    return buildAuthorizationHeader(app, {
      userId,
      role: UserRole.CUSTOMER,
    });
  }

  async function createUser(
    email = `checkout.customer.${randomUUID()}@example.com`,
  ): Promise<TestUser> {
    return prisma.user.create({
      data: {
        name: 'Checkout Customer',
        email,
        passwordHash: 'hashed-password-for-tests',
        role: UserRole.CUSTOMER,
      },
    });
  }

  async function createAddress(userId: string): Promise<TestAddress> {
    return prisma.address.create({
      data: {
        userId,
        label: 'Casa',
        recipientName: 'Checkout Customer',
        phone: '31999999999',
        zipCode: '32073000',
        street: 'Rua Laranjal',
        number: '123',
        complement: 'Apto 1',
        neighborhood: 'Industrial São Luiz',
        city: 'Contagem',
        state: 'MG',
        country: 'Brazil',
        isMain: true,
        isActive: true,
      },
    });
  }

  async function createProduct(
    overrides: Partial<{
      stock: number;
      status: 'DRAFT' | 'ACTIVE' | 'INACTIVE';
      isActive: boolean;
    }> = {},
  ): Promise<TestProduct> {
    const category = await prisma.category.create({
      data: {
        name: `Games ${randomUUID()}`,
        slug: `games-${randomUUID()}`,
        description: 'Categoria de testes.',
      },
    });

    return prisma.product.create({
      data: {
        categoryId: category.id,
        name: 'Controle Xbox Series',
        slug: `controle-xbox-series-${randomUUID()}`,
        description: 'Produto de testes.',
        sku: `CTRL-${randomUUID()}`,
        priceInCents: 39990,
        discountInCents: 5000,
        weightInGrams: 500,
        widthCm: 15,
        heightCm: 10,
        lengthCm: 20,
        stock: overrides.stock ?? 10,
        status: overrides.status ?? ProductStatus.ACTIVE,
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

  async function addCartItem(params: {
    userId: string;
    productId: string;
    quantity?: number;
  }): Promise<void> {
    await prisma.cartItem.create({
      data: {
        userId: params.userId,
        productId: params.productId,
        quantity: params.quantity ?? 2,
      },
    });
  }

  it('should not calculate shipping without token', async () => {
    const response = await app.inject({
      method: 'POST',
      url: '/api/checkout/shipping',
      payload: {
        addressId: '11111111-1111-4111-8111-111111111111',
      },
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

  it('should not calculate shipping when address does not exist', async () => {
    const user = await createUser();

    const response = await app.inject({
      method: 'POST',
      url: '/api/checkout/shipping',
      headers: {
        authorization: authHeader(user.id),
      },
      payload: {
        addressId: '11111111-1111-4111-8111-111111111111',
      },
    });

    const body = response.json();

    expect(response.statusCode).toBe(404);
    expect(body).toEqual({
      success: false,
      error: {
        code: 'ADDRESS_NOT_FOUND',
        message: 'Address not found.',
      },
    });
  });

  it('should not calculate shipping when cart is empty', async () => {
    const user = await createUser();
    const address = await createAddress(user.id);

    const response = await app.inject({
      method: 'POST',
      url: '/api/checkout/shipping',
      headers: {
        authorization: authHeader(user.id),
      },
      payload: {
        addressId: address.id,
      },
    });

    const body = response.json();

    expect(response.statusCode).toBe(400);
    expect(body).toEqual({
      success: false,
      error: {
        code: 'CART_EMPTY',
        message: 'Cart is empty.',
      },
    });
  });

  it('should not calculate shipping when product stock is insufficient', async () => {
    const user = await createUser();
    const address = await createAddress(user.id);
    const product = await createProduct({
      stock: 1,
    });

    await addCartItem({
      userId: user.id,
      productId: product.id,
      quantity: 2,
    });

    const response = await app.inject({
      method: 'POST',
      url: '/api/checkout/shipping',
      headers: {
        authorization: authHeader(user.id),
      },
      payload: {
        addressId: address.id,
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

  it('should return shipping provider disabled when shipping preconditions are valid', async () => {
    const user = await createUser();
    const address = await createAddress(user.id);
    const product = await createProduct();

    await addCartItem({
      userId: user.id,
      productId: product.id,
      quantity: 2,
    });

    const response = await app.inject({
      method: 'POST',
      url: '/api/checkout/shipping',
      headers: {
        authorization: authHeader(user.id),
      },
      payload: {
        addressId: address.id,
      },
    });

    const body = response.json();

    expect(response.statusCode).toBe(500);
    expect(body).toEqual({
      success: false,
      error: {
        code: 'SHIPPING_PROVIDER_DISABLED',
        message: 'Shipping provider is disabled.',
      },
    });
  });

  it('should not review checkout without token', async () => {
    const response = await app.inject({
      method: 'POST',
      url: '/api/checkout/review',
      payload: {
        addressId: '11111111-1111-4111-8111-111111111111',
        shippingServiceCode: '1',
        paymentMethod: 'PIX',
      },
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

  it('should not review checkout with coupon while coupons are not implemented', async () => {
    const user = await createUser();

    const response = await app.inject({
      method: 'POST',
      url: '/api/checkout/review',
      headers: {
        authorization: authHeader(user.id),
      },
      payload: {
        addressId: '11111111-1111-4111-8111-111111111111',
        shippingServiceCode: '1',
        paymentMethod: 'PIX',
        couponCode: 'PROMO10',
      },
    });

    const body = response.json();

    expect(response.statusCode).toBe(400);
    expect(body).toEqual({
      success: false,
      error: {
        code: 'COUPON_NOT_IMPLEMENTED',
        message: 'Coupon is not implemented yet.',
      },
    });
  });

  it('should not review checkout when address does not exist', async () => {
    const user = await createUser();

    const response = await app.inject({
      method: 'POST',
      url: '/api/checkout/review',
      headers: {
        authorization: authHeader(user.id),
      },
      payload: {
        addressId: '11111111-1111-4111-8111-111111111111',
        shippingServiceCode: '1',
        paymentMethod: 'PIX',
      },
    });

    const body = response.json();

    expect(response.statusCode).toBe(404);
    expect(body).toEqual({
      success: false,
      error: {
        code: 'ADDRESS_NOT_FOUND',
        message: 'Address not found.',
      },
    });
  });

  it('should not review checkout when cart is empty', async () => {
    const user = await createUser();
    const address = await createAddress(user.id);

    const response = await app.inject({
      method: 'POST',
      url: '/api/checkout/review',
      headers: {
        authorization: authHeader(user.id),
      },
      payload: {
        addressId: address.id,
        shippingServiceCode: '1',
        paymentMethod: 'PIX',
      },
    });

    const body = response.json();

    expect(response.statusCode).toBe(400);
    expect(body).toEqual({
      success: false,
      error: {
        code: 'CART_EMPTY',
        message: 'Cart is empty.',
      },
    });
  });

  it('should return shipping provider disabled when review preconditions are valid', async () => {
    const user = await createUser();
    const address = await createAddress(user.id);
    const product = await createProduct();

    await addCartItem({
      userId: user.id,
      productId: product.id,
      quantity: 2,
    });

    const response = await app.inject({
      method: 'POST',
      url: '/api/checkout/review',
      headers: {
        authorization: authHeader(user.id),
      },
      payload: {
        addressId: address.id,
        shippingServiceCode: '1',
        paymentMethod: 'PIX',
      },
    });

    const body = response.json();

    expect(response.statusCode).toBe(500);
    expect(body).toEqual({
      success: false,
      error: {
        code: 'SHIPPING_PROVIDER_DISABLED',
        message: 'Shipping provider is disabled.',
      },
    });
  });
});
