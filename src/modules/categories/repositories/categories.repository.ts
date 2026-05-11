import type { Category } from '../../../generated/prisma/client';

import { prisma } from '../../../infra/prisma/client';

interface CreateCategoryData {
  name: string;
  slug: string;
  description?: string;
}

interface UpdateCategoryData {
  name?: string;
  slug?: string;
  description?: string | null;
}

export class CategoriesRepository {
  async findById(id: string): Promise<Category | null> {
    return prisma.category.findUnique({
      where: {
        id,
      },
    });
  }

  async findBySlug(slug: string): Promise<Category | null> {
    return prisma.category.findUnique({
      where: {
        slug,
      },
    });
  }

  async findMany(): Promise<Category[]> {
    return prisma.category.findMany({
      where: {
        isActive: true,
      },
      orderBy: {
        name: 'asc',
      },
    });
  }

  async create(data: CreateCategoryData): Promise<Category> {
    return prisma.category.create({
      data,
    });
  }

  async update(
    id: string,
    data: UpdateCategoryData,
  ): Promise<Category> {
    return prisma.category.update({
      where: {
        id,
      },
      data,
    });
  }

  async softDelete(id: string): Promise<Category> {
    return prisma.category.update({
      where: {
        id,
      },
      data: {
        isActive: false,
      },
    });
  }

  async restore(id: string): Promise<Category> {
    return prisma.category.update({
      where: {
        id,
      },
      data: {
        isActive: true,
      },
    });
  }
}

export const categoriesRepository =
  new CategoriesRepository();
