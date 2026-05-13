import type {
  Address,
  CartItem,
  Category,
  Order,
  OrderItem,
  Prisma,
  Product,
  ProductImage,
} from '../../../generated/prisma/client';

import { prisma } from '../../../infra/prisma/client';

export interface CartItemWithCheckoutProduct extends CartItem {
  product: Product & {
    category: Category;
    images: ProductImage[];
  };
}

export interface OrderWithItems extends Order {
  items: OrderItem[];
}

interface FindAddressByIdAndUserIdParams {
  id: string;
  userId: string;
}

interface UpdateProductStockForOrderParams {
  productId: string;
  quantity: number;
}

interface CreateOrderItemData {
  productId: string;
  productName: string;
  productSlug: string;
  productSku: string;
  productImageUrl?: string | null;
  quantity: number;
  unitPriceInCents: number;
  unitDiscountInCents: number;
  subtotalInCents: number;
  discountInCents: number;
  totalInCents: number;
}

interface CreateOrderData {
  userId: string;
  addressId: string;
  itemsCount: number;
  totalQuantity: number;
  subtotalInCents: number;
  discountInCents: number;
  totalInCents: number;
  addressZipCode: string;
  addressStreet: string;
  addressNumber: string;
  addressComplement?: string | null;
  addressNeighborhood: string;
  addressCity: string;
  addressState: string;
  addressCountry: string;
  recipientName?: string | null;
  recipientPhone?: string | null;
  items: CreateOrderItemData[];
}

export class OrdersRepository {
  async transaction<T>(
    callback: (tx: Prisma.TransactionClient) => Promise<T>,
  ): Promise<T> {
    return prisma.$transaction(callback);
  }

  async findActiveAddressByIdAndUserId(
    params: FindAddressByIdAndUserIdParams,
    tx: Prisma.TransactionClient,
  ): Promise<Address | null> {
    return tx.address.findFirst({
      where: {
        id: params.id,
        userId: params.userId,
        isActive: true,
      },
    });
  }

  async findCartItemsByUserId(
    userId: string,
    tx: Prisma.TransactionClient,
  ): Promise<CartItemWithCheckoutProduct[]> {
    return tx.cartItem.findMany({
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

  async updateProductStockForOrder(
    params: UpdateProductStockForOrderParams,
    tx: Prisma.TransactionClient,
  ): Promise<number> {
    const result = await tx.product.updateMany({
      where: {
        id: params.productId,
        isActive: true,
        status: 'ACTIVE',
        stock: {
          gte: params.quantity,
        },
        category: {
          isActive: true,
        },
      },
      data: {
        stock: {
          decrement: params.quantity,
        },
        salesCount: {
          increment: params.quantity,
        },
      },
    });

    return result.count;
  }

  async create(
    data: CreateOrderData,
    tx: Prisma.TransactionClient,
  ): Promise<OrderWithItems> {
    return tx.order.create({
      data: {
        userId: data.userId,
        addressId: data.addressId,
        itemsCount: data.itemsCount,
        totalQuantity: data.totalQuantity,
        subtotalInCents: data.subtotalInCents,
        discountInCents: data.discountInCents,
        totalInCents: data.totalInCents,
        addressZipCode: data.addressZipCode,
        addressStreet: data.addressStreet,
        addressNumber: data.addressNumber,
        addressComplement: data.addressComplement,
        addressNeighborhood: data.addressNeighborhood,
        addressCity: data.addressCity,
        addressState: data.addressState,
        addressCountry: data.addressCountry,
        recipientName: data.recipientName,
        recipientPhone: data.recipientPhone,
        items: {
          create: data.items.map((item) => ({
            productId: item.productId,
            productName: item.productName,
            productSlug: item.productSlug,
            productSku: item.productSku,
            productImageUrl: item.productImageUrl,
            quantity: item.quantity,
            unitPriceInCents: item.unitPriceInCents,
            unitDiscountInCents: item.unitDiscountInCents,
            subtotalInCents: item.subtotalInCents,
            discountInCents: item.discountInCents,
            totalInCents: item.totalInCents,
          })),
        },
      },
      include: {
        items: true,
      },
    });
  }

  async deleteCartItemsByUserId(
    userId: string,
    tx: Prisma.TransactionClient,
  ): Promise<void> {
    await tx.cartItem.deleteMany({
      where: {
        userId,
      },
    });
  }
}

export const ordersRepository = new OrdersRepository();
