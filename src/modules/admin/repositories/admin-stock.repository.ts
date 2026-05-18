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
}

export const adminStockRepository = new AdminStockRepository();
