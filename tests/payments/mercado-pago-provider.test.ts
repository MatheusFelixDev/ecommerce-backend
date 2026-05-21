import { createHmac } from 'node:crypto';

import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { env } from '../../src/config/env';
import { MercadoPagoPaymentProvider } from '../../src/modules/payments/providers/mercado-pago-payment.provider';

describe('MercadoPagoPaymentProvider', () => {
  let provider: MercadoPagoPaymentProvider;
  const webhookSecret = 'test-webhook-secret';

  beforeEach(() => {
    provider = new MercadoPagoPaymentProvider();

    env.mercadoPagoEnabled = true;
    env.mercadoPagoBaseUrl = 'https://api.mercadopago.test';
    env.mercadoPagoAccessToken = 'TEST_ACCESS_TOKEN';
    env.mercadoPagoPublicKey = 'TEST_PUBLIC_KEY';
    env.mercadoPagoWebhookSecret = webhookSecret;
    env.mercadoPagoSuccessUrl = 'https://frontend.test/payment/success';
    env.mercadoPagoFailureUrl = 'https://frontend.test/payment/failure';
    env.mercadoPagoPendingUrl = 'https://frontend.test/payment/pending';
    env.mercadoPagoNotificationUrl =
      'https://api.test/api/payments/webhooks/mercado-pago';
  });

  afterEach(() => {
    vi.unstubAllGlobals();
    vi.useRealTimers();
  });

  function validPreferenceRequest() {
    return {
      orderId: 'order-1',
      paymentMethod: 'PIX' as const,
      amountInCents: 10000,
      payer: {
        name: 'Customer Test',
        email: 'customer@example.com',
      },
      items: [
        {
          id: 'item-1',
          title: 'Produto de teste',
          quantity: 2,
          unitPriceInCents: 5000,
        },
      ],
    };
  }

  function buildSignature(data: {
    dataId: string;
    requestId: string;
    timestamp: string;
  }): string {
    const manifest = `id:${data.dataId.toLowerCase()};request-id:${data.requestId};ts:${data.timestamp};`;
    const signature = createHmac('sha256', webhookSecret)
      .update(manifest)
      .digest('hex');

    return `ts=${data.timestamp},v1=${signature}`;
  }

  it('should reject when provider is disabled', async () => {
    env.mercadoPagoEnabled = false;

    await expect(
      provider.createPreference(validPreferenceRequest()),
    ).rejects.toMatchObject({
      statusCode: 500,
      code: 'PAYMENT_PROVIDER_DISABLED',
    });
  });

  it('should create preference with external reference and safe metadata', async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({
        id: 'preference-1',
        sandbox_init_point: 'https://mercadopago.test/preference-1',
      }),
    });

    vi.stubGlobal('fetch', fetchMock);

    const result = await provider.createPreference(validPreferenceRequest());

    expect(result).toEqual({
      provider: 'MERCADO_PAGO',
      providerPreferenceId: 'preference-1',
      status: 'PENDING',
      paymentUrl: 'https://mercadopago.test/preference-1',
      rawStatus: 'created',
    });

    const [url, init] = fetchMock.mock.calls[0] as [string, RequestInit];
    const body = JSON.parse(String(init.body));

    expect(url).toBe('https://api.mercadopago.test/checkout/preferences');
    expect(init.headers).toMatchObject({
      Accept: 'application/json',
      'Content-Type': 'application/json',
      Authorization: 'Bearer TEST_ACCESS_TOKEN',
    });
    expect(body.external_reference).toBe('order-1');
    expect(body.notification_url).toBe(
      'https://api.test/api/payments/webhooks/mercado-pago',
    );
    expect(body.back_urls).toEqual({
      success: 'https://frontend.test/payment/success',
      failure: 'https://frontend.test/payment/failure',
      pending: 'https://frontend.test/payment/pending',
    });
    expect(body.metadata).toEqual({
      order_id: 'order-1',
      payment_method: 'PIX',
      amount_in_cents: 10000,
    });
    expect(JSON.stringify(body.metadata)).not.toContain('TEST_ACCESS_TOKEN');
  });

  it('should reject invalid webhook signature', () => {
    expect(() =>
      provider.validateWebhookSignature({
        dataId: 'payment-1',
        xRequestId: 'request-1',
        xSignature: 'ts=1710000000,v1=invalid',
      }),
    ).toThrowError();
  });

  it('should accept valid webhook signature', () => {
    const dataId = 'payment-1';
    const requestId = 'request-1';
    const timestamp = '1710000000';

    expect(() =>
      provider.validateWebhookSignature({
        dataId,
        xRequestId: requestId,
        xSignature: buildSignature({
          dataId,
          requestId,
          timestamp,
        }),
      }),
    ).not.toThrow();
  });

  it('should return controlled error when provider request times out', async () => {
    vi.useFakeTimers();

    const fetchMock = vi.fn((_url: string, init?: RequestInit) => {
      return new Promise((_resolve, reject) => {
        init?.signal?.addEventListener('abort', () => {
          reject(new DOMException('Aborted', 'AbortError'));
        });
      });
    });

    vi.stubGlobal('fetch', fetchMock);

    const assertion = expect(
      provider.createPreference(validPreferenceRequest()),
    ).rejects.toMatchObject({
      statusCode: 504,
      code: 'PAYMENT_PROVIDER_TIMEOUT',
    });

    await vi.advanceTimersByTimeAsync(10_000);

    await assertion;
  });
});
