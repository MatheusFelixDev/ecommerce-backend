import type { FastifyReply, FastifyRequest } from "fastify";

import { processPaymentParamsSchema } from "../dtos/process-payment.dto";
import { processPaymentService } from "../services/process-payment.service";

export async function processPaymentController(
  request: FastifyRequest,
  reply: FastifyReply,
): Promise<FastifyReply> {
  const params = processPaymentParamsSchema.parse(request.params);

  const payment = await processPaymentService.execute({
    orderId: params.orderId,
    userId: request.user.sub,
  });

  return reply.status(201).send({
    success: true,
    data: payment,
  });
}
