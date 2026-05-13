import type { ListOrdersQuery } from '../dtos/list-orders.dto';
import { ordersRepository } from '../repositories/orders.repository';

interface ListOrdersServiceRequest extends ListOrdersQuery {
  userId: string;
}

export class ListOrdersService {
  async execute({
    userId,
    page,
    perPage,
    status,
  }: ListOrdersServiceRequest) {
    const { orders, total } =
      await ordersRepository.findManyByUserId({
        userId,
        page,
        perPage,
        status,
      });

    const totalPages = Math.ceil(total / perPage);

    return {
      orders: orders.map((order) => ({
        id: order.id,
        status: order.status,
        paymentStatus: order.paymentStatus,
        itemsCount: order.itemsCount,
        totalQuantity: order.totalQuantity,
        subtotalInCents: order.subtotalInCents,
        discountInCents: order.discountInCents,
        totalInCents: order.totalInCents,
        createdAt: order.createdAt,
      })),
      meta: {
        page,
        perPage,
        total,
        totalPages,
      },
    };
  }
}

export const listOrdersService = new ListOrdersService();
