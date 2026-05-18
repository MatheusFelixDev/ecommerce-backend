import { AppError } from '../../../core/errors/app-error';
import { ordersRepository } from '../../orders/repositories/orders.repository';
import type { CancelOrderParams } from '../../orders/dtos/cancel-order.dto';

export class AdminCancelOrderService {
  async execute(params: CancelOrderParams) {
    return ordersRepository.transaction(async (tx) => {
      const order = await ordersRepository.findById(params.id, tx);

      if (!order) {
        throw new AppError(
          'Order not found.',
          404,
          'ORDER_NOT_FOUND',
        );
      }

      if (order.status === 'CANCELED') {
        throw new AppError(
          'Order is already canceled.',
          409,
          'ORDER_ALREADY_CANCELED',
        );
      }

      if (order.status !== 'PENDING') {
        throw new AppError(
          'Only pending orders can be canceled by admin without refund flow.',
          400,
          'ADMIN_ORDER_CANNOT_BE_CANCELED',
        );
      }

      const orderWithItems = await ordersRepository.findByIdAndUserId(
        {
          id: order.id,
          userId: order.userId,
        },
        tx,
      );

      if (!orderWithItems) {
        throw new AppError(
          'Order not found.',
          404,
          'ORDER_NOT_FOUND',
        );
      }

      for (const item of orderWithItems.items) {
        await ordersRepository.restoreProductStockAfterCancel(
          {
            productId: item.productId,
            quantity: item.quantity,
          },
          tx,
        );
      }

      const canceledOrder = await ordersRepository.cancelById(
        orderWithItems.id,
        tx,
      );

      return {
        id: canceledOrder.id,
        userId: canceledOrder.userId,
        status: canceledOrder.status,
        paymentStatus: canceledOrder.paymentStatus,
        addressId: canceledOrder.addressId,
        items: canceledOrder.items,
        summary: {
          itemsCount: canceledOrder.itemsCount,
          totalQuantity: canceledOrder.totalQuantity,
          subtotalInCents: canceledOrder.subtotalInCents,
          discountInCents: canceledOrder.discountInCents,
          totalInCents: canceledOrder.totalInCents,
        },
        canceledAt: canceledOrder.canceledAt,
        createdAt: canceledOrder.createdAt,
        updatedAt: canceledOrder.updatedAt,
      };
    });
  }
}

export const adminCancelOrderService =
  new AdminCancelOrderService();
