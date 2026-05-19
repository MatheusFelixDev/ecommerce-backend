import type { FastifyInstance } from 'fastify';
import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest';

import {
  OrderStatus,
  PaymentStatus,
  UserRole,
} from '../../src/generated/prisma/client';
import { prisma } from '../../src/infra/prisma/client';
import { buildAuthorizationHeader } from '../helpers/auth-test-helper';
import { buildTestApp } from '../helpers/build-test-app';
import {
  clearDatabase,
  disconnectDatabase,
} from '../helpers/database-test-helper';

type TestUser = {
  id: string;
  email: string;
};

type TestCategory = {
  id: string;
};

type TestProduct = {
  id: string;
};

type TestAddress = {
  id: string;
};

type TestOrder = {
  id: string;
};

describe('Admin routes', () => {
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
    email = 'admin.customer@example.com',
    overrides: Partial<{
      name: string;
      role: UserRole;
      isActive: boolean;
    }> = {},
  ): Promise<TestUser> {
    return prisma.user.create({
      data: {
        name: overrides.name ?? 'Admin Test User',
        email,
        passwordHash: 'hashed-password-for-tests',
        role: overrides.role ?? UserRole.CUSTOMER,
        isActive: overrides.isActive ?? true,
      },
    });
  }

  async function createAdmin(
    email = 'admin.owner@example.com',
  ): Promise<TestUser> {
    return createUser(email, {
      name: 'Admin Owner',
      role: UserRole.ADMIN,
    });
  }

  function adminAuthorizationFor(adminId: string): string {
    return buildAuthorizationHeader(app, {
      userId: adminId,
      role: UserRole.ADMIN,
    });
  }

  function customerAuthorizationFor(customerId: string): string {
    return buildAuthorizationHeader(app, {
      userId: customerId,
      role: UserRole.CUSTOMER,
    });
  }

  async function createCategory(): Promise<TestCategory> {
    return prisma.category.create({
      data: {
        name: 'Admin Category',
        slug: 'admin-category',
        description: 'Categoria para testes admin.',
      },
    });
  }

  async function createProduct(
    categoryId: string,
    overrides: Partial<{
      name: string;
      slug: string;
      sku: string;
      stock: number;
      salesCount: number;
    }> = {},
  ): Promise<TestProduct> {
    return prisma.product.create({
      data: {
        categoryId,
        name: overrides.name ?? 'Produto Admin',
        slug: overrides.slug ?? 'produto-admin',
        description: 'Produto usado em testes admin.',
        sku: overrides.sku ?? 'PROD-ADMIN',
        priceInCents: 10000,
        discountInCents: 0,
        stock: overrides.stock ?? 10,
        salesCount: overrides.salesCount ?? 0,
        status: 'ACTIVE',
        isActive: true,
      },
    });
  }

  async function createAddress(userId: string): Promise<TestAddress> {
    return prisma.address.create({
      data: {
        userId,
        label: 'Casa',
        recipientName: 'Cliente Admin',
        phone: '31999999999',
        zipCode: '32073000',
        street: 'Rua Laranjal',
        number: '100',
        neighborhood: 'Industrial São Luiz',
        city: 'Contagem',
        state: 'MG',
        country: 'Brazil',
        isMain: true,
      },
    });
  }

  async function createOrderWithItem(data: {
    userId: string;
    addressId: string;
    productId: string;
    status?: OrderStatus;
    paymentStatus?: PaymentStatus;
    quantity?: number;
    totalInCents?: number;
  }): Promise<TestOrder> {
    const quantity = data.quantity ?? 2;
    const unitPriceInCents = 10000;
    const totalInCents =
      data.totalInCents ?? quantity * unitPriceInCents;

    return prisma.order.create({
      data: {
        userId: data.userId,
        addressId: data.addressId,
        status: data.status ?? OrderStatus.PENDING,
        paymentStatus: data.paymentStatus ?? PaymentStatus.PENDING,
        paymentMethod: 'PIX',
        itemsCount: 1,
        totalQuantity: quantity,
        subtotalInCents: totalInCents,
        discountInCents: 0,
        totalInCents,
        shippingPriceInCents: 0,
        couponDiscountInCents: 0,
        addressZipCode: '32073000',
        addressStreet: 'Rua Laranjal',
        addressNumber: '100',
        addressNeighborhood: 'Industrial São Luiz',
        addressCity: 'Contagem',
        addressState: 'MG',
        addressCountry: 'Brazil',
        recipientName: 'Cliente Admin',
        recipientPhone: '31999999999',
        items: {
          create: {
            productId: data.productId,
            productName: 'Produto Admin',
            productSlug: 'produto-admin',
            productSku: 'PROD-ADMIN',
            quantity,
            unitPriceInCents,
            unitDiscountInCents: 0,
            subtotalInCents: totalInCents,
            discountInCents: 0,
            totalInCents,
          },
        },
      },
    });
  }

  it('should block admin users list for customer', async () => {
    const customer = await createUser();
    const authorization = customerAuthorizationFor(customer.id);

    const response = await app.inject({
      method: 'GET',
      url: '/api/admin/users',
      headers: {
        authorization,
      },
    });

    expect(response.statusCode).toBe(403);
  });

  it('should list users as admin with pagination metadata', async () => {
    const admin = await createAdmin();
    await createUser('admin.customer.one@example.com', {
      name: 'Customer One',
    });
    await createUser('admin.customer.two@example.com', {
      name: 'Customer Two',
    });

    const response = await app.inject({
      method: 'GET',
      url: '/api/admin/users?page=1&perPage=10',
      headers: {
        authorization: adminAuthorizationFor(admin.id),
      },
    });

    const body = response.json();

    expect(response.statusCode).toBe(200);
    expect(body.success).toBe(true);
    expect(body.data).toHaveLength(3);
    expect(body.meta).toEqual({
      page: 1,
      perPage: 10,
      total: 3,
      totalPages: 1,
    });
  });

  it('should get user by id as admin', async () => {
    const admin = await createAdmin();
    const customer = await createUser('get.user.admin@example.com', {
      name: 'Customer Details',
    });

    const response = await app.inject({
      method: 'GET',
      url: `/api/admin/users/${customer.id}`,
      headers: {
        authorization: adminAuthorizationFor(admin.id),
      },
    });

    const body = response.json();

    expect(response.statusCode).toBe(200);
    expect(body.success).toBe(true);
    expect(body.data.id).toBe(customer.id);
    expect(body.data.email).toBe(customer.email);
    expect(body.data.name).toBe('Customer Details');
  });

  it('should update user status as admin', async () => {
    const admin = await createAdmin();
    const customer = await createUser('block.user.admin@example.com');

    const response = await app.inject({
      method: 'PATCH',
      url: `/api/admin/users/${customer.id}/status`,
      headers: {
        authorization: adminAuthorizationFor(admin.id),
      },
      payload: {
        isActive: false,
      },
    });

    const body = response.json();

    const updatedUser = await prisma.user.findUniqueOrThrow({
      where: {
        id: customer.id,
      },
    });

    expect(response.statusCode).toBe(200);
    expect(body.success).toBe(true);
    expect(body.data.id).toBe(customer.id);
    expect(body.data.isActive).toBe(false);
    expect(updatedUser.isActive).toBe(false);
  });

  it('should not allow admin to block own account', async () => {
    const admin = await createAdmin();

    const response = await app.inject({
      method: 'PATCH',
      url: `/api/admin/users/${admin.id}/status`,
      headers: {
        authorization: adminAuthorizationFor(admin.id),
      },
      payload: {
        isActive: false,
      },
    });

    expect(response.statusCode).toBe(400);
  });

  it('should update user role as admin', async () => {
    const admin = await createAdmin();
    const customer = await createUser('promote.user.admin@example.com');

    const response = await app.inject({
      method: 'PATCH',
      url: `/api/admin/users/${customer.id}/role`,
      headers: {
        authorization: adminAuthorizationFor(admin.id),
      },
      payload: {
        role: 'ADMIN',
      },
    });

    const body = response.json();

    const updatedUser = await prisma.user.findUniqueOrThrow({
      where: {
        id: customer.id,
      },
    });

    expect(response.statusCode).toBe(200);
    expect(body.success).toBe(true);
    expect(body.data.id).toBe(customer.id);
    expect(body.data.role).toBe(UserRole.ADMIN);
    expect(updatedUser.role).toBe(UserRole.ADMIN);
  });

  it('should not allow admin to remove own admin role', async () => {
    const admin = await createAdmin();

    const response = await app.inject({
      method: 'PATCH',
      url: `/api/admin/users/${admin.id}/role`,
      headers: {
        authorization: adminAuthorizationFor(admin.id),
      },
      payload: {
        role: 'CUSTOMER',
      },
    });

    expect(response.statusCode).toBe(400);
  });

  it('should create manual stock adjustment as admin', async () => {
    const admin = await createAdmin();
    const category = await createCategory();
    const product = await createProduct(category.id, {
      stock: 10,
    });

    const response = await app.inject({
      method: 'POST',
      url: `/api/admin/products/${product.id}/stock-adjustments`,
      headers: {
        authorization: adminAuthorizationFor(admin.id),
      },
      payload: {
        quantityChange: 5,
        reason: 'Reposição manual de estoque.',
      },
    });

    const body = response.json();

    const updatedProduct = await prisma.product.findUniqueOrThrow({
      where: {
        id: product.id,
      },
    });

    expect(response.statusCode).toBe(201);
    expect(body.success).toBe(true);
    expect(body.data.productId).toBe(product.id);
    expect(body.data.adminUserId).toBe(admin.id);
    expect(body.data.type).toBe('MANUAL_ADJUSTMENT');
    expect(body.data.quantityChange).toBe(5);
    expect(body.data.stockBefore).toBe(10);
    expect(body.data.stockAfter).toBe(15);
    expect(updatedProduct.stock).toBe(15);
  });

  it('should not create stock adjustment resulting in negative stock', async () => {
    const admin = await createAdmin();
    const category = await createCategory();
    const product = await createProduct(category.id, {
      stock: 3,
    });

    const response = await app.inject({
      method: 'POST',
      url: `/api/admin/products/${product.id}/stock-adjustments`,
      headers: {
        authorization: adminAuthorizationFor(admin.id),
      },
      payload: {
        quantityChange: -4,
        reason: 'Ajuste inválido.',
      },
    });

    expect(response.statusCode).toBe(400);
  });

  it('should list stock movements as admin', async () => {
    const admin = await createAdmin();
    const category = await createCategory();
    const product = await createProduct(category.id, {
      stock: 10,
    });

    await app.inject({
      method: 'POST',
      url: `/api/admin/products/${product.id}/stock-adjustments`,
      headers: {
        authorization: adminAuthorizationFor(admin.id),
      },
      payload: {
        quantityChange: 5,
        reason: 'Reposição manual de estoque.',
      },
    });

    const response = await app.inject({
      method: 'GET',
      url: `/api/admin/products/${product.id}/stock-movements?page=1&perPage=10`,
      headers: {
        authorization: adminAuthorizationFor(admin.id),
      },
    });

    const body = response.json();

    expect(response.statusCode).toBe(200);
    expect(body.success).toBe(true);
    expect(body.data).toHaveLength(1);
    expect(body.data[0].productId).toBe(product.id);
    expect(body.data[0].type).toBe('MANUAL_ADJUSTMENT');
    expect(body.meta).toEqual({
      page: 1,
      perPage: 10,
      total: 1,
      totalPages: 1,
    });
  });

  it('should get low stock report as admin', async () => {
    const admin = await createAdmin();
    const category = await createCategory();

    await createProduct(category.id, {
      name: 'Produto Baixo Estoque',
      slug: 'produto-baixo-estoque',
      sku: 'PROD-LOW-STOCK',
      stock: 2,
    });

    await createProduct(category.id, {
      name: 'Produto Estoque Normal',
      slug: 'produto-estoque-normal',
      sku: 'PROD-NORMAL-STOCK',
      stock: 20,
    });

    const response = await app.inject({
      method: 'GET',
      url: '/api/admin/reports/low-stock?threshold=5&page=1&perPage=10',
      headers: {
        authorization: adminAuthorizationFor(admin.id),
      },
    });

    const body = response.json();

    expect(response.statusCode).toBe(200);
    expect(body.success).toBe(true);
    expect(body.data.threshold).toBe(5);
    expect(body.data.products).toHaveLength(1);
    expect(body.data.products[0].sku).toBe('PROD-LOW-STOCK');
    expect(body.meta.total).toBe(1);
  });

  it('should get sales report as admin', async () => {
    const admin = await createAdmin();
    const customer = await createUser('sales.report.customer@example.com');
    const address = await createAddress(customer.id);
    const category = await createCategory();
    const product = await createProduct(category.id);

    await createOrderWithItem({
      userId: customer.id,
      addressId: address.id,
      productId: product.id,
      status: OrderStatus.PAID,
      paymentStatus: PaymentStatus.PAID,
      quantity: 2,
      totalInCents: 20000,
    });

    const response = await app.inject({
      method: 'GET',
      url: '/api/admin/reports/sales?startDate=2000-01-01&endDate=2099-12-31',
      headers: {
        authorization: adminAuthorizationFor(admin.id),
      },
    });

    const body = response.json();

    expect(response.statusCode).toBe(200);
    expect(body.success).toBe(true);
    expect(body.data.ordersCount).toBe(1);
    expect(body.data.itemsCount).toBe(1);
    expect(body.data.totalQuantity).toBe(2);
    expect(body.data.revenueInCents).toBe(20000);
  });

  it('should get top products report as admin', async () => {
    const admin = await createAdmin();
    const customer = await createUser('top.products.customer@example.com');
    const address = await createAddress(customer.id);
    const category = await createCategory();
    const product = await createProduct(category.id);

    await createOrderWithItem({
      userId: customer.id,
      addressId: address.id,
      productId: product.id,
      status: OrderStatus.PAID,
      paymentStatus: PaymentStatus.PAID,
      quantity: 3,
      totalInCents: 30000,
    });

    const response = await app.inject({
      method: 'GET',
      url: '/api/admin/reports/top-products?startDate=2000-01-01&endDate=2099-12-31&limit=5',
      headers: {
        authorization: adminAuthorizationFor(admin.id),
      },
    });

    const body = response.json();

    expect(response.statusCode).toBe(200);
    expect(body.success).toBe(true);
    expect(body.data.products).toHaveLength(1);
    expect(body.data.products[0].productId).toBe(product.id);
    expect(body.data.products[0].quantitySold).toBe(3);
    expect(body.data.products[0].revenueInCents).toBe(30000);
  });

  it('should cancel pending order as admin and restore stock', async () => {
    const admin = await createAdmin();
    const customer = await createUser('cancel.order.customer@example.com');
    const address = await createAddress(customer.id);
    const category = await createCategory();
    const product = await createProduct(category.id, {
      stock: 5,
    });

    const order = await createOrderWithItem({
      userId: customer.id,
      addressId: address.id,
      productId: product.id,
      status: OrderStatus.PENDING,
      paymentStatus: PaymentStatus.PENDING,
      quantity: 2,
      totalInCents: 20000,
    });

    const response = await app.inject({
      method: 'PATCH',
      url: `/api/admin/orders/${order.id}/cancel`,
      headers: {
        authorization: adminAuthorizationFor(admin.id),
      },
    });

    const body = response.json();

    const updatedOrder = await prisma.order.findUniqueOrThrow({
      where: {
        id: order.id,
      },
    });

    const updatedProduct = await prisma.product.findUniqueOrThrow({
      where: {
        id: product.id,
      },
    });

    expect(response.statusCode).toBe(200);
    expect(body.success).toBe(true);
    expect(body.data.id).toBe(order.id);
    expect(body.data.status).toBe(OrderStatus.CANCELED);
    expect(updatedOrder.status).toBe(OrderStatus.CANCELED);
    expect(updatedOrder.canceledAt).not.toBeNull();
    expect(updatedProduct.stock).toBe(7);
  });
});
