import type { FastifyInstance } from "fastify";

import { authenticate } from "../../core/middlewares/authenticate";

import { processPaymentController } from "./controllers/process-payment.controller";

export async function paymentsRoutes(app: FastifyInstance): Promise<void> {
  app.post(
    "/orders/:orderId/process",
    {
      preHandler: [authenticate],
    },
    processPaymentController,
  );
}
