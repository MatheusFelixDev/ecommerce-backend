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
};

type TestAddress = {
  id: string;
};

type AddressResponse = {
  id: string;
  userId: string;
  label: string | null;
  recipientName: string | null;
  phone: string | null;
  zipCode: string;
  street: string;
  number: string;
  complement: string | null;
  neighborhood: string;
  city: string;
  state: string;
  country: string;
  isMain: boolean;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
};

describe('Addresses routes', () => {
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
    email = 'address.customer@example.com',
  ): Promise<TestUser> {
    return prisma.user.create({
      data: {
        name: 'Address Customer',
        email,
        passwordHash: 'hashed-password-for-tests',
        role: UserRole.CUSTOMER,
      },
    });
  }

  async function createAddress(
    userId: string,
    overrides: Partial<{
      label: string;
      recipientName: string;
      phone: string;
      zipCode: string;
      street: string;
      number: string;
      complement: string | null;
      neighborhood: string;
      city: string;
      state: string;
      country: string;
      isMain: boolean;
      isActive: boolean;
    }> = {},
  ): Promise<TestAddress> {
    return prisma.address.create({
      data: {
        userId,
        label: overrides.label ?? 'Casa',
        recipientName: overrides.recipientName ?? 'Cliente Teste',
        phone: overrides.phone ?? '31999999999',
        zipCode: overrides.zipCode ?? '32073000',
        street: overrides.street ?? 'Rua Laranjal',
        number: overrides.number ?? '100',
        complement: overrides.complement,
        neighborhood: overrides.neighborhood ?? 'Industrial São Luiz',
        city: overrides.city ?? 'Contagem',
        state: overrides.state ?? 'MG',
        country: overrides.country ?? 'Brazil',
        isMain: overrides.isMain ?? false,
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

  it('should create an address for authenticated user', async () => {
    const user = await createUser();
    const authorization = authorizationFor(user.id);

    const response = await app.inject({
      method: 'POST',
      url: '/api/addresses',
      headers: {
        authorization,
      },
      payload: {
        label: 'Casa',
        recipientName: 'Cliente Teste',
        phone: '31999999999',
        zipCode: '32073000',
        street: 'Rua Laranjal',
        number: '100',
        complement: 'Apto 101',
        neighborhood: 'Industrial São Luiz',
        city: 'Contagem',
        state: 'MG',
        country: 'Brazil',
      },
    });

    const body = response.json();
    const address = body.data.address as AddressResponse;

    expect(response.statusCode).toBe(201);
    expect(body.success).toBe(true);
    expect(address.id).toEqual(expect.any(String));
    expect(address.userId).toBe(user.id);
    expect(address.label).toBe('Casa');
    expect(address.zipCode).toBe('32073000');
    expect(address.street).toBe('Rua Laranjal');
    expect(address.number).toBe('100');
    expect(address.city).toBe('Contagem');
    expect(address.state).toBe('MG');
    expect(address.isMain).toBe(true);
    expect(address.isActive).toBe(true);
  });

  it('should not create an address without token', async () => {
    const response = await app.inject({
      method: 'POST',
      url: '/api/addresses',
      payload: {
        zipCode: '32073000',
        street: 'Rua Laranjal',
        number: '100',
        neighborhood: 'Industrial São Luiz',
        city: 'Contagem',
        state: 'MG',
      },
    });

    expect(response.statusCode).toBe(401);
  });

  it('should list only authenticated user active addresses', async () => {
    const user = await createUser();
    const otherUser = await createUser('other.address@example.com');
    const authorization = authorizationFor(user.id);

    const mainAddress = await createAddress(user.id, {
      label: 'Casa',
      isMain: true,
    });

    await createAddress(user.id, {
      label: 'Inativo',
      isActive: false,
    });

    await createAddress(otherUser.id, {
      label: 'Outro usuário',
      isMain: true,
    });

    const response = await app.inject({
      method: 'GET',
      url: '/api/addresses',
      headers: {
        authorization,
      },
    });

    const body = response.json();
    const addresses = body.data.addresses as AddressResponse[];

    expect(response.statusCode).toBe(200);
    expect(body.success).toBe(true);
    expect(addresses).toHaveLength(1);
    expect(addresses[0].id).toBe(mainAddress.id);
    expect(addresses[0].userId).toBe(user.id);
    expect(addresses[0].label).toBe('Casa');
    expect(addresses[0].isActive).toBe(true);
  });

  it('should update an authenticated user address', async () => {
    const user = await createUser();
    const authorization = authorizationFor(user.id);
    const address = await createAddress(user.id);

    const response = await app.inject({
      method: 'PATCH',
      url: `/api/addresses/${address.id}`,
      headers: {
        authorization,
      },
      payload: {
        label: 'Trabalho',
        street: 'Avenida Principal',
        number: '200',
        city: 'Betim',
      },
    });

    const body = response.json();
    const updatedAddress = body.data.address as AddressResponse;

    expect(response.statusCode).toBe(200);
    expect(body.success).toBe(true);
    expect(updatedAddress.id).toBe(address.id);
    expect(updatedAddress.label).toBe('Trabalho');
    expect(updatedAddress.street).toBe('Avenida Principal');
    expect(updatedAddress.number).toBe('200');
    expect(updatedAddress.city).toBe('Betim');
  });

  it('should not update another user address', async () => {
    const user = await createUser();
    const otherUser = await createUser('other.address@example.com');
    const authorization = authorizationFor(user.id);
    const otherAddress = await createAddress(otherUser.id);

    const response = await app.inject({
      method: 'PATCH',
      url: `/api/addresses/${otherAddress.id}`,
      headers: {
        authorization,
      },
      payload: {
        label: 'Tentativa inválida',
      },
    });

    expect(response.statusCode).toBe(404);
  });

  it('should set an address as main and unset previous main address', async () => {
    const user = await createUser();
    const authorization = authorizationFor(user.id);

    const oldMainAddress = await createAddress(user.id, {
      label: 'Casa',
      isMain: true,
    });

    const newMainAddress = await createAddress(user.id, {
      label: 'Trabalho',
      isMain: false,
    });

    const response = await app.inject({
      method: 'PATCH',
      url: `/api/addresses/${newMainAddress.id}/main`,
      headers: {
        authorization,
      },
    });

    const body = response.json();
    const address = body.data.address as AddressResponse;

    const oldMainAddressAfterUpdate = await prisma.address.findUnique({
      where: {
        id: oldMainAddress.id,
      },
    });

    expect(response.statusCode).toBe(200);
    expect(body.success).toBe(true);
    expect(address.id).toBe(newMainAddress.id);
    expect(address.isMain).toBe(true);
    expect(oldMainAddressAfterUpdate?.isMain).toBe(false);
  });

  it('should soft delete an address and choose another main address', async () => {
    const user = await createUser();
    const authorization = authorizationFor(user.id);

    const mainAddress = await createAddress(user.id, {
      label: 'Casa',
      isMain: true,
    });

    const secondaryAddress = await createAddress(user.id, {
      label: 'Trabalho',
      isMain: false,
    });

    const response = await app.inject({
      method: 'DELETE',
      url: `/api/addresses/${mainAddress.id}`,
      headers: {
        authorization,
      },
    });

    const deletedAddress = await prisma.address.findUnique({
      where: {
        id: mainAddress.id,
      },
    });

    const remainingAddress = await prisma.address.findUnique({
      where: {
        id: secondaryAddress.id,
      },
    });

    expect(response.statusCode).toBe(204);
    expect(deletedAddress?.isActive).toBe(false);
    expect(deletedAddress?.isMain).toBe(false);
    expect(remainingAddress?.isActive).toBe(true);
    expect(remainingAddress?.isMain).toBe(true);
  });

  it('should not delete another user address', async () => {
    const user = await createUser();
    const otherUser = await createUser('other.address@example.com');
    const authorization = authorizationFor(user.id);
    const otherAddress = await createAddress(otherUser.id);

    const response = await app.inject({
      method: 'DELETE',
      url: `/api/addresses/${otherAddress.id}`,
      headers: {
        authorization,
      },
    });

    expect(response.statusCode).toBe(404);
  });
});
