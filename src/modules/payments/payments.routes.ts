import type { FastifyInstance } from "fastify";

import { authenticate } from "../../core/middlewares/authenticate";

import { mercadoPagoWebhookController } from "./controllers/mercado-pago-webhook.controller";
import { processPaymentController } from "./controllers/process-payment.controller";

export async function paymentsRoutes(app: FastifyInstance): Promise<void> {
  app.post("/webhooks/mercado-pago", mercadoPagoWebhookController);

  app.post(
    "/orders/:orderId/process",
    {
      preHandler: [authenticate],
    },
    processPaymentController,
  );
}
