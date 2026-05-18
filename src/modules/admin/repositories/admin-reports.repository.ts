import type { Prisma } from '../../../generated/prisma/client';

import { prisma } from '../../../infra/prisma/client';

interface GetSalesReportParams {
  startDate: Date;
  endDate: Date;
}

interface GetTopProductsReportParams {
  startDate: Date;
  endDate: Date;
  limit: number;
}

interface GetLowStockReportParams {
  threshold: number;
  page: number;
  perPage: number;
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

  async getTopProductsReport(
    params: GetTopProductsReportParams,
  ) {
    const groupedItems = await prisma.orderItem.groupBy({
      by: [
        'productId',
        'productName',
        'productSku',
        'productSlug',
      ],
      where: {
        order: {
          paymentStatus: 'PAID',
          createdAt: {
            gte: params.startDate,
            lt: params.endDate,
          },
        },
      },
      _sum: {
        quantity: true,
        totalInCents: true,
      },
      _count: {
        id: true,
      },
      orderBy: {
        _sum: {
          quantity: 'desc',
        },
      },
      take: params.limit,
    });

    return groupedItems.map((item) => ({
      productId: item.productId,
      productName: item.productName,
      productSku: item.productSku,
      productSlug: item.productSlug,
      ordersCount: item._count.id,
      quantitySold: item._sum.quantity ?? 0,
      revenueInCents: item._sum.totalInCents ?? 0,
    }));
  }

  async getLowStockReport(params: GetLowStockReportParams) {
    const where: Prisma.ProductWhereInput = {
      isActive: true,
      stock: {
        lte: params.threshold,
      },
    };

    const skip = (params.page - 1) * params.perPage;

    const [products, total] = await prisma.$transaction([
      prisma.product.findMany({
        where,
        orderBy: [
          {
            stock: 'asc',
          },
          {
            createdAt: 'desc',
          },
        ],
        skip,
        take: params.perPage,
        include: {
          category: true,
        },
      }),
      prisma.product.count({
        where,
      }),
    ]);

    return {
      products: products.map((product) => ({
        id: product.id,
        name: product.name,
        slug: product.slug,
        sku: product.sku,
        stock: product.stock,
        status: product.status,
        isActive: product.isActive,
        category: {
          id: product.category.id,
          name: product.category.name,
          slug: product.category.slug,
        },
        createdAt: product.createdAt.toISOString(),
        updatedAt: product.updatedAt.toISOString(),
      })),
      total,
    };
  }
}

export const adminReportsRepository =
  new AdminReportsRepository();
