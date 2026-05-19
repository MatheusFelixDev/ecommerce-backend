import bcrypt from 'bcrypt';
import type { FastifyInstance } from 'fastify';
import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest';

import { UserRole } from '../../src/generated/prisma/client';
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

type UserProfileResponse = {
  id: string;
  name: string;
  email: string;
  phone: string | null;
  role: UserRole;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
};

describe('Users routes', () => {
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
    email = 'users.customer@example.com',
    overrides: Partial<{
      name: string;
      phone: string | null;
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
        name: overrides.name ?? 'Users Customer',
        email,
        phone: overrides.phone,
        passwordHash,
        role: overrides.role ?? UserRole.CUSTOMER,
        isActive: overrides.isActive ?? true,
      },
    });
  }

  function authorizationFor(userId: string): string {
    return buildAuthorizationHeader(app, {
      userId,
      role: UserRole.CUSTOMER,
    });
  }

  it('should get authenticated user profile', async () => {
    const user = await createUser();
    const authorization = authorizationFor(user.id);

    const response = await app.inject({
      method: 'GET',
      url: '/api/users/profile',
      headers: {
        authorization,
      },
    });

    const body = response.json();
    const profile = body.data.user as UserProfileResponse;

    expect(response.statusCode).toBe(200);
    expect(body.success).toBe(true);
    expect(profile.id).toBe(user.id);
    expect(profile.email).toBe(user.email);
    expect(profile.name).toBe('Users Customer');
    expect(profile.role).toBe(UserRole.CUSTOMER);
    expect(profile.isActive).toBe(true);
    expect(profile.createdAt).toEqual(expect.any(String));
    expect(profile.updatedAt).toEqual(expect.any(String));
  });

  it('should not get profile without token', async () => {
    const response = await app.inject({
      method: 'GET',
      url: '/api/users/profile',
    });

    expect(response.statusCode).toBe(401);
  });

  it('should not get profile when user is inactive', async () => {
    const user = await createUser('inactive.user@example.com', {
      isActive: false,
    });

    const authorization = authorizationFor(user.id);

    const response = await app.inject({
      method: 'GET',
      url: '/api/users/profile',
      headers: {
        authorization,
      },
    });

    expect(response.statusCode).toBe(403);
  });

  it('should update authenticated user profile', async () => {
    const user = await createUser();
    const authorization = authorizationFor(user.id);

    const response = await app.inject({
      method: 'PATCH',
      url: '/api/users/profile',
      headers: {
        authorization,
      },
      payload: {
        name: 'Updated Customer',
        phone: '31999999999',
      },
    });

    const body = response.json();
    const profile = body.data.user as UserProfileResponse;

    expect(response.statusCode).toBe(200);
    expect(body.success).toBe(true);
    expect(profile.id).toBe(user.id);
    expect(profile.name).toBe('Updated Customer');
    expect(profile.phone).toBe('31999999999');
  });

  it('should update authenticated user password', async () => {
    const user = await createUser();
    const authorization = authorizationFor(user.id);

    const response = await app.inject({
      method: 'PATCH',
      url: '/api/users/profile/password',
      headers: {
        authorization,
      },
      payload: {
        currentPassword: '12345678',
        newPassword: '87654321',
      },
    });

    const updatedUser = await prisma.user.findUniqueOrThrow({
      where: {
        id: user.id,
      },
    });

    const oldPasswordMatches = await bcrypt.compare(
      '12345678',
      updatedUser.passwordHash,
    );

    const newPasswordMatches = await bcrypt.compare(
      '87654321',
      updatedUser.passwordHash,
    );

    expect(response.statusCode).toBe(204);
    expect(oldPasswordMatches).toBe(false);
    expect(newPasswordMatches).toBe(true);
  });

  it('should not update password with invalid current password', async () => {
    const user = await createUser();
    const authorization = authorizationFor(user.id);

    const response = await app.inject({
      method: 'PATCH',
      url: '/api/users/profile/password',
      headers: {
        authorization,
      },
      payload: {
        currentPassword: 'wrong-password',
        newPassword: '87654321',
      },
    });

    expect(response.statusCode).toBe(400);
  });

  it('should request e-mail change for authenticated user', async () => {
    const user = await createUser();
    const authorization = authorizationFor(user.id);

    const response = await app.inject({
      method: 'POST',
      url: '/api/users/profile/email/request',
      headers: {
        authorization,
      },
      payload: {
        newEmail: 'new.email@example.com',
        currentPassword: '12345678',
      },
    });

    const body = response.json();

    const storedToken = await prisma.emailChangeToken.findFirst({
      where: {
        userId: user.id,
        newEmail: 'new.email@example.com',
      },
    });

    const userAfterRequest = await prisma.user.findUniqueOrThrow({
      where: {
        id: user.id,
      },
    });

    expect(response.statusCode).toBe(200);
    expect(body.success).toBe(true);
    expect(body.data.emailChangeToken).toEqual(expect.any(String));
    expect(body.data.emailChangeToken.length).toBeGreaterThanOrEqual(32);
    expect(storedToken).not.toBeNull();
    expect(storedToken?.usedAt).toBeNull();
    expect(userAfterRequest.email).toBe(user.email);
  });

  it('should not request e-mail change when new e-mail is already registered', async () => {
    const user = await createUser();
    const duplicatedUser = await createUser(
      'already.registered@example.com',
    );

    const authorization = authorizationFor(user.id);

    const response = await app.inject({
      method: 'POST',
      url: '/api/users/profile/email/request',
      headers: {
        authorization,
      },
      payload: {
        newEmail: duplicatedUser.email,
        currentPassword: '12345678',
      },
    });

    expect(response.statusCode).toBe(409);
  });

  it('should confirm authenticated user e-mail change', async () => {
    const user = await createUser();
    const authorization = authorizationFor(user.id);

    const requestResponse = await app.inject({
      method: 'POST',
      url: '/api/users/profile/email/request',
      headers: {
        authorization,
      },
      payload: {
        newEmail: 'confirmed.email@example.com',
        currentPassword: '12345678',
      },
    });

    const requestBody = requestResponse.json();

    const response = await app.inject({
      method: 'POST',
      url: '/api/users/profile/email/confirm',
      headers: {
        authorization,
      },
      payload: {
        token: requestBody.data.emailChangeToken,
      },
    });

    const body = response.json();
    const profile = body.data.user as UserProfileResponse;

    const usedToken = await prisma.emailChangeToken.findFirst({
      where: {
        userId: user.id,
        newEmail: 'confirmed.email@example.com',
      },
    });

    expect(response.statusCode).toBe(200);
    expect(body.success).toBe(true);
    expect(profile.id).toBe(user.id);
    expect(profile.email).toBe('confirmed.email@example.com');
    expect(usedToken?.usedAt).not.toBeNull();
  });

  it('should not confirm e-mail change with invalid token', async () => {
    const user = await createUser();
    const authorization = authorizationFor(user.id);

    const response = await app.inject({
      method: 'POST',
      url: '/api/users/profile/email/confirm',
      headers: {
        authorization,
      },
      payload: {
        token: 'invalid-token-with-more-than-thirty-two-chars',
      },
    });

    expect(response.statusCode).toBe(400);
  });

  it('should not confirm e-mail change using another user token', async () => {
    const user = await createUser();
    const otherUser = await createUser('other.users@example.com');

    const userAuthorization = authorizationFor(user.id);
    const otherUserAuthorization = authorizationFor(otherUser.id);

    const requestResponse = await app.inject({
      method: 'POST',
      url: '/api/users/profile/email/request',
      headers: {
        authorization: otherUserAuthorization,
      },
      payload: {
        newEmail: 'other.new.email@example.com',
        currentPassword: '12345678',
      },
    });

    const requestBody = requestResponse.json();

    const response = await app.inject({
      method: 'POST',
      url: '/api/users/profile/email/confirm',
      headers: {
        authorization: userAuthorization,
      },
      payload: {
        token: requestBody.data.emailChangeToken,
      },
    });

    expect(response.statusCode).toBe(400);
  });
});
