import type { FastifyInstance } from 'fastify';
import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest';

import { buildTestApp } from '../helpers/build-test-app';
import {
  clearDatabase,
  disconnectDatabase,
} from '../helpers/database-test-helper';

describe('Auth routes', () => {
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

  it('should register a new user', async () => {
    const response = await app.inject({
      method: 'POST',
      url: '/api/auth/register',
      payload: {
        name: 'Matheus Test',
        email: 'matheus.auth.register@example.com',
        password: '12345678',
      },
    });

    const body = response.json();

    expect(response.statusCode).toBe(201);
    expect(body).toEqual({
      success: true,
      data: {
        user: {
          id: expect.any(String),
          name: 'Matheus Test',
          email: 'matheus.auth.register@example.com',
          role: 'CUSTOMER',
          isActive: true,
          createdAt: expect.any(String),
          updatedAt: expect.any(String),
        },
      },
    });
  });

  it('should not register a user with duplicated email', async () => {
    const payload = {
      name: 'Matheus Test',
      email: 'matheus.auth.duplicated@example.com',
      password: '12345678',
    };

    await app.inject({
      method: 'POST',
      url: '/api/auth/register',
      payload,
    });

    const response = await app.inject({
      method: 'POST',
      url: '/api/auth/register',
      payload,
    });

    const body = response.json();

    expect(response.statusCode).toBe(409);
    expect(body).toEqual({
      success: false,
      error: {
        code: 'EMAIL_ALREADY_REGISTERED',
        message: 'E-mail already registered.',
      },
    });
  });

  it('should login a registered user', async () => {
    const payload = {
      name: 'Matheus Test',
      email: 'matheus.auth.login@example.com',
      password: '12345678',
    };

    await app.inject({
      method: 'POST',
      url: '/api/auth/register',
      payload,
    });

    const response = await app.inject({
      method: 'POST',
      url: '/api/auth/login',
      payload: {
        email: payload.email,
        password: payload.password,
      },
    });

    const body = response.json();

    expect(response.statusCode).toBe(200);
    expect(body).toEqual({
      success: true,
      data: {
        user: {
          id: expect.any(String),
          name: payload.name,
          email: payload.email,
          role: 'CUSTOMER',
          isActive: true,
          createdAt: expect.any(String),
          updatedAt: expect.any(String),
        },
        tokens: {
          accessToken: expect.any(String),
          refreshToken: expect.any(String),
        },
      },
    });
  });

  it('should not login with invalid password', async () => {
    const payload = {
      name: 'Matheus Test',
      email: 'matheus.auth.invalid-password@example.com',
      password: '12345678',
    };

    await app.inject({
      method: 'POST',
      url: '/api/auth/register',
      payload,
    });

    const response = await app.inject({
      method: 'POST',
      url: '/api/auth/login',
      payload: {
        email: payload.email,
        password: 'wrong-password',
      },
    });

    const body = response.json();

    expect(response.statusCode).toBe(401);
    expect(body).toEqual({
      success: false,
      error: {
        code: 'INVALID_CREDENTIALS',
        message: 'Invalid credentials.',
      },
    });
  });

  it('should return authenticated user data', async () => {
    const payload = {
      name: 'Matheus Test',
      email: 'matheus.auth.me@example.com',
      password: '12345678',
    };

    await app.inject({
      method: 'POST',
      url: '/api/auth/register',
      payload,
    });

    const loginResponse = await app.inject({
      method: 'POST',
      url: '/api/auth/login',
      payload: {
        email: payload.email,
        password: payload.password,
      },
    });

    const loginBody = loginResponse.json();
    const accessToken = loginBody.data.tokens.accessToken;

    const response = await app.inject({
      method: 'GET',
      url: '/api/auth/me',
      headers: {
        authorization: `Bearer ${accessToken}`,
      },
    });

    const body = response.json();

    expect(response.statusCode).toBe(200);
    expect(body).toEqual({
      success: true,
      data: {
        user: {
          id: expect.any(String),
          name: payload.name,
          email: payload.email,
          role: 'CUSTOMER',
          isActive: true,
          createdAt: expect.any(String),
          updatedAt: expect.any(String),
        },
      },
    });
  });

  it('should not return authenticated user data without token', async () => {
    const response = await app.inject({
      method: 'GET',
      url: '/api/auth/me',
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
