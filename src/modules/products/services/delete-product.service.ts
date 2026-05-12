import { AppError } from '../../../core/errors/app-error';

import type { DeleteProductParamsDto } from '../dtos/delete-product.dto';
import { productsRepository } from '../repositories/products.repository';

export class DeleteProductService {
  async execute(params: DeleteProductParamsDto) {
    const product = await productsRepository.findById(params.id);

    if (!product) {
      throw new AppError(
        'Product not found.',
        404,
        'PRODUCT_NOT_FOUND',
      );
    }

    if (!product.isActive) {
      throw new AppError(
        'Product is already inactive.',
        409,
        'PRODUCT_ALREADY_INACTIVE',
      );
    }

    const deletedProduct = await productsRepository.softDelete(
      params.id,
    );

    return deletedProduct;
  }
}

export const deleteProductService =
  new DeleteProductService();
