import type {
  Order,
  OrderItem,
  Payment,
  PaymentMethod,
  PaymentProvider as PrismaPaymentProvider,
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
}

export const paymentsRepository = new PaymentsRepository();
