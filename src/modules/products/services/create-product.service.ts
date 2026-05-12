import { AppError } from '../../../core/errors/app-error';
import { categoriesRepository } from '../../categories/repositories/categories.repository';

import type { CreateProductDto } from '../dtos/create-product.dto';
import { productsRepository } from '../repositories/products.repository';
import { generateSlug } from '../utils/generate-slug';

export class CreateProductService {
  async execute(data: CreateProductDto) {
    const category = await categoriesRepository.findById(
      data.categoryId,
    );

    if (!category || !category.isActive) {
      throw new AppError(
        'Category not found.',
        404,
        'CATEGORY_NOT_FOUND',
      );
    }

    if (data.discountInCents >= data.priceInCents) {
      throw new AppError(
        'Discount must be lower than product price.',
        400,
        'INVALID_PRODUCT_DISCOUNT',
      );
    }

    const slug = generateSlug(data.name);

    const productAlreadyExists =
      await productsRepository.findBySlug(slug);

    if (productAlreadyExists) {
      throw new AppError(
        'Product already exists.',
        409,
        'PRODUCT_ALREADY_EXISTS',
      );
    }

    const normalizedSku = data.sku.trim().toUpperCase();

    const skuAlreadyExists =
      await productsRepository.findBySku(normalizedSku);

    if (skuAlreadyExists) {
      throw new AppError(
        'Product SKU already exists.',
        409,
        'PRODUCT_SKU_ALREADY_EXISTS',
      );
    }

    let hasMainImage = false;

    const images = data.images.map((image, index) => {
      const isMain = image.isMain === true && !hasMainImage;

      if (isMain) {
        hasMainImage = true;
      }

      return {
        url: image.url,
        altText: image.altText,
        position: image.position ?? index,
        isMain,
      };
    });

    if (images.length > 0 && !hasMainImage) {
      images[0].isMain = true;
    }

    const product = await productsRepository.create({
      categoryId: data.categoryId,
      name: data.name,
      slug,
      description: data.description,
      sku: normalizedSku,
      priceInCents: data.priceInCents,
      discountInCents: data.discountInCents,
      stock: data.stock,
      status: data.status,
      images,
    });

    return product;
  }
}

export const createProductService =
  new CreateProductService();
