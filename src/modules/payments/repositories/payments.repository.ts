import type {
  Order,
  OrderItem,
  OrderStatus,
  Payment,
  PaymentMethod,
  PaymentProvider as PrismaPaymentProvider,
  PaymentStatus,
  PaymentTransactionStatus,
  Prisma,
  User,
} from "../../../generated/prisma/client";

import { prisma } from "../../../infra/prisma/client";

export interface PayableOrder extends Order {
  items: OrderItem[];
  user: Pick<User, "name" | "email">;
}

interface FindOrderByIdAndUserIdParams {
  id: string;
  userId: string;
}

interface CreatePaymentData {
  orderId: string;
  provider: PrismaPaymentProvider;
  providerPaymentId?: string | null;
  providerPreferenceId?: string | null;
  method: PaymentMethod;
  status: PaymentTransactionStatus;
  amountInCents: number;
  currency: string;
  paymentUrl?: string | null;
  rawStatus?: string | null;
  rawStatusDetail?: string | null;
  paidAt?: Date | null;
  failedAt?: Date | null;
  canceledAt?: Date | null;
  refundedAt?: Date | null;
}

interface FindPaymentForProviderResultParams {
  providerPaymentId?: string | null;
  providerPreferenceId?: string | null;
  orderId?: string | null;
  provider: PrismaPaymentProvider;
}

interface UpdatePaymentFromProviderData {
  paymentId: string;
  providerPaymentId: string;
  providerPreferenceId?: string | null;
  status: PaymentTransactionStatus;
  amountInCents?: number | null;
  rawStatus?: string | null;
  rawStatusDetail?: string | null;
  paidAt?: Date | null;
  failedAt?: Date | null;
  canceledAt?: Date | null;
  refundedAt?: Date | null;
}

interface UpdateOrderPaymentStatusData {
  orderId: string;
  paymentStatus: PaymentStatus;
  orderStatus?: OrderStatus | null;
}

export class PaymentsRepository {
  async transaction<T>(
    callback: (tx: Prisma.TransactionClient) => Promise<T>,
  ): Promise<T> {
    return prisma.$transaction(callback);
  }

  async findOrderByIdAndUserId(
    params: FindOrderByIdAndUserIdParams,
  ): Promise<PayableOrder | null> {
    return prisma.order.findFirst({
      where: {
        id: params.id,
        userId: params.userId,
      },
      include: {
        items: {
          orderBy: {
            createdAt: "asc",
          },
        },
        user: {
          select: {
            name: true,
            email: true,
          },
        },
      },
    });
  }

  async findActivePaymentByOrderId(orderId: string): Promise<Payment | null> {
    return prisma.payment.findFirst({
      where: {
        orderId,
        status: {
          in: ["PENDING", "AUTHORIZED", "PAID"],
        },
      },
      orderBy: {
        createdAt: "desc",
      },
    });
  }

  async findPaymentForProviderResult(
    params: FindPaymentForProviderResultParams,
    tx: Prisma.TransactionClient,
  ): Promise<Payment | null> {
    if (params.providerPaymentId) {
      const payment = await tx.payment.findFirst({
        where: {
          provider: params.provider,
          providerPaymentId: params.providerPaymentId,
        },
      });

      if (payment) {
        return payment;
      }
    }

    if (params.providerPreferenceId) {
      const payment = await tx.payment.findFirst({
        where: {
          provider: params.provider,
          providerPreferenceId: params.providerPreferenceId,
        },
      });

      if (payment) {
        return payment;
      }
    }

    if (params.orderId) {
      return tx.payment.findFirst({
        where: {
          provider: params.provider,
          orderId: params.orderId,
        },
        orderBy: {
          createdAt: "desc",
        },
      });
    }

    return null;
  }

  async create(data: CreatePaymentData): Promise<Payment> {
    return prisma.payment.create({
      data: {
        orderId: data.orderId,
        provider: data.provider,
        providerPaymentId: data.providerPaymentId,
        providerPreferenceId: data.providerPreferenceId,
        method: data.method,
        status: data.status,
        amountInCents: data.amountInCents,
        currency: data.currency,
        paymentUrl: data.paymentUrl,
        rawStatus: data.rawStatus,
        rawStatusDetail: data.rawStatusDetail,
        paidAt: data.paidAt,
        failedAt: data.failedAt,
        canceledAt: data.canceledAt,
        refundedAt: data.refundedAt,
      },
    });
  }

  async updatePaymentFromProvider(
    data: UpdatePaymentFromProviderData,
    tx: Prisma.TransactionClient,
  ): Promise<Payment> {
    return tx.payment.update({
      where: {
        id: data.paymentId,
      },
      data: {
        providerPaymentId: data.providerPaymentId,
        providerPreferenceId: data.providerPreferenceId ?? undefined,
        status: data.status,
        amountInCents: data.amountInCents ?? undefined,
        rawStatus: data.rawStatus,
        rawStatusDetail: data.rawStatusDetail,
        paidAt: data.paidAt ?? undefined,
        failedAt: data.failedAt ?? undefined,
        canceledAt: data.canceledAt ?? undefined,
        refundedAt: data.refundedAt ?? undefined,
      },
    });
  }

  async updateOrderPaymentStatus(
    data: UpdateOrderPaymentStatusData,
    tx: Prisma.TransactionClient,
  ): Promise<Order> {
    return tx.order.update({
      where: {
        id: data.orderId,
      },
      data: {
        paymentStatus: data.paymentStatus,
        ...(data.orderStatus
          ? {
              status: data.orderStatus,
            }
          : {}),
      },
    });
  }
}

export const paymentsRepository = new PaymentsRepository();
