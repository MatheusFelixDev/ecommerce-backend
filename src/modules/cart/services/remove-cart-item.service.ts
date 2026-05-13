import { AppError } from '../../../core/errors/app-error';

import type { UpdateCartItemQuantityParams } from '../dtos/update-cart-item-quantity.dto';
import { cartRepository } from '../repositories/cart.repository';
import { listCartService } from './list-cart.service';

interface RemoveCartItemServiceRequest
  extends UpdateCartItemQuantityParams {
  userId: string;
}

export class RemoveCartItemService {
  async execute({
    id,
    userId,
  }: RemoveCartItemServiceRequest) {
    const cartItem =
      await cartRepository.findByIdAndUserId({
        id,
        userId,
      });

    if (!cartItem) {
      throw new AppError(
        'Cart item not found.',
        404,
        'CART_ITEM_NOT_FOUND',
      );
    }

    await cartRepository.deleteById(cartItem.id);

    return listCartService.execute({
      userId,
    });
  }
}

export const removeCartItemService =
  new RemoveCartItemService();
