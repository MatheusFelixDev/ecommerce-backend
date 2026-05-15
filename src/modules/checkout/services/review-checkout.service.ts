import { AppError } from '../../../core/errors/app-error';

import type { ReviewCheckoutBody } from '../dtos/review-checkout.dto';
import { melhorEnvioShippingProvider } from '../providers/melhor-envio-shipping.provider';
import { checkoutRepository } from '../repositories/checkout.repository';

interface ReviewCheckoutServiceRequest
  extends ReviewCheckoutBody {
  userId: string;
}

export class ReviewCheckoutService {
  async execute({
    userId,
    addressId,
    shippingServiceCode,
    paymentMethod,
    couponCode,
  }: ReviewCheckoutServiceRequest) {
    if (couponCode) {
      throw new AppError(
        'Coupon is not implemented yet.',
        400,
        'COUPON_NOT_IMPLEMENTED',
      );
    }

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

    const items = cartItems.map((item) => {
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

      const unitPriceInCents = product.priceInCents;
      const unitDiscountInCents = product.discountInCents;
      const subtotalInCents =
        unitPriceInCents * item.quantity;
      const discountInCents =
        unitDiscountInCents * item.quantity;
      const totalInCents =
        subtotalInCents - discountInCents;
      const mainImage = product.images.find(
        (image) => image.isMain,
      );

      return {
        id: item.id,
        productId: product.id,
        productName: product.name,
        productSlug: product.slug,
        productSku: product.sku,
        productImageUrl:
          mainImage?.url ?? product.images[0]?.url ?? null,
        quantity: item.quantity,
        unitPriceInCents,
        unitDiscountInCents,
        subtotalInCents,
        discountInCents,
        totalInCents,
        shippingProduct: {
          id: product.id,
          name: product.name,
          quantity: item.quantity,
          priceInCents: totalInCents,
          weightInGrams: product.weightInGrams,
          widthCm: product.widthCm,
          heightCm: product.heightCm,
          lengthCm: product.lengthCm,
        },
      };
    });

    const shippingOptions =
      await melhorEnvioShippingProvider.calculate({
        to: {
          zipCode: address.zipCode,
        },
        products: items.map((item) => item.shippingProduct),
      });

    const shipping = shippingOptions.find(
      (option) => option.serviceCode === shippingServiceCode,
    );

    if (!shipping) {
      throw new AppError(
        'Shipping option not found.',
        400,
        'SHIPPING_OPTION_NOT_FOUND',
      );
    }

    const summary = items.reduce(
      (acc, item) => {
        acc.itemsCount += 1;
        acc.totalQuantity += item.quantity;
        acc.subtotalInCents += item.subtotalInCents;
        acc.discountInCents += item.discountInCents;

        return acc;
      },
      {
        itemsCount: 0,
        totalQuantity: 0,
        subtotalInCents: 0,
        discountInCents: 0,
        shippingInCents: shipping.priceInCents,
        couponDiscountInCents: 0,
        totalInCents: 0,
      },
    );

    summary.totalInCents =
      summary.subtotalInCents -
      summary.discountInCents +
      summary.shippingInCents -
      summary.couponDiscountInCents;

    return {
      items: items.map(({ shippingProduct: _shippingProduct, ...item }) => item),
      address: {
        id: address.id,
        zipCode: address.zipCode,
        street: address.street,
        number: address.number,
        complement: address.complement,
        neighborhood: address.neighborhood,
        city: address.city,
        state: address.state,
        country: address.country,
        recipientName: address.recipientName,
        recipientPhone: address.phone,
      },
      shipping,
      payment: {
        method: paymentMethod,
      },
      coupon: null,
      summary,
    };
  }
}

export const reviewCheckoutService =
  new ReviewCheckoutService();
