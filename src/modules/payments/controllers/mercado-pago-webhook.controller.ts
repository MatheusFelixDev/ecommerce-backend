import type { FastifyReply, FastifyRequest } from "fastify";

import {
  mercadoPagoWebhookBodySchema,
  mercadoPagoWebhookQuerySchema,
} from "../dtos/mercado-pago-webhook.dto";
import { handleMercadoPagoWebhookService } from "../services/handle-mercado-pago-webhook.service";

function getHeaderValue(value: string | string[] | undefined): string | null {
  if (Array.isArray(value)) {
    return value[0] ?? null;
  }

  return value ?? null;
}

export async function mercadoPagoWebhookController(
  request: FastifyRequest,
  reply: FastifyReply,
): Promise<FastifyReply> {
  const body = mercadoPagoWebhookBodySchema.parse(request.body);
  const query = mercadoPagoWebhookQuerySchema.parse(request.query);

  const result = await handleMercadoPagoWebhookService.execute({
    body,
    query,
    xSignature: getHeaderValue(request.headers["x-signature"]),
    xRequestId: getHeaderValue(request.headers["x-request-id"]),
  });

  return reply.status(200).send({
    success: true,
    data: result,
  });
}
