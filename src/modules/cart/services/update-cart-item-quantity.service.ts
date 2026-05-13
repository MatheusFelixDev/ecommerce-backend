import { AppError } from '../../../core/errors/app-error';

import type {
  UpdateCartItemQuantityBody,
  UpdateCartItemQuantityParams,
} from '../dtos/update-cart-item-quantity.dto';
import { cartRepository } from '../repositories/cart.repository';
import { listCartService } from './list-cart.service';

interface UpdateCartItemQuantityServiceRequest
  extends UpdateCartItemQuantityParams,
    UpdateCartItemQuantityBody {
  userId: string;
}

export class UpdateCartItemQuantityService {
  async execute({
    id,
    userId,
    quantity,
  }: UpdateCartItemQuantityServiceRequest) {
    if (quantity <= 0) {
      throw new AppError(
        'Cart item quantity must be greater than zero.',
        400,
        'INVALID_CART_QUANTITY',
      );
    }

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

    const product = cartItem.product;

    if (
      !product.isActive ||
      product.status !== 'ACTIVE' ||
      !product.category.isActive
    ) {
      throw new AppError(
        'Product is unavailable.',
        400,
        'PRODUCT_UNAVAILABLE',
      );
    }

    if (quantity > product.stock) {
      throw new AppError(
        'Insufficient product stock.',
        400,
        'INSUFFICIENT_STOCK',
      );
    }

    await cartRepository.updateQuantity({
      id: cartItem.id,
      quantity,
    });

    return listCartService.execute({
      userId,
    });
  }
}

export const updateCartItemQuantityService =
  new UpdateCartItemQuantityService();
