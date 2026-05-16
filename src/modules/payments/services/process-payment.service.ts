import { AppError } from "../../../core/errors/app-error";

import type { ProcessPaymentParams } from "../dtos/process-payment.dto";
import { mercadoPagoPaymentProvider } from "../providers/mercado-pago-payment.provider";
import { paymentsRepository } from "../repositories/payments.repository";

interface ProcessPaymentServiceRequest extends ProcessPaymentParams {
  userId: string;
}

export class ProcessPaymentService {
  async execute({ orderId, userId }: ProcessPaymentServiceRequest) {
    const order = await paymentsRepository.findOrderByIdAndUserId({
      id: orderId,
      userId,
    });

    if (!order) {
      throw new AppError("Order not found.", 404, "ORDER_NOT_FOUND");
    }

    if (
      order.status !== "PENDING" ||
      order.paymentStatus !== "PENDING" ||
      order.canceledAt !== null ||
      order.totalInCents <= 0 ||
      !order.paymentMethod
    ) {
      throw new AppError("Order is not payable.", 400, "ORDER_NOT_PAYABLE");
    }

    const activePayment = await paymentsRepository.findActivePaymentByOrderId(
      order.id,
    );

    if (activePayment) {
      throw new AppError(
        "Payment has already been processed for this order.",
        409,
        "PAYMENT_ALREADY_PROCESSED",
      );
    }

    const preference = await mercadoPagoPaymentProvider.createPreference({
      orderId: order.id,
      paymentMethod: order.paymentMethod,
      amountInCents: order.totalInCents,
      payer: {
        name: order.user.name,
        email: order.user.email,
      },
      items: [
        {
          id: order.id,
          title: `Pedido ${order.id}`,
          quantity: 1,
          unitPriceInCents: order.totalInCents,
        },
      ],
    });

    const payment = await paymentsRepository.create({
      orderId: order.id,
      provider: preference.provider,
      providerPreferenceId: preference.providerPreferenceId,
      providerPaymentId: null,
      method: order.paymentMethod,
      status: preference.status,
      amountInCents: order.totalInCents,
      currency: "BRL",
      paymentUrl: preference.paymentUrl,
      rawStatus: preference.rawStatus,
      rawStatusDetail: null,
    });

    return {
      paymentId: payment.id,
      orderId: payment.orderId,
      provider: payment.provider,
      status: payment.status,
      paymentUrl: payment.paymentUrl,
      providerPaymentId: payment.providerPaymentId,
      providerPreferenceId: payment.providerPreferenceId,
      amountInCents: payment.amountInCents,
      currency: payment.currency,
      createdAt: payment.createdAt,
    };
  }
}

export const processPaymentService = new ProcessPaymentService();
