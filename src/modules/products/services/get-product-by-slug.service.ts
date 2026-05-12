import { AppError } from '../../../core/errors/app-error';

import type { GetProductBySlugParamsDto } from '../dtos/get-product-by-slug.dto';
import { productsRepository } from '../repositories/products.repository';

export class GetProductBySlugService {
  async execute(params: GetProductBySlugParamsDto) {
    const product = await productsRepository.findPublicBySlug(
      params.slug,
    );

    if (!product) {
      throw new AppError(
        'Product not found.',
        404,
        'PRODUCT_NOT_FOUND',
      );
    }

    const relatedProducts =
      await productsRepository.findRelatedProducts({
        productId: product.id,
        categoryId: product.categoryId,
        limit: 4,
      });

    return {
      product,
      relatedProducts,
    };
  }
}

export const getProductBySlugService =
  new GetProductBySlugService();
