import type { OrderStatus } from '../../../generated/prisma/client';

import { AppError } from '../../../core/errors/app-error';

import type {
  UpdateOrderStatusBody,
  UpdateOrderStatusParams,
} from '../dtos/update-order-status.dto';
import { ordersRepository } from '../repositories/orders.repository';

type FulfillmentOrderStatus = UpdateOrderStatusBody['status'];

interface UpdateOrderStatusServiceRequest
  extends UpdateOrderStatusParams,
    UpdateOrderStatusBody {}

const allowedTransitions: Record<
  OrderStatus,
  FulfillmentOrderStatus[]
> = {
  PENDING: [],
  PAID: ['PROCESSING'],
  PROCESSING: ['SEPARATED'],
  SEPARATED: ['SHIPPED'],
  SHIPPED: ['DELIVERED'],
  DELIVERED: [],
  CANCELED: [],
};

export class UpdateOrderStatusService {
  async execute({
    id,
    status,
    trackingCode,
    trackingUrl,
  }: UpdateOrderStatusServiceRequest) {
    return ordersRepository.transaction(async (tx) => {
      const order = await ordersRepository.findById(id, tx);

      if (!order) {
        throw new AppError(
          'Order not found.',
          404,
          'ORDER_NOT_FOUND',
        );
      }

      if (order.status === 'CANCELED') {
        throw new AppError(
          'Canceled order cannot be updated.',
          400,
          'ORDER_ALREADY_CANCELED',
        );
      }

      if (order.paymentStatus !== 'PAID') {
        throw new AppError(
          'Order payment is not approved.',
          400,
          'ORDER_PAYMENT_NOT_APPROVED',
        );
      }

      const nextStatuses = allowedTransitions[order.status];

      if (!nextStatuses.includes(status)) {
        throw new AppError(
          'Order status transition is not allowed.',
          400,
          'ORDER_STATUS_TRANSITION_NOT_ALLOWED',
        );
      }

      if (
        status !== 'SHIPPED' &&
        (trackingCode !== undefined || trackingUrl !== undefined)
      ) {
        throw new AppError(
          'Tracking data can only be updated when shipping the order.',
          400,
          'ORDER_TRACKING_ONLY_ALLOWED_WHEN_SHIPPED',
        );
      }

      if (status === 'SHIPPED' && !trackingCode) {
        throw new AppError(
          'Tracking code is required to ship the order.',
          400,
          'TRACKING_CODE_REQUIRED',
        );
      }

      const now = new Date();

      const updatedOrder =
        await ordersRepository.updateFulfillmentStatus(
          {
            id: order.id,
            status,
            trackingCode:
              trackingCode === undefined ? undefined : trackingCode,
            trackingUrl:
              trackingUrl === undefined ? undefined : trackingUrl,
            processingAt:
              status === 'PROCESSING' && !order.processingAt
                ? now
                : undefined,
            separatedAt:
              status === 'SEPARATED' && !order.separatedAt
                ? now
                : undefined,
            shippedAt:
              status === 'SHIPPED' && !order.shippedAt
                ? now
                : undefined,
            deliveredAt:
              status === 'DELIVERED' && !order.deliveredAt
                ? now
                : undefined,
          },
          tx,
        );

      return {
        id: updatedOrder.id,
        status: updatedOrder.status,
        paymentStatus: updatedOrder.paymentStatus,
        paymentMethod: updatedOrder.paymentMethod,
        tracking: {
          code: updatedOrder.trackingCode,
          url: updatedOrder.trackingUrl,
          processingAt: updatedOrder.processingAt,
          separatedAt: updatedOrder.separatedAt,
          shippedAt: updatedOrder.shippedAt,
          deliveredAt: updatedOrder.deliveredAt,
        },
        canceledAt: updatedOrder.canceledAt,
        createdAt: updatedOrder.createdAt,
        updatedAt: updatedOrder.updatedAt,
      };
    });
  }
}

export const updateOrderStatusService =
  new UpdateOrderStatusService();
