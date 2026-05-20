import { describe, expect, it } from 'vitest';

import { loadEnv } from '../../src/config/env.schema';

function makeValidTestEnv(
  overrides: NodeJS.ProcessEnv = {},
): NodeJS.ProcessEnv {
  return {
    NODE_ENV: 'test',
    PORT: '3000',
    DATABASE_URL:
      'postgresql://postgres:postgres@localhost:5432/ecommerce_test_db',
    JWT_SECRET: 'test_jwt_secret_with_at_least_32_chars',
    JWT_EXPIRES_IN: '1d',
    CORS_ORIGINS: 'http://localhost:5173',

    MELHOR_ENVIO_ENABLED: 'false',
    MELHOR_ENVIO_BASE_URL: 'https://sandbox.melhorenvio.com.br',
    MELHOR_ENVIO_ACCESS_TOKEN: '',
    MELHOR_ENVIO_USER_AGENT:
      'ecommerce-backend-test (test@example.com)',
    MELHOR_ENVIO_ORIGIN_ZIP_CODE: '00000000',

    MERCADO_PAGO_ENABLED: 'false',
    MERCADO_PAGO_BASE_URL: 'https://api.mercadopago.com',
    MERCADO_PAGO_ACCESS_TOKEN: '',
    MERCADO_PAGO_PUBLIC_KEY: '',
    MERCADO_PAGO_WEBHOOK_SECRET: '',
    MERCADO_PAGO_SUCCESS_URL:
      'http://localhost:3000/payments/success',
    MERCADO_PAGO_FAILURE_URL:
      'http://localhost:3000/payments/failure',
    MERCADO_PAGO_PENDING_URL:
      'http://localhost:3000/payments/pending',
    MERCADO_PAGO_NOTIFICATION_URL:
      'http://localhost:3000/api/payments/webhooks/mercado-pago',
    ...overrides,
  };
}

function makeValidProductionEnv(
  overrides: NodeJS.ProcessEnv = {},
): NodeJS.ProcessEnv {
  return {
    NODE_ENV: 'production',
    PORT: '3000',
    DATABASE_URL:
      'postgresql://postgres:postgres@db.example.com:5432/ecommerce',
    JWT_SECRET: 'production_jwt_secret_with_32_chars',
    JWT_EXPIRES_IN: '1d',
    CORS_ORIGINS: 'https://seudominio.com',

    MELHOR_ENVIO_ENABLED: 'false',
    MELHOR_ENVIO_BASE_URL: 'https://www.melhorenvio.com.br',
    MELHOR_ENVIO_ACCESS_TOKEN: '',
    MELHOR_ENVIO_USER_AGENT: '',
    MELHOR_ENVIO_ORIGIN_ZIP_CODE: '',

    MERCADO_PAGO_ENABLED: 'false',
    MERCADO_PAGO_BASE_URL: 'https://api.mercadopago.com',
    MERCADO_PAGO_ACCESS_TOKEN: '',
    MERCADO_PAGO_PUBLIC_KEY: '',
    MERCADO_PAGO_WEBHOOK_SECRET: '',
    MERCADO_PAGO_SUCCESS_URL: '',
    MERCADO_PAGO_FAILURE_URL: '',
    MERCADO_PAGO_PENDING_URL: '',
    MERCADO_PAGO_NOTIFICATION_URL: '',
    ...overrides,
  };
}

describe('env config', () => {
  it('accepts a valid test environment with external providers disabled', () => {
    const env = loadEnv(makeValidTestEnv());

    expect(env.nodeEnv).toBe('test');
    expect(env.port).toBe(3000);
    expect(env.melhorEnvioEnabled).toBe(false);
    expect(env.mercadoPagoEnabled).toBe(false);
  });

  it('fails in production without JWT_SECRET', () => {
    expect(() =>
      loadEnv(makeValidProductionEnv({ JWT_SECRET: '' })),
    ).toThrow(/JWT_SECRET is required/);
  });

  it('fails in production with weak JWT_SECRET', () => {
    expect(() =>
      loadEnv(makeValidProductionEnv({ JWT_SECRET: 'your_jwt_secret' })),
    ).toThrow(/JWT_SECRET/);
  });

  it('fails when Mercado Pago is enabled without access token', () => {
    expect(() =>
      loadEnv(
        makeValidProductionEnv({
          MERCADO_PAGO_ENABLED: 'true',
          MERCADO_PAGO_ACCESS_TOKEN: '',
          MERCADO_PAGO_PUBLIC_KEY: 'APP_USR-public-key',
          MERCADO_PAGO_WEBHOOK_SECRET: 'webhook-secret',
          MERCADO_PAGO_SUCCESS_URL:
            'https://api.example.com/payments/success',
          MERCADO_PAGO_FAILURE_URL:
            'https://api.example.com/payments/failure',
          MERCADO_PAGO_PENDING_URL:
            'https://api.example.com/payments/pending',
          MERCADO_PAGO_NOTIFICATION_URL:
            'https://api.example.com/api/payments/webhooks/mercado-pago',
        }),
      ),
    ).toThrow(/MERCADO_PAGO_ACCESS_TOKEN is required/);
  });

  it('fails when Melhor Envio is enabled without access token', () => {
    expect(() =>
      loadEnv(
        makeValidProductionEnv({
          MELHOR_ENVIO_ENABLED: 'true',
          MELHOR_ENVIO_ACCESS_TOKEN: '',
          MELHOR_ENVIO_USER_AGENT:
            'ecommerce-backend (prod@example.com)',
          MELHOR_ENVIO_ORIGIN_ZIP_CODE: '30140071',
        }),
      ),
    ).toThrow(/MELHOR_ENVIO_ACCESS_TOKEN is required/);
  });

  it('fails with localhost or ngrok URL in production', () => {
    expect(() =>
      loadEnv(
        makeValidProductionEnv({
          MERCADO_PAGO_SUCCESS_URL:
            'http://localhost:3000/payments/success',
        }),
      ),
    ).toThrow(/localhost, loopback or ngrok/);

    expect(() =>
      loadEnv(
        makeValidProductionEnv({
          MERCADO_PAGO_SUCCESS_URL:
            'https://temporary.ngrok-free.dev/payments/success',
        }),
      ),
    ).toThrow(/localhost, loopback or ngrok/);
  });

  it('accepts a valid production environment', () => {
    const env = loadEnv(
      makeValidProductionEnv({
        MELHOR_ENVIO_ENABLED: 'true',
        MELHOR_ENVIO_ACCESS_TOKEN: 'melhor-envio-token',
        MELHOR_ENVIO_USER_AGENT:
          'ecommerce-backend (prod@example.com)',
        MELHOR_ENVIO_ORIGIN_ZIP_CODE: '30140071',

        MERCADO_PAGO_ENABLED: 'true',
        MERCADO_PAGO_ACCESS_TOKEN: 'mercado-pago-token',
        MERCADO_PAGO_PUBLIC_KEY: 'APP_USR-public-key',
        MERCADO_PAGO_WEBHOOK_SECRET: 'webhook-secret',
        MERCADO_PAGO_SUCCESS_URL:
          'https://api.example.com/payments/success',
        MERCADO_PAGO_FAILURE_URL:
          'https://api.example.com/payments/failure',
        MERCADO_PAGO_PENDING_URL:
          'https://api.example.com/payments/pending',
        MERCADO_PAGO_NOTIFICATION_URL:
          'https://api.example.com/api/payments/webhooks/mercado-pago',
      }),
    );

    expect(env.nodeEnv).toBe('production');
    expect(env.melhorEnvioEnabled).toBe(true);
    expect(env.mercadoPagoEnabled).toBe(true);
  });
});
