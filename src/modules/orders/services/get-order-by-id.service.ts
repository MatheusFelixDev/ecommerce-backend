import { AppError } from '../../../core/errors/app-error';

import type { GetOrderByIdParams } from '../dtos/get-order-by-id.dto';
import { ordersRepository } from '../repositories/orders.repository';

interface GetOrderByIdServiceRequest extends GetOrderByIdParams {
  userId: string;
}

export class GetOrderByIdService {
  async execute({ id, userId }: GetOrderByIdServiceRequest) {
    const order = await ordersRepository.findByIdAndUserId({
      id,
      userId,
    });

    if (!order) {
      throw new AppError(
        'Order not found.',
        404,
        'ORDER_NOT_FOUND',
      );
    }

    return {
      id: order.id,
      status: order.status,
      paymentStatus: order.paymentStatus,
      addressId: order.addressId,
      address: {
        zipCode: order.addressZipCode,
        street: order.addressStreet,
        number: order.addressNumber,
        complement: order.addressComplement,
        neighborhood: order.addressNeighborhood,
        city: order.addressCity,
        state: order.addressState,
        country: order.addressCountry,
        recipientName: order.recipientName,
        recipientPhone: order.recipientPhone,
      },
      items: order.items,
      summary: {
        itemsCount: order.itemsCount,
        totalQuantity: order.totalQuantity,
        subtotalInCents: order.subtotalInCents,
        discountInCents: order.discountInCents,
        totalInCents: order.totalInCents,
      },
      canceledAt: order.canceledAt,
      createdAt: order.createdAt,
      updatedAt: order.updatedAt,
    };
  }
}

export const getOrderByIdService =
  new GetOrderByIdService();
