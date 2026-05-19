import type { FastifyInstance } from 'fastify';
import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest';

import { UserRole } from '../../src/generated/prisma/client';
import { buildAuthorizationHeader } from '../helpers/auth-test-helper';
import { buildTestApp } from '../helpers/build-test-app';
import {
  clearDatabase,
  disconnectDatabase,
} from '../helpers/database-test-helper';

type CategoryResponse = {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
};

describe('Categories routes', () => {
  let app: FastifyInstance;
  let adminAuthorization: string;
  let customerAuthorization: string;

  beforeAll(async () => {
    app = await buildTestApp();

    adminAuthorization = buildAuthorizationHeader(app, {
      role: UserRole.ADMIN,
    });

    customerAuthorization = buildAuthorizationHeader(app, {
      role: UserRole.CUSTOMER,
    });
  });

  beforeEach(async () => {
    await clearDatabase();
  });

  afterAll(async () => {
    await app.close();
    await disconnectDatabase();
  });

  async function createCategory(
    name = 'Games e Consoles',
    description = 'Produtos para gamers.',
  ): Promise<CategoryResponse> {
    const response = await app.inject({
      method: 'POST',
      url: '/api/categories',
      headers: {
        authorization: adminAuthorization,
      },
      payload: {
        name,
        description,
      },
    });

    const body = response.json();

    expect(response.statusCode).toBe(201);

    return body.data.category;
  }

  it('should create a category when user has ADMIN role', async () => {
    const response = await app.inject({
      method: 'POST',
      url: '/api/categories',
      headers: {
        authorization: adminAuthorization,
      },
      payload: {
        name: 'Games e Consoles',
        description: 'Produtos para gamers.',
      },
    });

    const body = response.json();

    expect(response.statusCode).toBe(201);
    expect(body).toEqual({
      success: true,
      data: {
        category: {
          id: expect.any(String),
          name: 'Games e Consoles',
          slug: 'games-e-consoles',
          description: 'Produtos para gamers.',
          isActive: true,
          createdAt: expect.any(String),
          updatedAt: expect.any(String),
        },
      },
    });
  });

  it('should not create a category with duplicated slug', async () => {
    await createCategory('Games e Consoles');

    const response = await app.inject({
      method: 'POST',
      url: '/api/categories',
      headers: {
        authorization: adminAuthorization,
      },
      payload: {
        name: 'Games e Consoles',
        description: 'Outra descrição.',
      },
    });

    const body = response.json();

    expect(response.statusCode).toBe(409);
    expect(body).toEqual({
      success: false,
      error: {
        code: 'CATEGORY_ALREADY_EXISTS',
        message: 'Category already exists.',
      },
    });
  });

  it('should not create a category when user has CUSTOMER role', async () => {
    const response = await app.inject({
      method: 'POST',
      url: '/api/categories',
      headers: {
        authorization: customerAuthorization,
      },
      payload: {
        name: 'Games e Consoles',
        description: 'Produtos para gamers.',
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

  it('should not create a category without token', async () => {
    const response = await app.inject({
      method: 'POST',
      url: '/api/categories',
      payload: {
        name: 'Games e Consoles',
        description: 'Produtos para gamers.',
      },
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

  it('should list active categories', async () => {
    await createCategory('Games e Consoles');
    await createCategory('Acessórios');

    const response = await app.inject({
      method: 'GET',
      url: '/api/categories',
    });

    const body = response.json();

    expect(response.statusCode).toBe(200);
    expect(body.success).toBe(true);
    expect(body.data.categories).toHaveLength(2);
    expect(body.data.categories).toEqual([
      expect.objectContaining({
        name: 'Acessórios',
        slug: 'acessorios',
        isActive: true,
      }),
      expect.objectContaining({
        name: 'Games e Consoles',
        slug: 'games-e-consoles',
        isActive: true,
      }),
    ]);
  });

  it('should get a category by slug', async () => {
    await createCategory('Games e Consoles');

    const response = await app.inject({
      method: 'GET',
      url: '/api/categories/games-e-consoles',
    });

    const body = response.json();

    expect(response.statusCode).toBe(200);
    expect(body).toEqual({
      success: true,
      data: {
        category: {
          id: expect.any(String),
          name: 'Games e Consoles',
          slug: 'games-e-consoles',
          description: 'Produtos para gamers.',
          isActive: true,
          createdAt: expect.any(String),
          updatedAt: expect.any(String),
        },
      },
    });
  });

  it('should return not found when category slug does not exist', async () => {
    const response = await app.inject({
      method: 'GET',
      url: '/api/categories/not-found-category',
    });

    const body = response.json();

    expect(response.statusCode).toBe(404);
    expect(body).toEqual({
      success: false,
      error: {
        code: 'CATEGORY_NOT_FOUND',
        message: 'Category not found.',
      },
    });
  });

  it('should update a category when user has ADMIN role', async () => {
    const category = await createCategory('Games e Consoles');

    const response = await app.inject({
      method: 'PATCH',
      url: `/api/categories/${category.id}`,
      headers: {
        authorization: adminAuthorization,
      },
      payload: {
        name: 'Games Atualizados',
        description: 'Categoria atualizada.',
      },
    });

    const body = response.json();

    expect(response.statusCode).toBe(200);
    expect(body).toEqual({
      success: true,
      data: {
        category: {
          id: category.id,
          name: 'Games Atualizados',
          slug: 'games-atualizados',
          description: 'Categoria atualizada.',
          isActive: true,
          createdAt: expect.any(String),
          updatedAt: expect.any(String),
        },
      },
    });
  });

  it('should soft delete a category when user has ADMIN role', async () => {
    const category = await createCategory('Games e Consoles');

    const deleteResponse = await app.inject({
      method: 'DELETE',
      url: `/api/categories/${category.id}`,
      headers: {
        authorization: adminAuthorization,
      },
    });

    expect(deleteResponse.statusCode).toBe(204);

    const listResponse = await app.inject({
      method: 'GET',
      url: '/api/categories',
    });

    const listBody = listResponse.json();

    expect(listResponse.statusCode).toBe(200);
    expect(listBody.data.categories).toHaveLength(0);
  });

  it('should restore a soft deleted category when user has ADMIN role', async () => {
    const category = await createCategory('Games e Consoles');

    await app.inject({
      method: 'DELETE',
      url: `/api/categories/${category.id}`,
      headers: {
        authorization: adminAuthorization,
      },
    });

    const response = await app.inject({
      method: 'PATCH',
      url: `/api/categories/${category.id}/restore`,
      headers: {
        authorization: adminAuthorization,
      },
    });

    const body = response.json();

    expect(response.statusCode).toBe(200);
    expect(body).toEqual({
      success: true,
      data: {
        category: {
          id: category.id,
          name: 'Games e Consoles',
          slug: 'games-e-consoles',
          description: 'Produtos para gamers.',
          isActive: true,
          createdAt: expect.any(String),
          updatedAt: expect.any(String),
        },
      },
    });
  });
});
