import { describe, expect, it } from 'vitest';

import {
  createCorsOriginHandler,
  isAllowedCorsOrigin,
} from '../../src/config/cors';
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

describe('cors config', () => {
  it('allows configured origin', () => {
    expect(
      isAllowedCorsOrigin('http://localhost:5173', [
        'http://localhost:5173',
      ]),
    ).toBe(true);
  });

  it('blocks non-configured origin', () => {
    expect(
      isAllowedCorsOrigin('https://evil.example.com', [
        'https://seudominio.com',
      ]),
    ).toBe(false);
  });

  it('allows requests without Origin header', () => {
    expect(isAllowedCorsOrigin(undefined, ['https://seudominio.com'])).toBe(
      true,
    );
  });

  it('blocks empty Origin header', () => {
    expect(isAllowedCorsOrigin('', ['https://seudominio.com'])).toBe(false);
  });

  it('origin handler allows configured origin', () => {
    const handler = createCorsOriginHandler(['https://seudominio.com']);

    handler('https://seudominio.com', (error, origin) => {
      expect(error).toBeNull();
      expect(origin).toBe(true);
    });
  });

  it('origin handler blocks non-configured origin', () => {
    const handler = createCorsOriginHandler(['https://seudominio.com']);

    handler('https://evil.example.com', (error, origin) => {
      expect(error).toBeNull();
      expect(origin).toBe(false);
    });
  });

  it('parses cors origins trimming spaces and ignoring empty entries', () => {
    const env = loadEnv(
      makeValidTestEnv({
        CORS_ORIGINS:
          ' http://localhost:5173, , http://localhost:3000,  ',
      }),
    );

    expect(env.corsOrigins).toEqual([
      'http://localhost:5173',
      'http://localhost:3000',
    ]);
  });

  it('uses local defaults outside production when CORS_ORIGINS is empty', () => {
    const env = loadEnv(
      makeValidTestEnv({
        CORS_ORIGINS: '',
      }),
    );

    expect(env.corsOrigins).toEqual([
      'http://localhost:5173',
      'http://localhost:3000',
      'http://127.0.0.1:5173',
    ]);
  });

  it('requires CORS_ORIGINS in production', () => {
    expect(() =>
      loadEnv(
        makeValidProductionEnv({
          CORS_ORIGINS: '',
        }),
      ),
    ).toThrow(/CORS_ORIGINS is required in production/);
  });

  it('blocks non-HTTPS origins in production', () => {
    expect(() =>
      loadEnv(
        makeValidProductionEnv({
          CORS_ORIGINS: 'http://seudominio.com',
        }),
      ),
    ).toThrow(/CORS_ORIGINS must use HTTPS in production/);
  });

  it('blocks localhost, loopback and ngrok origins in production', () => {
    expect(() =>
      loadEnv(
        makeValidProductionEnv({
          CORS_ORIGINS: 'http://localhost:5173',
        }),
      ),
    ).toThrow(/localhost, loopback or ngrok/);

    expect(() =>
      loadEnv(
        makeValidProductionEnv({
          CORS_ORIGINS: 'http://127.0.0.1:5173',
        }),
      ),
    ).toThrow(/localhost, loopback or ngrok/);

    expect(() =>
      loadEnv(
        makeValidProductionEnv({
          CORS_ORIGINS: 'https://temporary.ngrok-free.dev',
        }),
      ),
    ).toThrow(/localhost, loopback or ngrok/);
  });

  it('accepts valid production cors origins', () => {
    const env = loadEnv(
      makeValidProductionEnv({
        CORS_ORIGINS:
          'https://seudominio.com,https://www.seudominio.com,https://admin.seudominio.com',
      }),
    );

    expect(env.corsOrigins).toEqual([
      'https://seudominio.com',
      'https://www.seudominio.com',
      'https://admin.seudominio.com',
    ]);
  });
});
