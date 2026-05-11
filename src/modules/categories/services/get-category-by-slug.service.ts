import { AppError } from '../../../core/errors/app-error';

import { categoriesRepository } from '../repositories/categories.repository';

export class GetCategoryBySlugService {
  async execute(slug: string) {
    const category =
      await categoriesRepository.findBySlug(slug);

    if (!category || !category.isActive) {
      throw new AppError(
        'Category not found.',
        404,
        'CATEGORY_NOT_FOUND',
      );
    }

    return category;
  }
}

export const getCategoryBySlugService =
  new GetCategoryBySlugService();
