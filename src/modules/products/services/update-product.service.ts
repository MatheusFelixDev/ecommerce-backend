import { AppError } from '../../../core/errors/app-error';
import { categoriesRepository } from '../../categories/repositories/categories.repository';

import type {
  UpdateProductBodyDto,
  UpdateProductParamsDto,
} from '../dtos/update-product.dto';
import { productsRepository } from '../repositories/products.repository';
import { generateSlug } from '../utils/generate-slug';

export class UpdateProductService {
  async execute(
    params: UpdateProductParamsDto,
    data: UpdateProductBodyDto,
  ) {
    const hasData = Object.keys(data).length > 0;

    if (!hasData) {
      throw new AppError(
        'At least one field must be provided.',
        400,
        'EMPTY_UPDATE_PAYLOAD',
      );
    }

    const product = await productsRepository.findById(params.id);

    if (!product) {
      throw new AppError(
        'Product not found.',
        404,
        'PRODUCT_NOT_FOUND',
      );
    }

    if (data.categoryId) {
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
    }

    const priceInCents =
      data.priceInCents ?? product.priceInCents;

    const discountInCents =
      data.discountInCents ?? product.discountInCents;

    if (discountInCents >= priceInCents) {
      throw new AppError(
        'Discount must be lower than product price.',
        400,
        'INVALID_PRODUCT_DISCOUNT',
      );
    }

    let slug: string | undefined;

    if (data.name) {
      slug = generateSlug(data.name);

      if (slug !== product.slug) {
        const productWithSameSlug =
          await productsRepository.findBySlug(slug);

        if (
          productWithSameSlug &&
          productWithSameSlug.id !== product.id
        ) {
          throw new AppError(
            'Product already exists.',
            409,
            'PRODUCT_ALREADY_EXISTS',
          );
        }
      }
    }

    let sku: string | undefined;

    if (data.sku) {
      sku = data.sku.trim().toUpperCase();

      if (sku !== product.sku) {
        const productWithSameSku =
          await productsRepository.findBySku(sku);

        if (
          productWithSameSku &&
          productWithSameSku.id !== product.id
        ) {
          throw new AppError(
            'Product SKU already exists.',
            409,
            'PRODUCT_SKU_ALREADY_EXISTS',
          );
        }
      }
    }

    let images:
      | {
          url: string;
          altText?: string;
          position: number;
          isMain: boolean;
        }[]
      | undefined;

    if (data.images !== undefined) {
      let hasMainImage = false;

      images = data.images.map((image, index) => {
        const isMain =
          image.isMain === true && !hasMainImage;

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
    }

    const updatedProduct = await productsRepository.update(
      params.id,
      {
        categoryId: data.categoryId,
        name: data.name,
        slug,
        description: data.description,
        sku,
        priceInCents: data.priceInCents,
        discountInCents: data.discountInCents,
        stock: data.stock,
        status: data.status,
        images,
      },
    );

    return updatedProduct;
  }
}

export const updateProductService =
  new UpdateProductService();
