import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { env } from '../../src/config/env';
import { MelhorEnvioShippingProvider } from '../../src/modules/checkout/providers/melhor-envio-shipping.provider';

describe('MelhorEnvioShippingProvider', () => {
  let provider: MelhorEnvioShippingProvider;

  beforeEach(() => {
    provider = new MelhorEnvioShippingProvider();

    env.melhorEnvioEnabled = true;
    env.melhorEnvioBaseUrl = 'https://melhorenvio.test';
    env.melhorEnvioAccessToken = 'TEST_SHIPPING_TOKEN';
    env.melhorEnvioUserAgent = 'ecommerce-backend-tests';
    env.melhorEnvioOriginZipCode = '32073000';
  });

  afterEach(() => {
    vi.unstubAllGlobals();
    vi.useRealTimers();
  });

  function validRequest() {
    return {
      to: {
        zipCode: '30140-071',
      },
      products: [
        {
          id: 'product-1',
          name: 'Produto de teste',
          quantity: 2,
          priceInCents: 5000,
          weightInGrams: 500,
          widthCm: 15,
          heightCm: 10,
          lengthCm: 20,
        },
      ],
    };
  }

  it('should reject when provider is disabled', async () => {
    env.melhorEnvioEnabled = false;

    await expect(provider.calculate(validRequest())).rejects.toMatchObject({
      statusCode: 500,
      code: 'SHIPPING_PROVIDER_DISABLED',
    });
  });

  it('should calculate shipping with sanitized zip codes and valid payload', async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => [
        {
          id: 1,
          name: 'PAC',
          custom_price: '20.50',
          custom_delivery_time: 5,
        },
      ],
    });

    vi.stubGlobal('fetch', fetchMock);

    const result = await provider.calculate(validRequest());

    expect(result).toEqual([
      {
        provider: 'MELHOR_ENVIO',
        serviceCode: '1',
        serviceName: 'PAC',
        priceInCents: 2050,
        deadlineDays: 5,
      },
    ]);

    const [url, init] = fetchMock.mock.calls[0] as [string, RequestInit];
    const body = JSON.parse(String(init.body));

    expect(url).toBe('https://melhorenvio.test/api/v2/me/shipment/calculate');
    expect(init.headers).toMatchObject({
      Accept: 'application/json',
      'Content-Type': 'application/json',
      Authorization: 'Bearer TEST_SHIPPING_TOKEN',
      'User-Agent': 'ecommerce-backend-tests',
    });
    expect(body.from.postal_code).toBe('32073000');
    expect(body.to.postal_code).toBe('30140071');
    expect(body.products).toEqual([
      {
        id: 'product-1',
        width: 15,
        height: 10,
        length: 20,
        weight: 0.5,
        insurance_value: 50,
        quantity: 2,
      },
    ]);
  });

  it('should reject invalid product physical data', async () => {
    const request = validRequest();

    request.products[0].weightInGrams = 0;

    await expect(provider.calculate(request)).rejects.toMatchObject({
      statusCode: 400,
      code: 'PRODUCT_SHIPPING_DATA_INVALID',
    });
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
      provider.calculate(validRequest()),
    ).rejects.toMatchObject({
      statusCode: 504,
      code: 'SHIPPING_PROVIDER_TIMEOUT',
    });

    await vi.advanceTimersByTimeAsync(10_000);

    await assertion;
  });
});
