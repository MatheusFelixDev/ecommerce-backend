import type { Prisma } from '../../../generated/prisma/client';

import { prisma } from '../../../infra/prisma/client';

interface GetSalesReportParams {
  startDate: Date;
  endDate: Date;
}

export class AdminReportsRepository {
  async getSalesReport(params: GetSalesReportParams) {
    const where: Prisma.OrderWhereInput = {
      paymentStatus: 'PAID',
      createdAt: {
        gte: params.startDate,
        lt: params.endDate,
      },
    };

    const result = await prisma.order.aggregate({
      where,
      _count: {
        id: true,
      },
      _sum: {
        itemsCount: true,
        totalQuantity: true,
        subtotalInCents: true,
        discountInCents: true,
        shippingPriceInCents: true,
        couponDiscountInCents: true,
        totalInCents: true,
      },
    });

    return {
      ordersCount: result._count.id,
      itemsCount: result._sum.itemsCount ?? 0,
      totalQuantity: result._sum.totalQuantity ?? 0,
      subtotalInCents: result._sum.subtotalInCents ?? 0,
      discountInCents: result._sum.discountInCents ?? 0,
      shippingInCents: result._sum.shippingPriceInCents ?? 0,
      couponDiscountInCents: result._sum.couponDiscountInCents ?? 0,
      revenueInCents: result._sum.totalInCents ?? 0,
    };
  }
}

export const adminReportsRepository =
  new AdminReportsRepository();
