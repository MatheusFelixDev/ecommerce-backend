import type {
  OrderStatus,
  PaymentStatus,
  PaymentTransactionStatus,
} from "../../../generated/prisma/client";

import { AppError } from "../../../core/errors/app-error";

import type {
  MercadoPagoWebhookBody,
  MercadoPagoWebhookQuery,
} from "../dtos/mercado-pago-webhook.dto";
import { mercadoPagoPaymentProvider } from "../providers/mercado-pago-payment.provider";
import { paymentsRepository } from "../repositories/payments.repository";

interface HandleMercadoPagoWebhookServiceRequest {
  body: MercadoPagoWebhookBody;
  query: MercadoPagoWebhookQuery;
  xSignature: string | null;
  xRequestId: string | null;
}

export class HandleMercadoPagoWebhookService {
  async execute({
    body,
    query,
    xSignature,
    xRequestId,
  }: HandleMercadoPagoWebhookServiceRequest) {
    const dataId = this.extractDataId(body, query);

    mercadoPagoPaymentProvider.validateWebhookSignature({
      dataId,
      xSignature,
      xRequestId,
    });

    const webhookType = query.type ?? body.type ?? null;

    if (webhookType && webhookType !== "payment") {
      return {
        received: true,
        processed: false,
        reason: "WEBHOOK_TYPE_NOT_SUPPORTED",
      };
    }

    const providerPayment = await mercadoPagoPaymentProvider.getPayment({
      providerPaymentId: dataId,
    });

    return paymentsRepository.transaction(async (tx) => {
      const payment = await paymentsRepository.findPaymentForProviderResult(
        {
          provider: providerPayment.provider,
          providerPaymentId: providerPayment.providerPaymentId,
          providerPreferenceId: providerPayment.providerPreferenceId,
          orderId: providerPayment.orderId,
        },
        tx,
      );

      if (!payment) {
        throw new AppError("Payment not found.", 404, "PAYMENT_NOT_FOUND");
      }

      const orderPaymentStatus = this.toOrderPaymentStatus(
        providerPayment.status,
      );

      const orderStatus = this.toOrderStatus(providerPayment.status);

      const updatedPayment = await paymentsRepository.updatePaymentFromProvider(
        {
          paymentId: payment.id,
          providerPaymentId: providerPayment.providerPaymentId,
          providerPreferenceId: providerPayment.providerPreferenceId,
          status: providerPayment.status,
          amountInCents: providerPayment.amountInCents,
          rawStatus: providerPayment.rawStatus,
          rawStatusDetail: providerPayment.rawStatusDetail,
          paidAt: providerPayment.paidAt,
          failedAt: providerPayment.failedAt,
          canceledAt: providerPayment.canceledAt,
          refundedAt: providerPayment.refundedAt,
        },
        tx,
      );

      const updatedOrder = await paymentsRepository.updateOrderPaymentStatus(
        {
          orderId: payment.orderId,
          paymentStatus: orderPaymentStatus,
          orderStatus,
        },
        tx,
      );

      return {
        received: true,
        processed: true,
        paymentId: updatedPayment.id,
        orderId: updatedOrder.id,
        providerPaymentId: updatedPayment.providerPaymentId,
        providerPreferenceId: updatedPayment.providerPreferenceId,
        paymentStatus: updatedPayment.status,
        orderPaymentStatus: updatedOrder.paymentStatus,
        orderStatus: updatedOrder.status,
      };
    });
  }

  private extractDataId(
    body: MercadoPagoWebhookBody,
    query: MercadoPagoWebhookQuery,
  ): string {
    const dataId = query["data.id"] ?? body.data?.id;

    if (
      dataId === undefined ||
      dataId === null ||
      String(dataId).trim() === ""
    ) {
      throw new AppError(
        "Payment webhook payment id is missing.",
        400,
        "PAYMENT_WEBHOOK_PAYMENT_ID_MISSING",
      );
    }

    return String(dataId);
  }

  private toOrderPaymentStatus(
    status: PaymentTransactionStatus,
  ): PaymentStatus {
    switch (status) {
      case "PAID":
        return "PAID";
      case "REJECTED":
      case "FAILED":
        return "FAILED";
      case "CANCELED":
        return "CANCELED";
      case "REFUNDED":
        return "REFUNDED";
      case "PENDING":
      case "AUTHORIZED":
      default:
        return "PENDING";
    }
  }

  private toOrderStatus(status: PaymentTransactionStatus): OrderStatus | null {
    if (status === "PAID") {
      return "PAID";
    }

    return null;
  }
}

export const handleMercadoPagoWebhookService =
  new HandleMercadoPagoWebhookService();
