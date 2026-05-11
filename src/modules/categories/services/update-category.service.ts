import { AppError } from '../../../core/errors/app-error';

import type { UpdateCategoryDto } from '../dtos/update-category.dto';
import { categoriesRepository } from '../repositories/categories.repository';
import { generateSlug } from '../utils/generate-slug';

export class UpdateCategoryService {
  async execute(id: string, data: UpdateCategoryDto) {
    const category = await categoriesRepository.findById(id);

    if (!category || !category.isActive) {
      throw new AppError(
        'Category not found.',
        404,
        'CATEGORY_NOT_FOUND',
      );
    }

    let slug: string | undefined;

    if (data.name) {
      slug = generateSlug(data.name);

      const categoryWithSameSlug =
        await categoriesRepository.findBySlug(slug);

      if (
        categoryWithSameSlug &&
        categoryWithSameSlug.id !== id
      ) {
        throw new AppError(
          'Category already exists.',
          409,
          'CATEGORY_ALREADY_EXISTS',
        );
      }
    }

    const updatedCategory = await categoriesRepository.update(
      id,
      {
        name: data.name,
        slug,
        description: data.description,
      },
    );

    return updatedCategory;
  }
}

export const updateCategoryService =
  new UpdateCategoryService();
