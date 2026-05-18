import { AppError } from '../../../core/errors/app-error';

import type {
  ListStockMovementsParams,
  ListStockMovementsQuery,
} from '../dtos/list-stock-movements.dto';
import { adminStockRepository } from '../repositories/admin-stock.repository';

interface ListStockMovementsServiceRequest
  extends ListStockMovementsParams,
    ListStockMovementsQuery {}

export class ListStockMovementsService {
  async execute({
    id,
    page,
    perPage,
  }: ListStockMovementsServiceRequest) {
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

      const { movements, total } =
        await adminStockRepository.listStockMovements({
          productId: product.id,
          page,
          perPage,
        });

      return {
        movements,
        meta: {
          page,
          perPage,
          total,
          totalPages: Math.ceil(total / perPage),
        },
      };
    });
  }
}

export const listStockMovementsService =
  new ListStockMovementsService();
