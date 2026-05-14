import { AppError } from '../../../core/errors/app-error';

import type { CancelOrderParams } from '../dtos/cancel-order.dto';
import { ordersRepository } from '../repositories/orders.repository';

interface CancelOrderServiceRequest extends CancelOrderParams {
  userId: string;
}

export class CancelOrderService {
  async execute({ id, userId }: CancelOrderServiceRequest) {
    return ordersRepository.transaction(async (tx) => {
      const order = await ordersRepository.findByIdAndUserId(
        {
          id,
          userId,
        },
        tx,
      );

      if (!order) {
        throw new AppError(
          'Order not found.',
          404,
          'ORDER_NOT_FOUND',
        );
      }

      if (order.status !== 'PENDING') {
        throw new AppError(
          'Order cannot be canceled.',
          400,
          'ORDER_CANNOT_BE_CANCELED',
        );
      }

      for (const item of order.items) {
        await ordersRepository.restoreProductStockAfterCancel(
          {
            productId: item.productId,
            quantity: item.quantity,
          },
          tx,
        );
      }

      const canceledOrder = await ordersRepository.cancelById(
        order.id,
        tx,
      );

      return {
        id: canceledOrder.id,
        status: canceledOrder.status,
        paymentStatus: canceledOrder.paymentStatus,
        addressId: canceledOrder.addressId,
        address: {
          zipCode: canceledOrder.addressZipCode,
          street: canceledOrder.addressStreet,
          number: canceledOrder.addressNumber,
          complement: canceledOrder.addressComplement,
          neighborhood: canceledOrder.addressNeighborhood,
          city: canceledOrder.addressCity,
          state: canceledOrder.addressState,
          country: canceledOrder.addressCountry,
          recipientName: canceledOrder.recipientName,
          recipientPhone: canceledOrder.recipientPhone,
        },
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

export const cancelOrderService = new CancelOrderService();
