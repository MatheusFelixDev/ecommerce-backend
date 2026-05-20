import type { FastifyInstance, RouteOptions } from "fastify";

import { authenticate } from "../../core/middlewares/authenticate";

import { mercadoPagoWebhookController } from "./controllers/mercado-pago-webhook.controller";
import { processPaymentController } from "./controllers/process-payment.controller";

type RouteRateLimitConfig = NonNullable<RouteOptions["config"]>["rateLimit"];

const paymentProcessRateLimit: RouteRateLimitConfig = {
  max: 20,
  timeWindow: "1 minute",
};

const paymentWebhookRateLimit: RouteRateLimitConfig = {
  max: 120,
  timeWindow: "1 minute",
};

export async function paymentsRoutes(app: FastifyInstance): Promise<void> {
  app.post(
    "/webhooks/mercado-pago",
    {
      config: {
        rateLimit: paymentWebhookRateLimit,
      },
    },
    mercadoPagoWebhookController,
  );

  app.post(
    "/orders/:orderId/process",
    {
      preHandler: [authenticate],
      config: {
        rateLimit: paymentProcessRateLimit,
      },
    },
    processPaymentController,
  );
}
