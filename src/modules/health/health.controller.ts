import type { FastifyReply, FastifyRequest } from "fastify";
import { env } from "../../config/env";

export function healthController(
  _request: FastifyRequest,
  reply: FastifyReply,
): void {
  reply.status(200).send({
    success: true,
    data: {
      status: "ok",
      service: "ecommerce-backend-api",
      environment: env.nodeEnv,
      version: process.env.npm_package_version ?? "1.0.0",
      uptimeInSeconds: Math.floor(process.uptime()),
      timestamp: new Date().toISOString(),
    },
  });
}
