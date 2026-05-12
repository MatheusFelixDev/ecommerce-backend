import { AppError } from '../../../core/errors/app-error';

import type { ListProductsDto } from '../dtos/list-products.dto';
import { productsRepository } from '../repositories/products.repository';

export class ListProductsService {
  async execute(filters: ListProductsDto) {
    if (
      filters.minPriceInCents !== undefined &&
      filters.maxPriceInCents !== undefined &&
      filters.minPriceInCents > filters.maxPriceInCents
    ) {
      throw new AppError(
        'Minimum price cannot be greater than maximum price.',
        400,
        'INVALID_PRICE_RANGE',
      );
    }

    const { products, total } =
      await productsRepository.findMany({
        page: filters.page,
        perPage: filters.perPage,
        search: filters.search,
        categoryId: filters.categoryId,
        categorySlug: filters.categorySlug,
        minPriceInCents: filters.minPriceInCents,
        maxPriceInCents: filters.maxPriceInCents,
        inStock: filters.inStock,
        sortBy: filters.sortBy,
        sortOrder: filters.sortOrder,
      });

    const totalPages = Math.ceil(total / filters.perPage);

    return {
      products,
      meta: {
        page: filters.page,
        perPage: filters.perPage,
        total,
        totalPages,
      },
    };
  }
}

export const listProductsService =
  new ListProductsService();
