import type {
  Category,
  Product,
  ProductImage,
  ProductStatus,
} from '../../../generated/prisma/client';

import { prisma } from '../../../infra/prisma/client';

interface CreateProductImageData {
  url: string;
  altText?: string;
  position: number;
  isMain: boolean;
}

interface CreateProductData {
  categoryId: string;
  name: string;
  slug: string;
  description?: string;
  sku: string;
  priceInCents: number;
  discountInCents: number;
  stock: number;
  status: ProductStatus;
  images: CreateProductImageData[];
}

export interface ProductWithRelations extends Product {
  category: Category;
  images: ProductImage[];
}

export class ProductsRepository {
  async findById(id: string): Promise<Product | null> {
    return prisma.product.findUnique({
      where: {
        id,
      },
    });
  }

  async findBySlug(slug: string): Promise<Product | null> {
    return prisma.product.findUnique({
      where: {
        slug,
      },
    });
  }

  async findBySku(sku: string): Promise<Product | null> {
    return prisma.product.findUnique({
      where: {
        sku,
      },
    });
  }

  async create(
    data: CreateProductData,
  ): Promise<ProductWithRelations> {
    return prisma.product.create({
      data: {
        categoryId: data.categoryId,
        name: data.name,
        slug: data.slug,
        description: data.description,
        sku: data.sku,
        priceInCents: data.priceInCents,
        discountInCents: data.discountInCents,
        stock: data.stock,
        status: data.status,
        images: {
          create: data.images,
        },
      },
      include: {
        category: true,
        images: {
          orderBy: [
            {
              position: 'asc',
            },
            {
              createdAt: 'asc',
            },
          ],
        },
      },
    });
  }
}

export const productsRepository =
  new ProductsRepository();
