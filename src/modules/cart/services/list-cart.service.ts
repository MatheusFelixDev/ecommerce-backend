import { cartRepository } from '../repositories/cart.repository';

interface ListCartServiceRequest {
  userId: string;
}

export class ListCartService {
  async execute({ userId }: ListCartServiceRequest) {
    const cartItems =
      await cartRepository.findManyByUserId(userId);

    const items = cartItems.map((item) => {
      const unitPriceInCents =
        item.product.priceInCents;
      const unitDiscountInCents =
        item.product.discountInCents;

      const subtotalInCents =
        unitPriceInCents * item.quantity;
      const discountInCents =
        unitDiscountInCents * item.quantity;
      const totalInCents =
        subtotalInCents - discountInCents;

      return {
        id: item.id,
        productId: item.productId,
        quantity: item.quantity,
        unitPriceInCents,
        unitDiscountInCents,
        subtotalInCents,
        discountInCents,
        totalInCents,
        product: item.product,
      };
    });

    const summary = items.reduce(
      (acc, item) => {
        acc.itemsCount += 1;
        acc.totalQuantity += item.quantity;
        acc.subtotalInCents += item.subtotalInCents;
        acc.discountInCents += item.discountInCents;
        acc.totalInCents += item.totalInCents;

        return acc;
      },
      {
        itemsCount: 0,
        totalQuantity: 0,
        subtotalInCents: 0,
        discountInCents: 0,
        totalInCents: 0,
      },
    );

    return {
      items,
      summary,
    };
  }
}

export const listCartService = new ListCartService();
