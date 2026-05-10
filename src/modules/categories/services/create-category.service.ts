import { AppError } from '../../../core/errors/app-error';

import type { CreateCategoryDto } from '../dtos/create-category.dto';
import { categoriesRepository } from '../repositories/categories.repository';
import { generateSlug } from '../utils/generate-slug';

export class CreateCategoryService {
  async execute(data: CreateCategoryDto) {
    const slug = generateSlug(data.name);

    const categoryAlreadyExists =
      await categoriesRepository.findBySlug(slug);

    if (categoryAlreadyExists) {
      throw new AppError(
        'Category already exists.',
        409,
        'CATEGORY_ALREADY_EXISTS',
      );
    }

    const category = await categoriesRepository.create({
      name: data.name,
      slug,
      description: data.description,
    });

    return category;
  }
}

export const createCategoryService =
  new CreateCategoryService();
