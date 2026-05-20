import bcrypt from 'bcrypt';
import type { FastifyInstance } from 'fastify';
import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest';

import { UserRole } from '../../src/generated/prisma/client';
import { prisma } from '../../src/infra/prisma/client';
import { hashRefreshToken } from '../../src/modules/auth/utils/refresh-token.utils';
import { buildAuthorizationHeader } from '../helpers/auth-test-helper';
import { buildTestApp } from '../helpers/build-test-app';
import {
  clearDatabase,
  disconnectDatabase,
} from '../helpers/database-test-helper';

type TestUser = {
  id: string;
  name: string;
  email: string;
};

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

  async function createUser(
    email = 'auth.customer@example.com',
    overrides: Partial<{
      name: string;
      password: string;
      role: UserRole;
      isActive: boolean;
    }> = {},
  ): Promise<TestUser> {
    const passwordHash = await bcrypt.hash(
      overrides.password ?? '12345678',
      10,
    );

    return prisma.user.create({
      data: {
        name: overrides.name ?? 'Auth Customer',
        email,
        passwordHash,
        role: overrides.role ?? UserRole.CUSTOMER,
        isActive: overrides.isActive ?? true,
      },
    });
  }

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

  it('should reject extra fields on register payload', async () => {
    const response = await app.inject({
      method: 'POST',
      url: '/api/auth/register',
      payload: {
        name: 'Malicious User',
        email: 'malicious.register@example.com',
        password: '12345678',
        role: 'ADMIN',
        isActive: true,
        passwordHash: 'fake-hash',
      },
    });

    const body = response.json();

    const storedUser = await prisma.user.findUnique({
      where: {
        email: 'malicious.register@example.com',
      },
    });

    expect(response.statusCode).toBe(400);
    expect(body.success).toBe(false);
    expect(body.error.code).toBe('VALIDATION_ERROR');
    expect(storedUser).toBeNull();
  });

  it('should reject extra fields on refresh token payload', async () => {
    const response = await app.inject({
      method: 'POST',
      url: '/api/auth/refresh',
      payload: {
        refreshToken: 'invalid-refresh-token',
        accessToken: 'fake-access-token',
        userId: 'fake-user-id',
      },
    });

    const body = response.json();

    expect(response.statusCode).toBe(400);
    expect(body.success).toBe(false);
    expect(body.error.code).toBe('VALIDATION_ERROR');
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

  it('should not login when user is inactive', async () => {
    const user = await createUser('inactive.auth@example.com', {
      isActive: false,
    });

    const response = await app.inject({
      method: 'POST',
      url: '/api/auth/login',
      payload: {
        email: user.email,
        password: '12345678',
      },
    });

    const body = response.json();

    expect(response.statusCode).toBe(403);
    expect(body).toEqual({
      success: false,
      error: {
        code: 'USER_INACTIVE',
        message: 'User is inactive.',
      },
    });
  });

  it('should not expose reset token in forgot password response', async () => {
    const user = await createUser('forgot.password@example.com');

    const response = await app.inject({
      method: 'POST',
      url: '/api/auth/forgot-password',
      payload: {
        email: user.email,
      },
    });

    const body = response.json();

    expect(response.statusCode).toBe(200);
    expect(body).toEqual({
      success: true,
      data: {
        message:
          'If the e-mail is registered, password reset instructions will be sent.',
      },
    });
    expect(body.data.resetToken).toBeUndefined();
  });

  it('should refresh tokens and revoke previous refresh token', async () => {
    const user = await createUser('refresh.auth@example.com');

    const loginResponse = await app.inject({
      method: 'POST',
      url: '/api/auth/login',
      payload: {
        email: user.email,
        password: '12345678',
      },
    });

    const loginBody = loginResponse.json();
    const oldRefreshToken = loginBody.data.tokens.refreshToken;

    const response = await app.inject({
      method: 'POST',
      url: '/api/auth/refresh',
      payload: {
        refreshToken: oldRefreshToken,
      },
    });

    const body = response.json();

    const revokedOldRefreshToken =
      await prisma.refreshToken.findUnique({
        where: {
          tokenHash: hashRefreshToken(oldRefreshToken),
        },
      });

    const newRefreshToken = await prisma.refreshToken.findUnique({
      where: {
        tokenHash: hashRefreshToken(body.data.tokens.refreshToken),
      },
    });

    expect(response.statusCode).toBe(200);
    expect(body.success).toBe(true);
    expect(body.data.user.id).toBe(user.id);
    expect(body.data.tokens.accessToken).toEqual(expect.any(String));
    expect(body.data.tokens.refreshToken).toEqual(expect.any(String));
    expect(body.data.tokens.refreshToken).not.toBe(oldRefreshToken);
    expect(revokedOldRefreshToken?.revokedAt).not.toBeNull();
    expect(newRefreshToken).not.toBeNull();
    expect(newRefreshToken?.revokedAt).toBeNull();
  });

  it('should not refresh with invalid refresh token', async () => {
    const response = await app.inject({
      method: 'POST',
      url: '/api/auth/refresh',
      payload: {
        refreshToken: 'invalid-refresh-token',
      },
    });

    const body = response.json();

    expect(response.statusCode).toBe(401);
    expect(body).toEqual({
      success: false,
      error: {
        code: 'INVALID_REFRESH_TOKEN',
        message: 'Invalid refresh token.',
      },
    });
  });

  it('should not refresh with expired refresh token', async () => {
    const user = await createUser('expired.refresh@example.com');
    const expiredRefreshToken = 'expired-refresh-token';

    await prisma.refreshToken.create({
      data: {
        userId: user.id,
        tokenHash: hashRefreshToken(expiredRefreshToken),
        expiresAt: new Date(Date.now() - 60 * 1000),
      },
    });

    const response = await app.inject({
      method: 'POST',
      url: '/api/auth/refresh',
      payload: {
        refreshToken: expiredRefreshToken,
      },
    });

    const body = response.json();

    const storedRefreshToken = await prisma.refreshToken.findUnique({
      where: {
        tokenHash: hashRefreshToken(expiredRefreshToken),
      },
    });

    expect(response.statusCode).toBe(401);
    expect(body).toEqual({
      success: false,
      error: {
        code: 'REFRESH_TOKEN_EXPIRED',
        message: 'Refresh token has expired.',
      },
    });
    expect(storedRefreshToken?.revokedAt).not.toBeNull();
  });

  it('should logout and revoke refresh token', async () => {
    const user = await createUser('logout.auth@example.com');

    const loginResponse = await app.inject({
      method: 'POST',
      url: '/api/auth/login',
      payload: {
        email: user.email,
        password: '12345678',
      },
    });

    const loginBody = loginResponse.json();
    const refreshToken = loginBody.data.tokens.refreshToken;

    const response = await app.inject({
      method: 'POST',
      url: '/api/auth/logout',
      payload: {
        refreshToken,
      },
    });

    const body = response.json();

    const storedRefreshToken = await prisma.refreshToken.findUnique({
      where: {
        tokenHash: hashRefreshToken(refreshToken),
      },
    });

    expect(response.statusCode).toBe(200);
    expect(body).toEqual({
      success: true,
      data: {
        message: 'Logout completed successfully.',
      },
    });
    expect(storedRefreshToken?.revokedAt).not.toBeNull();
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

  it('should not return authenticated user data with invalid token', async () => {
    const response = await app.inject({
      method: 'GET',
      url: '/api/auth/me',
      headers: {
        authorization: 'Bearer invalid-token',
      },
    });

    expect(response.statusCode).toBe(401);
  });

  it('should allow admin access when user has ADMIN role', async () => {
    const admin = await createUser('admin.auth@example.com', {
      role: UserRole.ADMIN,
    });

    const authorization = buildAuthorizationHeader(app, {
      userId: admin.id,
      role: UserRole.ADMIN,
    });

    const response = await app.inject({
      method: 'GET',
      url: '/api/auth/admin-check',
      headers: {
        authorization,
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

  it('should not allow admin access when user has CUSTOMER role', async () => {
    const customer = await createUser('customer.auth@example.com');

    const authorization = buildAuthorizationHeader(app, {
      userId: customer.id,
      role: UserRole.CUSTOMER,
    });

    const response = await app.inject({
      method: 'GET',
      url: '/api/auth/admin-check',
      headers: {
        authorization,
      },
    });

    expect(response.statusCode).toBe(403);
  });
});
