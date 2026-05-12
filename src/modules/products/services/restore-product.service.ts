import { AppError } from '../../../core/errors/app-error';

import type { RestoreProductParamsDto } from '../dtos/restore-product.dto';
import { productsRepository } from '../repositories/products.repository';

export class RestoreProductService {
  async execute(params: RestoreProductParamsDto) {
    const product = await productsRepository.findById(params.id);

    if (!product) {
      throw new AppError(
        'Product not found.',
        404,
        'PRODUCT_NOT_FOUND',
      );
    }

    if (product.isActive) {
      throw new AppError(
        'Product is already active.',
        409,
        'PRODUCT_ALREADY_ACTIVE',
      );
    }

    const restoredProduct = await productsRepository.restore(
      params.id,
    );

    return restoredProduct;
  }
}

export const restoreProductService =
  new RestoreProductService();
