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

export class CartRepository {
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
}

export const cartRepository = new CartRepository();
