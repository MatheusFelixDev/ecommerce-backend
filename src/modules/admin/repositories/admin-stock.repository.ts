import type {
  Prisma,
  Product,
  ProductStockMovement,
} from '../../../generated/prisma/client';

import { prisma } from '../../../infra/prisma/client';

interface CreateManualStockAdjustmentParams {
  productId: string;
  adminUserId: string;
  quantityChange: number;
  stockBefore: number;
  stockAfter: number;
  reason: string;
}

interface ListStockMovementsParams {
  productId: string;
  page: number;
  perPage: number;
}

interface ListStockMovementsResult {
  movements: ProductStockMovement[];
  total: number;
}

export class AdminStockRepository {
  async transaction<T>(
    callback: (tx: Prisma.TransactionClient) => Promise<T>,
  ): Promise<T> {
    return prisma.$transaction(callback);
  }

  async findProductById(
    productId: string,
    tx: Prisma.TransactionClient,
  ): Promise<Product | null> {
    return tx.product.findUnique({
      where: {
        id: productId,
      },
    });
  }

  async updateProductStock(
    productId: string,
    stock: number,
    tx: Prisma.TransactionClient,
  ): Promise<Product> {
    return tx.product.update({
      where: {
        id: productId,
      },
      data: {
        stock,
      },
    });
  }

  async createManualStockAdjustment(
    params: CreateManualStockAdjustmentParams,
    tx: Prisma.TransactionClient,
  ): Promise<ProductStockMovement> {
    return tx.productStockMovement.create({
      data: {
        productId: params.productId,
        adminUserId: params.adminUserId,
        type: 'MANUAL_ADJUSTMENT',
        quantityChange: params.quantityChange,
        stockBefore: params.stockBefore,
        stockAfter: params.stockAfter,
        reason: params.reason,
      },
    });
  }

  async listStockMovements(
    params: ListStockMovementsParams,
  ): Promise<ListStockMovementsResult> {
    const skip = (params.page - 1) * params.perPage;

    const where: Prisma.ProductStockMovementWhereInput = {
      productId: params.productId,
    };

    const [movements, total] = await prisma.$transaction([
      prisma.productStockMovement.findMany({
        where,
        orderBy: {
          createdAt: 'desc',
        },
        skip,
        take: params.perPage,
      }),
      prisma.productStockMovement.count({
        where,
      }),
    ]);

    return {
      movements,
      total,
    };
  }
}

export const adminStockRepository = new AdminStockRepository();
