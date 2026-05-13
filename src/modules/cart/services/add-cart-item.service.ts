import { AppError } from '../../../core/errors/app-error';

import type { AddCartItemBody } from '../dtos/add-cart-item.dto';
import { cartRepository } from '../repositories/cart.repository';
import { listCartService } from './list-cart.service';

interface AddCartItemServiceRequest extends AddCartItemBody {
  userId: string;
}

export class AddCartItemService {
  async execute({
    userId,
    productId,
    quantity,
  }: AddCartItemServiceRequest) {
    if (quantity <= 0) {
      throw new AppError(
        'Cart item quantity must be greater than zero.',
        400,
        'INVALID_CART_QUANTITY',
      );
    }

    const product =
      await cartRepository.findProductById(productId);

    if (!product) {
      throw new AppError(
        'Product not found.',
        404,
        'PRODUCT_NOT_FOUND',
      );
    }

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

    const cartItem =
      await cartRepository.findByUserIdAndProductId({
        userId,
        productId,
      });

    const totalQuantity = cartItem
      ? cartItem.quantity + quantity
      : quantity;

    if (totalQuantity > product.stock) {
      throw new AppError(
        'Insufficient product stock.',
        400,
        'INSUFFICIENT_STOCK',
      );
    }

    if (cartItem) {
      await cartRepository.updateQuantity({
        id: cartItem.id,
        quantity: totalQuantity,
      });
    } else {
      await cartRepository.create({
        userId,
        productId,
        quantity,
      });
    }

    return listCartService.execute({
      userId,
    });
  }
}

export const addCartItemService =
  new AddCartItemService();
