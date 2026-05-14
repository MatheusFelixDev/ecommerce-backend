import type {
  Address,
  CartItem,
  Category,
  Product,
  ProductImage,
} from '../../../generated/prisma/client';

import { prisma } from '../../../infra/prisma/client';

export interface CheckoutCartItem extends CartItem {
  product: Product & {
    category: Category;
    images: ProductImage[];
  };
}

interface FindAddressByIdAndUserIdParams {
  id: string;
  userId: string;
}

export class CheckoutRepository {
  async findActiveAddressByIdAndUserId(
    params: FindAddressByIdAndUserIdParams,
  ): Promise<Address | null> {
    return prisma.address.findFirst({
      where: {
        id: params.id,
        userId: params.userId,
        isActive: true,
      },
    });
  }

  async findCartItemsByUserId(
    userId: string,
  ): Promise<CheckoutCartItem[]> {
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

export const checkoutRepository = new CheckoutRepository();
