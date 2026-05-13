import type {
  CartItem,
  Category,
  Product,
  ProductImage,
} from '../../../generated/prisma/client';

import { prisma } from '../../../infra/prisma/client';

export interface CartItemWithProduct extends CartItem {
  product: Product & {
    category: Category;
    images: ProductImage[];
  };
}

export interface ProductWithCartRelations extends Product {
  category: Category;
  images: ProductImage[];
}

interface CreateCartItemData {
  userId: string;
  productId: string;
  quantity: number;
}

interface UpdateCartItemQuantityData {
  id: string;
  quantity: number;
}

export class CartRepository {
  async findProductById(
    productId: string,
  ): Promise<ProductWithCartRelations | null> {
    return prisma.product.findUnique({
      where: {
        id: productId,
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

  async findByUserIdAndProductId(params: {
    userId: string;
    productId: string;
  }): Promise<CartItem | null> {
    return prisma.cartItem.findUnique({
      where: {
        userId_productId: {
          userId: params.userId,
          productId: params.productId,
        },
      },
    });
  }

  async findByIdAndUserId(params: {
    id: string;
    userId: string;
  }): Promise<CartItemWithProduct | null> {
    return prisma.cartItem.findFirst({
      where: {
        id: params.id,
        userId: params.userId,
      },
      include: {
        product: {
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
        },
      },
    });
  }

  async findManyByUserId(
    userId: string,
  ): Promise<CartItemWithProduct[]> {
    return prisma.cartItem.findMany({
      where: {
        userId,
      },
      orderBy: {
        createdAt: 'asc',
      },
      include: {
        product: {
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
        },
      },
    });
  }

  async create(data: CreateCartItemData): Promise<CartItem> {
    return prisma.cartItem.create({
      data,
    });
  }

  async updateQuantity(
    data: UpdateCartItemQuantityData,
  ): Promise<CartItem> {
    return prisma.cartItem.update({
      where: {
        id: data.id,
      },
      data: {
        quantity: data.quantity,
      },
    });
  }

  async deleteById(id: string): Promise<CartItem> {
    return prisma.cartItem.delete({
      where: {
        id,
      },
    });
  }

  async deleteManyByUserId(userId: string): Promise<void> {
    await prisma.cartItem.deleteMany({
      where: {
        userId,
      },
    });
  }
}

export const cartRepository = new CartRepository();
