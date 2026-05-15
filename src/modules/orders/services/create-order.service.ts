import { AppError } from '../../../core/errors/app-error';
import { melhorEnvioShippingProvider } from '../../checkout/providers/melhor-envio-shipping.provider';

import type { CreateOrderBody } from '../dtos/create-order.dto';
import { ordersRepository } from '../repositories/orders.repository';

interface CreateOrderServiceRequest extends CreateOrderBody {
  userId: string;
}

export class CreateOrderService {
  async execute({
    userId,
    addressId,
    shippingServiceCode,
    paymentMethod,
    couponCode,
  }: CreateOrderServiceRequest) {
    if (couponCode) {
      throw new AppError(
        'Coupon is not implemented yet.',
        400,
        'COUPON_NOT_IMPLEMENTED',
      );
    }

    return ordersRepository.transaction(async (tx) => {
      const address =
        await ordersRepository.findActiveAddressByIdAndUserId(
          {
            id: addressId,
            userId,
          },
          tx,
        );

      if (!address) {
        throw new AppError(
          'Address not found.',
          404,
          'ADDRESS_NOT_FOUND',
        );
      }

      const cartItems =
        await ordersRepository.findCartItemsByUserId(userId, tx);

      if (cartItems.length === 0) {
        throw new AppError(
          'Cart is empty.',
          400,
          'CART_EMPTY',
        );
      }

      const orderItems = cartItems.map((item) => {
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
          products: orderItems.map((item) => item.shippingProduct),
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

      const summary = orderItems.reduce(
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

      for (const item of orderItems) {
        const updatedCount =
          await ordersRepository.updateProductStockForOrder(
            {
              productId: item.productId,
              quantity: item.quantity,
            },
            tx,
          );

        if (updatedCount !== 1) {
          throw new AppError(
            'Insufficient product stock.',
            400,
            'INSUFFICIENT_STOCK',
          );
        }
      }

      const order = await ordersRepository.create(
        {
          userId,
          addressId,
          itemsCount: summary.itemsCount,
          totalQuantity: summary.totalQuantity,
          subtotalInCents: summary.subtotalInCents,
          discountInCents: summary.discountInCents,
          totalInCents: summary.totalInCents,
          paymentMethod,
          shippingProvider: shipping.provider,
          shippingServiceCode: shipping.serviceCode,
          shippingServiceName: shipping.serviceName,
          shippingPriceInCents: shipping.priceInCents,
          shippingDeadlineDays: shipping.deadlineDays,
          couponCode: null,
          couponDiscountInCents: summary.couponDiscountInCents,
          addressZipCode: address.zipCode,
          addressStreet: address.street,
          addressNumber: address.number,
          addressComplement: address.complement,
          addressNeighborhood: address.neighborhood,
          addressCity: address.city,
          addressState: address.state,
          addressCountry: address.country,
          recipientName: address.recipientName,
          recipientPhone: address.phone,
          items: orderItems.map(
            ({ shippingProduct: _shippingProduct, ...item }) =>
              item,
          ),
        },
        tx,
      );

      await ordersRepository.deleteCartItemsByUserId(userId, tx);

      return {
        id: order.id,
        status: order.status,
        paymentStatus: order.paymentStatus,
        paymentMethod: order.paymentMethod,
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
        shipping: {
          provider: order.shippingProvider,
          serviceCode: order.shippingServiceCode,
          serviceName: order.shippingServiceName,
          priceInCents: order.shippingPriceInCents,
          deadlineDays: order.shippingDeadlineDays,
        },
        coupon: order.couponCode
          ? {
              code: order.couponCode,
              discountInCents: order.couponDiscountInCents,
            }
          : null,
        items: order.items,
        summary: {
          itemsCount: order.itemsCount,
          totalQuantity: order.totalQuantity,
          subtotalInCents: order.subtotalInCents,
          discountInCents: order.discountInCents,
          shippingInCents: order.shippingPriceInCents,
          couponDiscountInCents: order.couponDiscountInCents,
          totalInCents: order.totalInCents,
        },
        createdAt: order.createdAt,
        updatedAt: order.updatedAt,
      };
    });
  }
}

export const createOrderService = new CreateOrderService();
