import type {
  Category,
  Prisma,
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

interface UpdateProductImageData {
  url: string;
  altText?: string;
  position: number;
  isMain: boolean;
}

interface UpdateProductData {
  categoryId?: string;
  name?: string;
  slug?: string;
  description?: string | null;
  sku?: string;
  priceInCents?: number;
  discountInCents?: number;
  stock?: number;
  status?: ProductStatus;
  images?: UpdateProductImageData[];
}

export interface ListProductsFilters {
  page: number;
  perPage: number;
  search?: string;
  categoryId?: string;
  categorySlug?: string;
  minPriceInCents?: number;
  maxPriceInCents?: number;
  inStock?: boolean;
  sortBy: 'recent' | 'price' | 'best_selling';
  sortOrder: 'asc' | 'desc';
}

export interface ListProductsResult {
  products: ProductWithRelations[];
  total: number;
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

  async findMany(
    filters: ListProductsFilters,
  ): Promise<ListProductsResult> {
    const where: Prisma.ProductWhereInput = {
      isActive: true,
      status: 'ACTIVE',
      category: {
        isActive: true,
      },
    };

    if (filters.search) {
      where.OR = [
        {
          name: {
            contains: filters.search,
            mode: 'insensitive',
          },
        },
        {
          sku: {
            contains: filters.search,
            mode: 'insensitive',
          },
        },
        {
          description: {
            contains: filters.search,
            mode: 'insensitive',
          },
        },
      ];
    }

    if (filters.categoryId || filters.categorySlug) {
      where.category = {
        isActive: true,
        ...(filters.categoryId
          ? {
              id: filters.categoryId,
            }
          : {}),
        ...(filters.categorySlug
          ? {
              slug: filters.categorySlug,
            }
          : {}),
      };
    }

    if (
      filters.minPriceInCents !== undefined ||
      filters.maxPriceInCents !== undefined
    ) {
      where.priceInCents = {
        ...(filters.minPriceInCents !== undefined
          ? {
              gte: filters.minPriceInCents,
            }
          : {}),
        ...(filters.maxPriceInCents !== undefined
          ? {
              lte: filters.maxPriceInCents,
            }
          : {}),
      };
    }

    if (filters.inStock !== undefined) {
      where.stock = filters.inStock
        ? {
            gt: 0,
          }
        : {
            equals: 0,
          };
    }

    const orderBy: Prisma.ProductOrderByWithRelationInput =
      filters.sortBy === 'price'
        ? {
            priceInCents: filters.sortOrder,
          }
        : filters.sortBy === 'best_selling'
          ? {
              salesCount: filters.sortOrder,
            }
          : {
              createdAt: filters.sortOrder,
            };

    const skip = (filters.page - 1) * filters.perPage;

    const [products, total] = await prisma.$transaction([
      prisma.product.findMany({
        where,
        orderBy,
        skip,
        take: filters.perPage,
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
      }),
      prisma.product.count({
        where,
      }),
    ]);

    return {
      products,
      total,
    };
  }

  async findPublicBySlug(
    slug: string,
  ): Promise<ProductWithRelations | null> {
    return prisma.product.findFirst({
      where: {
        slug,
        isActive: true,
        status: 'ACTIVE',
        category: {
          isActive: true,
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

  async findRelatedProducts(params: {
    productId: string;
    categoryId: string;
    limit: number;
  }): Promise<ProductWithRelations[]> {
    return prisma.product.findMany({
      where: {
        id: {
          not: params.productId,
        },
        categoryId: params.categoryId,
        isActive: true,
        status: 'ACTIVE',
        category: {
          isActive: true,
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
      take: params.limit,
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

  async update(
    id: string,
    data: UpdateProductData,
  ): Promise<ProductWithRelations> {
    return prisma.$transaction(async (transaction) => {
      if (data.images !== undefined) {
        await transaction.productImage.deleteMany({
          where: {
            productId: id,
          },
        });
      }

      return transaction.product.update({
        where: {
          id,
        },
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
          ...(data.images !== undefined
            ? {
                images: {
                  create: data.images,
                },
              }
            : {}),
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
