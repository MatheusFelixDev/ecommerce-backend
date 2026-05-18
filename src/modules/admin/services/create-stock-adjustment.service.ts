import { AppError } from '../../../core/errors/app-error';

import type {
  CreateStockAdjustmentBody,
  CreateStockAdjustmentParams,
} from '../dtos/create-stock-adjustment.dto';
import { adminStockRepository } from '../repositories/admin-stock.repository';

interface CreateStockAdjustmentServiceRequest
  extends CreateStockAdjustmentParams,
    CreateStockAdjustmentBody {
  adminUserId: string;
}

export class CreateStockAdjustmentService {
  async execute({
    id,
    adminUserId,
    quantityChange,
    reason,
  }: CreateStockAdjustmentServiceRequest) {
    return adminStockRepository.transaction(async (tx) => {
      const product = await adminStockRepository.findProductById(
        id,
        tx,
      );

      if (!product) {
        throw new AppError(
          'Product not found.',
          404,
          'PRODUCT_NOT_FOUND',
        );
      }

      const stockBefore = product.stock;
      const stockAfter = stockBefore + quantityChange;

      if (stockAfter < 0) {
        throw new AppError(
          'Stock adjustment cannot result in negative stock.',
          400,
          'INVALID_STOCK_ADJUSTMENT',
        );
      }

      await adminStockRepository.updateProductStock(
        product.id,
        stockAfter,
        tx,
      );

      const movement =
        await adminStockRepository.createManualStockAdjustment(
          {
            productId: product.id,
            adminUserId,
            quantityChange,
            stockBefore,
            stockAfter,
            reason,
          },
          tx,
        );

      return {
        id: movement.id,
        productId: movement.productId,
        adminUserId: movement.adminUserId,
        type: movement.type,
        quantityChange: movement.quantityChange,
        stockBefore: movement.stockBefore,
        stockAfter: movement.stockAfter,
        reason: movement.reason,
        createdAt: movement.createdAt,
      };
    });
  }
}

export const createStockAdjustmentService =
  new CreateStockAdjustmentService();
