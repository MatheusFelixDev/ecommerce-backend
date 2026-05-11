import { AppError } from '../../../core/errors/app-error';

import { categoriesRepository } from '../repositories/categories.repository';

export class DeleteCategoryService {
  async execute(id: string) {
    const category = await categoriesRepository.findById(id);

    if (!category || !category.isActive) {
      throw new AppError(
        'Category not found.',
        404,
        'CATEGORY_NOT_FOUND',
      );
    }

    await categoriesRepository.softDelete(id);
  }
}

export const deleteCategoryService =
  new DeleteCategoryService();
