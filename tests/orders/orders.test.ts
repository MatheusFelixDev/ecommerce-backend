import type { FastifyInstance } from 'fastify';
import { afterAll, afterEach, beforeAll, beforeEach, describe, expect, it, vi } from 'vitest';

import {
  PaymentMethod,
  PaymentStatus,
  ProductStatus,
  UserRole,
} from '../../src/generated/prisma/client';
import { prisma } from '../../src/infra/prisma/client';
import { melhorEnvioShippingProvider } from '../../src/modules/checkout/providers/melhor-envio-shipping.provider';
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

type TestOrder = {
  id: string;
};

describe('Orders routes', () => {
  let app: FastifyInstance;

  beforeAll(async () => {
    app = await buildTestApp();
  });

  beforeEach(async () => {
    await clearDatabase();
  });

  afterEach(() => {
    vi.restoreAllMocks();
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

  function adminAuthHeader(userId: string): string {
    return buildAuthorizationHeader(app, {
      userId,
      role: UserRole.ADMIN,
    });
  }

  function mockShippingOptions(): void {
    const shippingOptions: Awaited<
      ReturnType<typeof melhorEnvioShippingProvider.calculate>
    > = [
      {
        provider: 'MELHOR_ENVIO',
        serviceCode: '1',
        serviceName: 'PAC',
        priceInCents: 2000,
        deadlineDays: 5,
      },
    ];

    vi.spyOn(melhorEnvioShippingProvider, 'calculate').mockResolvedValue(
      shippingOptions,
    );
  }

  async function createUser(
    email = 'orders.customer@example.com',
  ): Promise<TestUser> {
    return prisma.user.create({
      data: {
        name: 'Orders Customer',
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
        recipientName: 'Orders Customer',
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

  async function createProduct(stock = 8): Promise<TestProduct> {
    const category = await prisma.category.create({
      data: {
        name: 'Games e Consoles',
        slug: `games-e-consoles-${crypto.randomUUID()}`,
        description: 'Categoria de testes.',
      },
    });

    return prisma.product.create({
      data: {
        categoryId: category.id,
        name: 'Controle Xbox Series',
        slug: `controle-xbox-series-${crypto.randomUUID()}`,
        description: 'Produto de testes.',
        sku: `CTRL-${crypto.randomUUID()}`,
        priceInCents: 39990,
        discountInCents: 5000,
        stock,
        status: ProductStatus.ACTIVE,
        isActive: true,
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

  async function createOrder(params: {
    userId: string;
    addressId: string;
    productId: string;
    status?: 'PENDING' | 'PAID' | 'PROCESSING' | 'SEPARATED' | 'SHIPPED' | 'DELIVERED' | 'CANCELED';
  }): Promise<TestOrder> {
    return prisma.order.create({
      data: {
        userId: params.userId,
        addressId: params.addressId,
        status: params.status ?? 'PENDING',
        paymentStatus: PaymentStatus.PENDING,
        paymentMethod: PaymentMethod.PIX,
        shippingProvider: 'MELHOR_ENVIO',
        shippingServiceCode: '1',
        shippingServiceName: 'PAC',
        shippingPriceInCents: 2000,
        shippingDeadlineDays: 5,
        couponCode: null,
        couponDiscountInCents: 0,
        itemsCount: 1,
        totalQuantity: 2,
        subtotalInCents: 79980,
        discountInCents: 10000,
        totalInCents: 71980,
        addressZipCode: '32073000',
        addressStreet: 'Rua Laranjal',
        addressNumber: '123',
        addressComplement: 'Apto 1',
        addressNeighborhood: 'Industrial São Luiz',
        addressCity: 'Contagem',
        addressState: 'MG',
        addressCountry: 'Brazil',
        recipientName: 'Orders Customer',
        recipientPhone: '31999999999',
        items: {
          create: [
            {
              productId: params.productId,
              productName: 'Controle Xbox Series',
              productSlug: 'controle-xbox-series',
              productSku: 'CTRL-XBOX-SERIES',
              productImageUrl: 'https://example.com/images/controle-xbox.jpg',
              quantity: 2,
              unitPriceInCents: 39990,
              unitDiscountInCents: 5000,
              subtotalInCents: 79980,
              discountInCents: 10000,
              totalInCents: 69980,
            },
          ],
        },
      },
    });
  }

  it('should list authenticated user orders', async () => {
    const user = await createUser();
    const address = await createAddress(user.id);
    const product = await createProduct();
    const order = await createOrder({
      userId: user.id,
      addressId: address.id,
      productId: product.id,
    });

    const response = await app.inject({
      method: 'GET',
      url: '/api/orders?page=1&perPage=10',
      headers: {
        authorization: authHeader(user.id),
      },
    });

    const body = response.json();

    expect(response.statusCode).toBe(200);
    expect(body.success).toBe(true);
    expect(body.data).toHaveLength(1);
    expect(body.data[0]).toEqual(
      expect.objectContaining({
        id: order.id,
        status: 'PENDING',
        paymentStatus: 'PENDING',
        paymentMethod: 'PIX',
        itemsCount: 1,
        totalQuantity: 2,
        subtotalInCents: 79980,
        discountInCents: 10000,
        shippingInCents: 2000,
        couponDiscountInCents: 0,
        totalInCents: 71980,
        createdAt: expect.any(String),
      }),
    );
    expect(body.data[0].shipping).toEqual({
      provider: 'MELHOR_ENVIO',
      serviceCode: '1',
      serviceName: 'PAC',
      priceInCents: 2000,
      deadlineDays: 5,
    });
    expect(body.meta).toEqual({
      page: 1,
      perPage: 10,
      total: 1,
      totalPages: 1,
    });
  });

  it('should not list orders without token', async () => {
    const response = await app.inject({
      method: 'GET',
      url: '/api/orders',
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

  it('should get authenticated user order by id', async () => {
    const user = await createUser();
    const address = await createAddress(user.id);
    const product = await createProduct();
    const order = await createOrder({
      userId: user.id,
      addressId: address.id,
      productId: product.id,
    });

    const response = await app.inject({
      method: 'GET',
      url: `/api/orders/${order.id}`,
      headers: {
        authorization: authHeader(user.id),
      },
    });

    const body = response.json();

    expect(response.statusCode).toBe(200);
    expect(body.success).toBe(true);
    expect(body.data).toEqual(
      expect.objectContaining({
        id: order.id,
        status: 'PENDING',
        paymentStatus: 'PENDING',
        paymentMethod: 'PIX',
        addressId: address.id,
        coupon: null,
        canceledAt: null,
        createdAt: expect.any(String),
        updatedAt: expect.any(String),
      }),
    );
    expect(body.data.address).toEqual({
      zipCode: '32073000',
      street: 'Rua Laranjal',
      number: '123',
      complement: 'Apto 1',
      neighborhood: 'Industrial São Luiz',
      city: 'Contagem',
      state: 'MG',
      country: 'Brazil',
      recipientName: 'Orders Customer',
      recipientPhone: '31999999999',
    });
    expect(body.data.items).toHaveLength(1);
    expect(body.data.summary).toEqual({
      itemsCount: 1,
      totalQuantity: 2,
      subtotalInCents: 79980,
      discountInCents: 10000,
      shippingInCents: 2000,
      couponDiscountInCents: 0,
      totalInCents: 71980,
    });
  });

  it('should not get order from another user', async () => {
    const owner = await createUser('orders.owner@example.com');
    const anotherUser = await createUser('orders.another@example.com');
    const address = await createAddress(owner.id);
    const product = await createProduct();
    const order = await createOrder({
      userId: owner.id,
      addressId: address.id,
      productId: product.id,
    });

    const response = await app.inject({
      method: 'GET',
      url: `/api/orders/${order.id}`,
      headers: {
        authorization: authHeader(anotherUser.id),
      },
    });

    const body = response.json();

    expect(response.statusCode).toBe(404);
    expect(body).toEqual({
      success: false,
      error: {
        code: 'ORDER_NOT_FOUND',
        message: 'Order not found.',
      },
    });
  });

  it('should cancel a pending order and restore product stock', async () => {
    const user = await createUser();
    const address = await createAddress(user.id);
    const product = await createProduct(8);
    const order = await createOrder({
      userId: user.id,
      addressId: address.id,
      productId: product.id,
      status: 'PENDING',
    });

    const response = await app.inject({
      method: 'PATCH',
      url: `/api/orders/${order.id}/cancel`,
      headers: {
        authorization: authHeader(user.id),
      },
    });

    const body = response.json();

    expect(response.statusCode).toBe(200);
    expect(body.success).toBe(true);
    expect(body.data).toEqual(
      expect.objectContaining({
        id: order.id,
        status: 'CANCELED',
        paymentStatus: 'PENDING',
        addressId: address.id,
        canceledAt: expect.any(String),
        createdAt: expect.any(String),
        updatedAt: expect.any(String),
      }),
    );

    const updatedProduct = await prisma.product.findUniqueOrThrow({
      where: {
        id: product.id,
      },
    });

    expect(updatedProduct.stock).toBe(10);
  });

  it('should not cancel an order that is not pending', async () => {
    const user = await createUser();
    const address = await createAddress(user.id);
    const product = await createProduct();
    const order = await createOrder({
      userId: user.id,
      addressId: address.id,
      productId: product.id,
      status: 'PAID',
    });

    const response = await app.inject({
      method: 'PATCH',
      url: `/api/orders/${order.id}/cancel`,
      headers: {
        authorization: authHeader(user.id),
      },
    });

    const body = response.json();

    expect(response.statusCode).toBe(400);
    expect(body).toEqual({
      success: false,
      error: {
        code: 'ORDER_CANNOT_BE_CANCELED',
        message: 'Order cannot be canceled.',
      },
    });
  });


  it('should create an order, debit stock, clear cart and save snapshots', async () => {
    const user = await createUser();
    const address = await createAddress(user.id);
    const product = await createProduct(8);

    await prisma.cartItem.create({
      data: {
        userId: user.id,
        productId: product.id,
        quantity: 2,
      },
    });

    mockShippingOptions();

    const response = await app.inject({
      method: 'POST',
      url: '/api/orders',
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

    const updatedProduct = await prisma.product.findUniqueOrThrow({
      where: {
        id: product.id,
      },
    });

    const cartItemsCount = await prisma.cartItem.count({
      where: {
        userId: user.id,
      },
    });

    const storedOrder = await prisma.order.findUniqueOrThrow({
      where: {
        id: body.data.id,
      },
      include: {
        items: true,
      },
    });

    expect(response.statusCode).toBe(201);
    expect(body.success).toBe(true);
    expect(body.data).toEqual(
      expect.objectContaining({
        id: expect.any(String),
        status: 'PENDING',
        paymentStatus: 'PENDING',
        paymentMethod: 'PIX',
        addressId: address.id,
        coupon: null,
        createdAt: expect.any(String),
      }),
    );

    expect(body.data.address).toEqual({
      zipCode: '32073000',
      street: 'Rua Laranjal',
      number: '123',
      complement: 'Apto 1',
      neighborhood: 'Industrial São Luiz',
      city: 'Contagem',
      state: 'MG',
      country: 'Brazil',
      recipientName: 'Orders Customer',
      recipientPhone: '31999999999',
    });

    expect(body.data.shipping).toEqual({
      provider: 'MELHOR_ENVIO',
      serviceCode: '1',
      serviceName: 'PAC',
      priceInCents: 2000,
      deadlineDays: 5,
    });

    expect(body.data.items).toHaveLength(1);
    expect(body.data.items[0]).toEqual(
      expect.objectContaining({
        productId: product.id,
        productName: 'Controle Xbox Series',
        productSku: expect.any(String),
        quantity: 2,
        unitPriceInCents: 39990,
        unitDiscountInCents: 5000,
        subtotalInCents: 79980,
        discountInCents: 10000,
        totalInCents: 69980,
      }),
    );

    expect(body.data.summary).toEqual({
      itemsCount: 1,
      totalQuantity: 2,
      subtotalInCents: 79980,
      discountInCents: 10000,
      shippingInCents: 2000,
      couponDiscountInCents: 0,
      totalInCents: 71980,
    });

    expect(updatedProduct.stock).toBe(6);
    expect(updatedProduct.salesCount).toBe(2);
    expect(cartItemsCount).toBe(0);
    expect(storedOrder.addressZipCode).toBe('32073000');
    expect(storedOrder.addressStreet).toBe('Rua Laranjal');
    expect(storedOrder.items).toHaveLength(1);
    expect(storedOrder.items[0].productId).toBe(product.id);
  });

  it('should not create an order using another user address', async () => {
    const user = await createUser();
    const otherUser = await createUser('orders.address.owner@example.com');
    const otherAddress = await createAddress(otherUser.id);
    const product = await createProduct(8);

    await prisma.cartItem.create({
      data: {
        userId: user.id,
        productId: product.id,
        quantity: 1,
      },
    });

    const response = await app.inject({
      method: 'POST',
      url: '/api/orders',
      headers: {
        authorization: authHeader(user.id),
      },
      payload: {
        addressId: otherAddress.id,
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

  it('should update paid order status as admin', async () => {
    const admin = await createUser('orders.admin@example.com');
    const user = await createUser();
    const address = await createAddress(user.id);
    const product = await createProduct();

    const order = await createOrder({
      userId: user.id,
      addressId: address.id,
      productId: product.id,
      status: 'PAID',
    });

    await prisma.order.update({
      where: {
        id: order.id,
      },
      data: {
        paymentStatus: 'PAID',
      },
    });

    const response = await app.inject({
      method: 'PATCH',
      url: `/api/orders/${order.id}/status`,
      headers: {
        authorization: adminAuthHeader(admin.id),
      },
      payload: {
        status: 'PROCESSING',
      },
    });

    const body = response.json();

    const updatedOrder = await prisma.order.findUniqueOrThrow({
      where: {
        id: order.id,
      },
    });

    expect(response.statusCode).toBe(200);
    expect(body.success).toBe(true);
    expect(body.data.id).toBe(order.id);
    expect(body.data.status).toBe('PROCESSING');
    expect(body.data.paymentStatus).toBe('PAID');
    expect(body.data.tracking.processingAt).toEqual(expect.any(String));
    expect(updatedOrder.status).toBe('PROCESSING');
    expect(updatedOrder.processingAt).not.toBeNull();
  });

  it('should not update order status when user is customer', async () => {
    const user = await createUser();
    const address = await createAddress(user.id);
    const product = await createProduct();

    const order = await createOrder({
      userId: user.id,
      addressId: address.id,
      productId: product.id,
      status: 'PAID',
    });

    await prisma.order.update({
      where: {
        id: order.id,
      },
      data: {
        paymentStatus: 'PAID',
      },
    });

    const response = await app.inject({
      method: 'PATCH',
      url: `/api/orders/${order.id}/status`,
      headers: {
        authorization: authHeader(user.id),
      },
      payload: {
        status: 'PROCESSING',
      },
    });

    expect(response.statusCode).toBe(403);
  });

  it('should require tracking code when shipping an order', async () => {
    const admin = await createUser('orders.shipping.admin@example.com');
    const user = await createUser();
    const address = await createAddress(user.id);
    const product = await createProduct();

    const order = await createOrder({
      userId: user.id,
      addressId: address.id,
      productId: product.id,
      status: 'SEPARATED',
    });

    await prisma.order.update({
      where: {
        id: order.id,
      },
      data: {
        paymentStatus: 'PAID',
      },
    });

    const response = await app.inject({
      method: 'PATCH',
      url: `/api/orders/${order.id}/status`,
      headers: {
        authorization: adminAuthHeader(admin.id),
      },
      payload: {
        status: 'SHIPPED',
      },
    });

    const body = response.json();

    expect(response.statusCode).toBe(400);
    expect(body).toEqual({
      success: false,
      error: {
        code: 'TRACKING_CODE_REQUIRED',
        message: 'Tracking code is required to ship the order.',
      },
    });
  });

  it('should not create an order when cart is empty', async () => {
    const user = await createUser();
    const address = await createAddress(user.id);

    const response = await app.inject({
      method: 'POST',
      url: '/api/orders',
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

  it('should not create an order with coupon while coupons are not implemented', async () => {
    const user = await createUser();
    const address = await createAddress(user.id);

    const response = await app.inject({
      method: 'POST',
      url: '/api/orders',
      headers: {
        authorization: authHeader(user.id),
      },
      payload: {
        addressId: address.id,
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
});
