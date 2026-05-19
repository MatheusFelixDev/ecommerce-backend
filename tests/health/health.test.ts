import { afterAll, beforeAll, describe, expect, it } from 'vitest';

import { buildTestApp } from '../helpers/build-test-app';

import type { FastifyInstance } from 'fastify';

describe('Health routes', () => {
  let app: FastifyInstance;

  beforeAll(async () => {
    app = await buildTestApp();
  });

  afterAll(async () => {
    await app.close();
  });

  it('should return API health status', async () => {
    const response = await app.inject({
      method: 'GET',
      url: '/api/health',
    });

    const body = response.json();

    expect(response.statusCode).toBe(200);
    expect(body).toEqual({
      success: true,
      data: {
        status: 'ok',
        service: 'ecommerce-backend-api',
        timestamp: expect.any(String),
      },
    });
  });
});
