import { AppError } from '../../../core/errors/app-error';

import { categoriesRepository } from '../repositories/categories.repository';

export class RestoreCategoryService {
  async execute(id: string) {
    const category = await categoriesRepository.findById(id);

    if (!category) {
      throw new AppError(
        'Category not found.',
        404,
        'CATEGORY_NOT_FOUND',
      );
    }

    if (category.isActive) {
      return category;
    }

    const restoredCategory =
      await categoriesRepository.restore(id);

    return restoredCategory;
  }
}

export const restoreCategoryService =
  new RestoreCategoryService();
