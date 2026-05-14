import { AppError } from '../../../core/errors/app-error';

import type { CalculateShippingBody } from '../dtos/calculate-shipping.dto';
import { melhorEnvioShippingProvider } from '../providers/melhor-envio-shipping.provider';
import { checkoutRepository } from '../repositories/checkout.repository';

interface CalculateShippingServiceRequest
  extends CalculateShippingBody {
  userId: string;
}

export class CalculateShippingService {
  async execute({
    userId,
    addressId,
  }: CalculateShippingServiceRequest) {
    const address =
      await checkoutRepository.findActiveAddressByIdAndUserId({
        id: addressId,
        userId,
      });

    if (!address) {
      throw new AppError(
        'Address not found.',
        404,
        'ADDRESS_NOT_FOUND',
      );
    }

    const cartItems =
      await checkoutRepository.findCartItemsByUserId(userId);

    if (cartItems.length === 0) {
      throw new AppError(
        'Cart is empty.',
        400,
        'CART_EMPTY',
      );
    }

    const products = cartItems.map((item) => {
      const { product } = item;

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

      if (item.quantity > product.stock) {
        throw new AppError(
          'Insufficient product stock.',
          400,
          'INSUFFICIENT_STOCK',
        );
      }

      return {
        id: product.id,
        name: product.name,
        quantity: item.quantity,
        priceInCents:
          product.priceInCents - product.discountInCents,
        weightInGrams: product.weightInGrams,
        widthCm: product.widthCm,
        heightCm: product.heightCm,
        lengthCm: product.lengthCm,
      };
    });

    const options = await melhorEnvioShippingProvider.calculate({
      to: {
        zipCode: address.zipCode,
      },
      products,
    });

    return {
      addressId: address.id,
      options,
    };
  }
}

export const calculateShippingService =
  new CalculateShippingService();
