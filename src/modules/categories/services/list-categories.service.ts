import { categoriesRepository } from '../repositories/categories.repository';

export class ListCategoriesService {
  async execute() {
    return categoriesRepository.findMany();
  }
}

export const listCategoriesService =
  new ListCategoriesService();
