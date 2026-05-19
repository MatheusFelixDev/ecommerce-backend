import { createHmac } from 'node:crypto';

import type { FastifyInstance } from 'fastify';
import {
  afterAll,
  afterEach,
  beforeAll,
  beforeEach,
  describe,
  expect,
  it,
  vi,
} from 'vitest';

import {
  OrderStatus,
  PaymentMethod,
  PaymentProvider,
  PaymentStatus,
  PaymentTransactionStatus,
  UserRole,
} from '../../src/generated/prisma/client';
import { env } from '../../src/config/env';
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

type TestAddress = {
  id: string;
};

type TestOrder = {
  id: string;
};

type ProcessPaymentResponse = {
  paymentId: string;
  orderId: string;
  provider: PaymentProvider;
  status: PaymentTransactionStatus;
  paymentUrl: string;
  providerPaymentId: string | null;
  providerPreferenceId: string | null;
  amountInCents: number;
  currency: string;
  createdAt: string;
};

describe('Payments routes', () => {
  let app: FastifyInstance;

  const mercadoPagoWebhookSecret = 'test-webhook-secret';

  beforeAll(async () => {
    app = await buildTestApp();
  });

  beforeEach(async () => {
    await clearDatabase();

    env.mercadoPagoEnabled = true;
    env.mercadoPagoBaseUrl = 'https://api.mercadopago.test';
    env.mercadoPagoAccessToken = 'TEST_ACCESS_TOKEN';
    env.mercadoPagoSuccessUrl = 'https://example.com/success';
    env.mercadoPagoFailureUrl = 'https://example.com/failure';
    env.mercadoPagoPendingUrl = 'https://example.com/pending';
    env.mercadoPagoNotificationUrl =
      'https://example.com/webhooks/mercado-pago';
    env.mercadoPagoWebhookSecret = mercadoPagoWebhookSecret;
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  afterAll(async () => {
    await app.close();
    await disconnectDatabase();
  });

  async function createUser(
    email = 'payments.customer@example.com',
  ): Promise<TestUser> {
    return prisma.user.create({
      data: {
        name: 'Payments Customer',
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
        recipientName: 'Payments Customer',
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

  async function createOrder(
    userId: string,
    addressId: string,
    overrides: Partial<{
      status: OrderStatus;
      paymentStatus: PaymentStatus;
      paymentMethod: PaymentMethod | null;
      totalInCents: number;
      canceledAt: Date | null;
    }> = {},
  ): Promise<TestOrder> {
    return prisma.order.create({
      data: {
        userId,
        addressId,
        status: overrides.status ?? OrderStatus.PENDING,
        paymentStatus:
          overrides.paymentStatus ?? PaymentStatus.PENDING,
        paymentMethod:
          overrides.paymentMethod ?? PaymentMethod.PIX,
        itemsCount: 1,
        totalQuantity: 1,
        subtotalInCents: 10000,
        discountInCents: 0,
        totalInCents: overrides.totalInCents ?? 10000,
        shippingPriceInCents: 0,
        couponDiscountInCents: 0,
        addressZipCode: '32073000',
        addressStreet: 'Rua Laranjal',
        addressNumber: '100',
        addressNeighborhood: 'Industrial São Luiz',
        addressCity: 'Contagem',
        addressState: 'MG',
        addressCountry: 'Brazil',
        recipientName: 'Payments Customer',
        recipientPhone: '31999999999',
        canceledAt: overrides.canceledAt,
      },
    });
  }

  function authorizationFor(userId: string): string {
    return buildAuthorizationHeader(app, {
      userId,
      role: UserRole.CUSTOMER,
    });
  }

  function mockCreatePreferenceSuccess(
    preferenceId = 'preference-test-123',
  ): void {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue({
        ok: true,
        json: async () => ({
          id: preferenceId,
          sandbox_init_point:
            'https://mercadopago.test/checkout/preference-test-123',
        }),
      }),
    );
  }

  function mockGetPaymentSuccess(data: {
    providerPaymentId: string;
    providerPreferenceId: string;
    orderId: string;
    status: string;
    statusDetail?: string;
    transactionAmount?: number;
    dateApproved?: string | null;
  }): void {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue({
        ok: true,
        json: async () => ({
          id: data.providerPaymentId,
          preference_id: data.providerPreferenceId,
          external_reference: data.orderId,
          status: data.status,
          status_detail: data.statusDetail ?? null,
          transaction_amount: data.transactionAmount ?? 100,
          date_approved: data.dateApproved ?? null,
          date_last_updated: data.dateApproved ?? null,
        }),
      }),
    );
  }

  function buildMercadoPagoSignature(data: {
    dataId: string;
    requestId: string;
    timestamp: string;
  }): string {
    const manifest = `id:${data.dataId.toLowerCase()};request-id:${data.requestId};ts:${data.timestamp};`;

    const signature = createHmac(
      'sha256',
      mercadoPagoWebhookSecret,
    )
      .update(manifest)
      .digest('hex');

    return `ts=${data.timestamp},v1=${signature}`;
  }

  it('should process payment for authenticated user order', async () => {
    const user = await createUser();
    const address = await createAddress(user.id);
    const order = await createOrder(user.id, address.id);
    const authorization = authorizationFor(user.id);

    mockCreatePreferenceSuccess();

    const response = await app.inject({
      method: 'POST',
      url: `/api/payments/orders/${order.id}/process`,
      headers: {
        authorization,
      },
    });

    const body = response.json();
    const payment = body.data as ProcessPaymentResponse;

    const storedPayment = await prisma.payment.findFirst({
      where: {
        orderId: order.id,
      },
    });

    expect(response.statusCode).toBe(201);
    expect(body.success).toBe(true);
    expect(payment.orderId).toBe(order.id);
    expect(payment.provider).toBe(PaymentProvider.MERCADO_PAGO);
    expect(payment.providerPreferenceId).toBe(
      'preference-test-123',
    );
    expect(payment.providerPaymentId).toBeNull();
    expect(payment.status).toBe(PaymentTransactionStatus.PENDING);
    expect(payment.amountInCents).toBe(10000);
    expect(payment.currency).toBe('BRL');
    expect(payment.paymentUrl).toBe(
      'https://mercadopago.test/checkout/preference-test-123',
    );
    expect(storedPayment).not.toBeNull();
    expect(storedPayment?.orderId).toBe(order.id);
  });

  it('should not process payment without token', async () => {
    const response = await app.inject({
      method: 'POST',
      url: '/api/payments/orders/00000000-0000-0000-0000-000000000000/process',
    });

    expect(response.statusCode).toBe(401);
  });

  it('should not process payment when order does not exist', async () => {
    const user = await createUser();
    const authorization = authorizationFor(user.id);

    const response = await app.inject({
      method: 'POST',
      url: '/api/payments/orders/00000000-0000-0000-0000-000000000000/process',
      headers: {
        authorization,
      },
    });

    expect(response.statusCode).toBe(404);
  });

  it('should not process payment from another user order', async () => {
    const user = await createUser();
    const otherUser = await createUser('other.payments@example.com');
    const otherAddress = await createAddress(otherUser.id);
    const otherOrder = await createOrder(
      otherUser.id,
      otherAddress.id,
    );

    const authorization = authorizationFor(user.id);

    const response = await app.inject({
      method: 'POST',
      url: `/api/payments/orders/${otherOrder.id}/process`,
      headers: {
        authorization,
      },
    });

    expect(response.statusCode).toBe(404);
  });

  it('should not process payment when order is not payable', async () => {
    const user = await createUser();
    const address = await createAddress(user.id);
    const order = await createOrder(user.id, address.id, {
      status: OrderStatus.PAID,
      paymentStatus: PaymentStatus.PAID,
    });

    const authorization = authorizationFor(user.id);

    const response = await app.inject({
      method: 'POST',
      url: `/api/payments/orders/${order.id}/process`,
      headers: {
        authorization,
      },
    });

    expect(response.statusCode).toBe(400);
  });

  it('should not process payment when order already has active payment', async () => {
    const user = await createUser();
    const address = await createAddress(user.id);
    const order = await createOrder(user.id, address.id);

    await prisma.payment.create({
      data: {
        orderId: order.id,
        provider: PaymentProvider.MERCADO_PAGO,
        providerPreferenceId: 'existing-preference',
        method: PaymentMethod.PIX,
        status: PaymentTransactionStatus.PENDING,
        amountInCents: 10000,
        currency: 'BRL',
        paymentUrl: 'https://mercadopago.test/existing',
      },
    });

    const authorization = authorizationFor(user.id);

    const response = await app.inject({
      method: 'POST',
      url: `/api/payments/orders/${order.id}/process`,
      headers: {
        authorization,
      },
    });

    expect(response.statusCode).toBe(409);
  });

  it('should reject Mercado Pago webhook without signature', async () => {
    const response = await app.inject({
      method: 'POST',
      url: '/api/payments/webhooks/mercado-pago',
      payload: {
        type: 'payment',
        data: {
          id: 'payment-123',
        },
      },
    });

    expect(response.statusCode).toBe(401);
  });

  it('should process valid Mercado Pago approved payment webhook', async () => {
    const user = await createUser();
    const address = await createAddress(user.id);
    const order = await createOrder(user.id, address.id);

    await prisma.payment.create({
      data: {
        orderId: order.id,
        provider: PaymentProvider.MERCADO_PAGO,
        providerPreferenceId: 'preference-approved-123',
        method: PaymentMethod.PIX,
        status: PaymentTransactionStatus.PENDING,
        amountInCents: 10000,
        currency: 'BRL',
        paymentUrl: 'https://mercadopago.test/preference-approved-123',
      },
    });

    const providerPaymentId = 'payment-approved-123';
    const requestId = 'request-approved-123';
    const timestamp = '1710000000';

    mockGetPaymentSuccess({
      providerPaymentId,
      providerPreferenceId: 'preference-approved-123',
      orderId: order.id,
      status: 'approved',
      statusDetail: 'accredited',
      transactionAmount: 100,
      dateApproved: '2026-05-19T20:00:00.000Z',
    });

    const response = await app.inject({
      method: 'POST',
      url: '/api/payments/webhooks/mercado-pago',
      headers: {
        'x-request-id': requestId,
        'x-signature': buildMercadoPagoSignature({
          dataId: providerPaymentId,
          requestId,
          timestamp,
        }),
      },
      payload: {
        type: 'payment',
        data: {
          id: providerPaymentId,
        },
      },
    });

    const body = response.json();

    const updatedOrder = await prisma.order.findUniqueOrThrow({
      where: {
        id: order.id,
      },
    });

    const updatedPayment = await prisma.payment.findFirstOrThrow({
      where: {
        orderId: order.id,
      },
    });

    expect(response.statusCode).toBe(200);
    expect(body.success).toBe(true);
    expect(body.data.received).toBe(true);
    expect(body.data.processed).toBe(true);
    expect(body.data.orderId).toBe(order.id);
    expect(body.data.providerPaymentId).toBe(providerPaymentId);
    expect(body.data.paymentStatus).toBe(
      PaymentTransactionStatus.PAID,
    );
    expect(body.data.orderPaymentStatus).toBe(PaymentStatus.PAID);
    expect(body.data.orderStatus).toBe(OrderStatus.PAID);
    expect(updatedOrder.paymentStatus).toBe(PaymentStatus.PAID);
    expect(updatedOrder.status).toBe(OrderStatus.PAID);
    expect(updatedPayment.status).toBe(
      PaymentTransactionStatus.PAID,
    );
    expect(updatedPayment.providerPaymentId).toBe(providerPaymentId);
    expect(updatedPayment.paidAt).not.toBeNull();
  });
});
