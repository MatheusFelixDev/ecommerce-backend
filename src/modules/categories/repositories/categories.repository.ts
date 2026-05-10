import type { Category } from '../../../generated/prisma/client';

import { prisma } from '../../../infra/prisma/client';

interface CreateCategoryData {
  name: string;
  slug: string;
  description?: string;
}

export class CategoriesRepository {
  async findBySlug(
    slug: string,
  ): Promise<Category | null> {
    return prisma.category.findUnique({
      where: {
        slug,
      },
    });
  }

  async create(
    data: CreateCategoryData,
  ): Promise<Category> {
    return prisma.category.create({
      data,
    });
  }
}

export const categoriesRepository =
  new CategoriesRepository();
