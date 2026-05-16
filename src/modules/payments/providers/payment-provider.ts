export type PaymentProviderName = "MERCADO_PAGO";

export type PaymentProviderMethod = "CREDIT_CARD" | "PIX" | "BOLETO";

export type PaymentProviderTransactionStatus =
  | "PENDING"
  | "AUTHORIZED"
  | "PAID"
  | "REJECTED"
  | "CANCELED"
  | "REFUNDED"
  | "FAILED";

export interface PaymentProviderItem {
  id: string;
  title: string;
  quantity: number;
  unitPriceInCents: number;
}

export interface CreatePaymentPreferenceProviderRequest {
  orderId: string;
  paymentMethod: PaymentProviderMethod;
  amountInCents: number;
  payer?: {
    name?: string | null;
    email?: string | null;
  };
  items: PaymentProviderItem[];
}

export interface CreatePaymentPreferenceProviderResponse {
  provider: PaymentProviderName;
  providerPreferenceId: string;
  status: PaymentProviderTransactionStatus;
  paymentUrl: string;
  rawStatus: string | null;
}

export interface GetPaymentProviderRequest {
  providerPaymentId: string;
}

export interface GetPaymentProviderResponse {
  provider: PaymentProviderName;
  providerPaymentId: string;
  providerPreferenceId: string | null;
  orderId: string | null;
  status: PaymentProviderTransactionStatus;
  rawStatus: string | null;
  rawStatusDetail: string | null;
  amountInCents: number | null;
  paidAt: Date | null;
  failedAt: Date | null;
  canceledAt: Date | null;
  refundedAt: Date | null;
}

export interface ValidatePaymentWebhookSignatureProviderRequest {
  dataId: string;
  xSignature: string | null;
  xRequestId: string | null;
}

export interface PaymentProvider {
  validateWebhookSignature(
    data: ValidatePaymentWebhookSignatureProviderRequest,
  ): void;

  createPreference(
    data: CreatePaymentPreferenceProviderRequest,
  ): Promise<CreatePaymentPreferenceProviderResponse>;

  getPayment(
    data: GetPaymentProviderRequest,
  ): Promise<GetPaymentProviderResponse>;
}
