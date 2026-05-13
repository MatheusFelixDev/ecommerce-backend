import { AppError } from '../../../core/errors/app-error';

import type { CreateOrderBody } from '../dtos/create-order.dto';

interface CreateOrderServiceRequest extends CreateOrderBody {
  userId: string;
}

export class CreateOrderService {
  async execute(_request: CreateOrderServiceRequest): Promise<never> {
    throw new AppError(
      'Create order endpoint is not implemented yet.',
      501,
      'ORDER_CHECKOUT_NOT_IMPLEMENTED',
    );
  }
}

export const createOrderService = new CreateOrderService();
