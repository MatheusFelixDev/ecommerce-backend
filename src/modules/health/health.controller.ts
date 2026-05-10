import type { FastifyReply, FastifyRequest } from "fastify";

export function healthController(
  _request: FastifyRequest,
  reply: FastifyReply,
): void {
  reply.status(200).send({
    success: true,
    data: {
      status: "ok",
      service: "ecommerce-backend-api",
      timestamp: new Date().toISOString(),
    },
  });
}
