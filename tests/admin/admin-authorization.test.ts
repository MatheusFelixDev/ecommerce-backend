import type { FastifyInstance } from 'fastify';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';

import { UserRole } from '../../src/generated/prisma/client';
import { buildAuthorizationHeader } from '../helpers/auth-test-helper';
import { buildTestApp } from '../helpers/build-test-app';

describe('Admin authorization', () => {
  let app: FastifyInstance;

  beforeAll(async () => {
    app = await buildTestApp();
  });

  afterAll(async () => {
    await app.close();
  });

  it('should allow access when user has ADMIN role', async () => {
    const response = await app.inject({
      method: 'GET',
      url: '/api/auth/admin-check',
      headers: {
        authorization: buildAuthorizationHeader(app, {
          role: UserRole.ADMIN,
        }),
      },
    });

    const body = response.json();

    expect(response.statusCode).toBe(200);
    expect(body).toEqual({
      success: true,
      data: {
        message: 'Admin access granted.',
      },
    });
  });

  it('should return forbidden when user has CUSTOMER role', async () => {
    const response = await app.inject({
      method: 'GET',
      url: '/api/auth/admin-check',
      headers: {
        authorization: buildAuthorizationHeader(app, {
          role: UserRole.CUSTOMER,
        }),
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

  it('should return authentication required when token is missing', async () => {
    const response = await app.inject({
      method: 'GET',
      url: '/api/auth/admin-check',
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
});
