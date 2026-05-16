import { createHmac, timingSafeEqual } from "crypto";

import { env } from "../../../config/env";
import { AppError } from "../../../core/errors/app-error";

import type {
  CreatePaymentPreferenceProviderRequest,
  CreatePaymentPreferenceProviderResponse,
  GetPaymentProviderRequest,
  GetPaymentProviderResponse,
  PaymentProvider,
  PaymentProviderItem,
  PaymentProviderTransactionStatus,
  ValidatePaymentWebhookSignatureProviderRequest,
} from "./payment-provider";

interface MercadoPagoPreferenceItemPayload {
  id: string;
  title: string;
  quantity: number;
  currency_id: "BRL";
  unit_price: number;
}

interface MercadoPagoPreferenceResponse {
  id?: string;
  init_point?: string;
  sandbox_init_point?: string;
}

interface MercadoPagoPaymentResponse {
  id?: number | string;
  preference_id?: string | null;
  external_reference?: string | null;
  status?: string | null;
  status_detail?: string | null;
  transaction_amount?: number | null;
  date_approved?: string | null;
  date_last_updated?: string | null;
}

export class MercadoPagoPaymentProvider implements PaymentProvider {
  async createPreference(
    data: CreatePaymentPreferenceProviderRequest,
  ): Promise<CreatePaymentPreferenceProviderResponse> {
    this.ensureConfigured();

    const response = await fetch(this.buildCreatePreferenceUrl(), {
      method: "POST",
      headers: {
        Accept: "application/json",
        "Content-Type": "application/json",
        Authorization: `Bearer ${env.mercadoPagoAccessToken}`,
      },
      body: JSON.stringify({
        items: data.items.map((item) => this.toPreferenceItemPayload(item)),
        payer: {
          name: data.payer?.name ?? undefined,
          email: data.payer?.email ?? undefined,
        },
        back_urls: {
          success: env.mercadoPagoSuccessUrl,
          failure: env.mercadoPagoFailureUrl,
          pending: env.mercadoPagoPendingUrl,
        },
        notification_url: env.mercadoPagoNotificationUrl,
        external_reference: data.orderId,
        metadata: {
          order_id: data.orderId,
          payment_method: data.paymentMethod,
          amount_in_cents: data.amountInCents,
        },
        auto_return: "approved",
      }),
    });

    if (!response.ok) {
      throw new AppError(
        "Payment provider preference creation failed.",
        502,
        "PAYMENT_PROVIDER_PREFERENCE_CREATION_FAILED",
      );
    }

    const result = await this.readJson<MercadoPagoPreferenceResponse>(response);

    if (!result.id) {
      throw new AppError(
        "Invalid payment provider preference response.",
        502,
        "INVALID_PAYMENT_PROVIDER_PREFERENCE_RESPONSE",
      );
    }

    const paymentUrl = this.getPreferencePaymentUrl(result);

    if (!paymentUrl) {
      throw new AppError(
        "Payment provider did not return a payment URL.",
        502,
        "PAYMENT_PROVIDER_PAYMENT_URL_MISSING",
      );
    }

    return {
      provider: "MERCADO_PAGO",
      providerPreferenceId: result.id,
      status: "PENDING",
      paymentUrl,
      rawStatus: "created",
    };
  }

  async getPayment({
    providerPaymentId,
  }: GetPaymentProviderRequest): Promise<GetPaymentProviderResponse> {
    this.ensureConfigured();

    const response = await fetch(this.buildGetPaymentUrl(providerPaymentId), {
      method: "GET",
      headers: {
        Accept: "application/json",
        Authorization: `Bearer ${env.mercadoPagoAccessToken}`,
      },
    });

    if (!response.ok) {
      throw new AppError(
        "Payment provider lookup failed.",
        502,
        "PAYMENT_PROVIDER_LOOKUP_FAILED",
      );
    }

    const result = await this.readJson<MercadoPagoPaymentResponse>(response);

    if (result.id === undefined || result.id === null) {
      throw new AppError(
        "Invalid payment provider lookup response.",
        502,
        "INVALID_PAYMENT_PROVIDER_LOOKUP_RESPONSE",
      );
    }

    return this.toPaymentProviderResponse(result);
  }

  validateWebhookSignature({
    dataId,
    xSignature,
    xRequestId,
  }: ValidatePaymentWebhookSignatureProviderRequest): void {
    if (!env.mercadoPagoWebhookSecret) {
      throw new AppError(
        "Payment webhook secret is not configured.",
        500,
        "PAYMENT_WEBHOOK_SECRET_NOT_CONFIGURED",
      );
    }

    if (!dataId || !xSignature || !xRequestId) {
      throw new AppError(
        "Invalid payment webhook signature.",
        401,
        "INVALID_WEBHOOK_SIGNATURE",
      );
    }

    const signatureParts = xSignature
      .split(",")
      .map((part) => part.trim().split("="))
      .reduce<Record<string, string>>((acc, [key, value]) => {
        if (key && value) {
          acc[key] = value;
        }

        return acc;
      }, {});

    const ts = signatureParts.ts;
    const v1 = signatureParts.v1;

    if (!ts || !v1) {
      throw new AppError(
        "Invalid payment webhook signature.",
        401,
        "INVALID_WEBHOOK_SIGNATURE",
      );
    }

    const manifest = `id:${dataId.toLowerCase()};request-id:${xRequestId};ts:${ts};`;

    const expectedSignature = createHmac("sha256", env.mercadoPagoWebhookSecret)
      .update(manifest)
      .digest("hex");

    const expectedBuffer = Buffer.from(expectedSignature, "hex");
    const receivedBuffer = Buffer.from(v1, "hex");

    if (
      expectedBuffer.length !== receivedBuffer.length ||
      !timingSafeEqual(expectedBuffer, receivedBuffer)
    ) {
      throw new AppError(
        "Invalid payment webhook signature.",
        401,
        "INVALID_WEBHOOK_SIGNATURE",
      );
    }
  }

  private ensureConfigured(): void {
    if (!env.mercadoPagoEnabled) {
      throw new AppError(
        "Payment provider is disabled.",
        500,
        "PAYMENT_PROVIDER_DISABLED",
      );
    }

    if (
      !env.mercadoPagoBaseUrl ||
      !env.mercadoPagoAccessToken ||
      !env.mercadoPagoSuccessUrl ||
      !env.mercadoPagoFailureUrl ||
      !env.mercadoPagoPendingUrl ||
      !env.mercadoPagoNotificationUrl
    ) {
      throw new AppError(
        "Payment provider is not configured.",
        500,
        "PAYMENT_PROVIDER_NOT_CONFIGURED",
      );
    }
  }

  private buildCreatePreferenceUrl(): string {
    return new URL("/checkout/preferences", env.mercadoPagoBaseUrl).toString();
  }

  private buildGetPaymentUrl(providerPaymentId: string): string {
    return new URL(
      `/v1/payments/${providerPaymentId}`,
      env.mercadoPagoBaseUrl,
    ).toString();
  }

  private toPreferenceItemPayload(
    item: PaymentProviderItem,
  ): MercadoPagoPreferenceItemPayload {
    if (item.quantity <= 0 || item.unitPriceInCents <= 0) {
      throw new AppError(
        "Invalid payment item amount.",
        400,
        "INVALID_PAYMENT_ITEM_AMOUNT",
      );
    }

    return {
      id: item.id,
      title: item.title,
      quantity: item.quantity,
      currency_id: "BRL",
      unit_price: item.unitPriceInCents / 100,
    };
  }

  private getPreferencePaymentUrl(
    result: MercadoPagoPreferenceResponse,
  ): string | null {
    if (env.nodeEnv === "production") {
      return result.init_point ?? null;
    }

    return result.sandbox_init_point ?? result.init_point ?? null;
  }

  private toPaymentProviderResponse(
    result: MercadoPagoPaymentResponse,
  ): GetPaymentProviderResponse {
    const status = this.toInternalStatus(result.status);
    const updatedAt = this.parseDate(result.date_last_updated);

    return {
      provider: "MERCADO_PAGO",
      providerPaymentId: String(result.id),
      providerPreferenceId: result.preference_id ?? null,
      orderId: result.external_reference ?? null,
      status,
      rawStatus: result.status ?? null,
      rawStatusDetail: result.status_detail ?? null,
      amountInCents: this.moneyToCents(result.transaction_amount),
      paidAt: status === "PAID" ? this.parseDate(result.date_approved) : null,
      failedAt: status === "FAILED" || status === "REJECTED" ? updatedAt : null,
      canceledAt: status === "CANCELED" ? updatedAt : null,
      refundedAt: status === "REFUNDED" ? updatedAt : null,
    };
  }

  private toInternalStatus(
    status: string | null | undefined,
  ): PaymentProviderTransactionStatus {
    switch (status) {
      case "approved":
        return "PAID";
      case "authorized":
        return "AUTHORIZED";
      case "pending":
      case "in_process":
      case "in_mediation":
        return "PENDING";
      case "rejected":
        return "REJECTED";
      case "cancelled":
        return "CANCELED";
      case "refunded":
      case "charged_back":
        return "REFUNDED";
      default:
        return "FAILED";
    }
  }

  private moneyToCents(value: unknown): number | null {
    if (typeof value !== "number") {
      return null;
    }

    if (Number.isNaN(value)) {
      return null;
    }

    return Math.round(value * 100);
  }

  private parseDate(value: string | null | undefined): Date | null {
    if (!value) {
      return null;
    }

    const date = new Date(value);

    if (Number.isNaN(date.getTime())) {
      return null;
    }

    return date;
  }

  private async readJson<T>(response: Response): Promise<T> {
    try {
      return (await response.json()) as T;
    } catch {
      throw new AppError(
        "Invalid payment provider JSON response.",
        502,
        "INVALID_PAYMENT_PROVIDER_JSON_RESPONSE",
      );
    }
  }
}

export const mercadoPagoPaymentProvider = new MercadoPagoPaymentProvider();
