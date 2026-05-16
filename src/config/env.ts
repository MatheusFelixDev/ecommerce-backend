import dotenv from "dotenv";

dotenv.config();

export const env = {
  nodeEnv: process.env.NODE_ENV || "development",

  port: Number(process.env.PORT) || 3000,

  databaseUrl: process.env.DATABASE_URL || "",

  jwtSecret: process.env.JWT_SECRET || "",

  jwtExpiresIn: process.env.JWT_EXPIRES_IN || "1d",

  melhorEnvioEnabled:
    process.env.MELHOR_ENVIO_ENABLED === "true",

  melhorEnvioBaseUrl:
    process.env.MELHOR_ENVIO_BASE_URL ||
    "https://sandbox.melhorenvio.com.br",

  melhorEnvioAccessToken:
    process.env.MELHOR_ENVIO_ACCESS_TOKEN || "",

  melhorEnvioUserAgent:
    process.env.MELHOR_ENVIO_USER_AGENT ||
    "ecommerce-backend (dev@example.com)",

  melhorEnvioOriginZipCode:
    process.env.MELHOR_ENVIO_ORIGIN_ZIP_CODE || "",

  mercadoPagoEnabled:
    process.env.MERCADO_PAGO_ENABLED === "true",

  mercadoPagoBaseUrl:
    process.env.MERCADO_PAGO_BASE_URL ||
    "https://api.mercadopago.com",

  mercadoPagoAccessToken:
    process.env.MERCADO_PAGO_ACCESS_TOKEN || "",

  mercadoPagoPublicKey:
    process.env.MERCADO_PAGO_PUBLIC_KEY || "",

  mercadoPagoWebhookSecret:
    process.env.MERCADO_PAGO_WEBHOOK_SECRET || "",

  mercadoPagoSuccessUrl:
    process.env.MERCADO_PAGO_SUCCESS_URL ||
    "http://localhost:3000/payments/success",

  mercadoPagoFailureUrl:
    process.env.MERCADO_PAGO_FAILURE_URL ||
    "http://localhost:3000/payments/failure",

  mercadoPagoPendingUrl:
    process.env.MERCADO_PAGO_PENDING_URL ||
    "http://localhost:3000/payments/pending",

  mercadoPagoNotificationUrl:
    process.env.MERCADO_PAGO_NOTIFICATION_URL ||
    "http://localhost:3000/api/payments/webhooks/mercado-pago",
};
