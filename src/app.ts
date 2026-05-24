import cors from "@fastify/cors";
import helmet from "@fastify/helmet";
import jwt from "@fastify/jwt";
import rateLimit from "@fastify/rate-limit";
import { randomUUID } from "crypto";
import fastify, { type FastifyInstance } from "fastify";
import { createCorsOriginHandler } from "./config/cors";
import { env } from "./config/env";
import { loggerConfig } from "./config/logger";
import { errorHandler } from "./core/middlewares/error-handler";
import { registerRoutes } from "./modules/routes";

const requestIdHeader = "x-request-id";
const safeRequestIdPattern = /^[a-zA-Z0-9._:-]{1,128}$/;

function normalizeRequestId(
  value: string | string[] | undefined,
): string | undefined {
  const requestId = Array.isArray(value) ? value[0] : value;

  if (!requestId || !safeRequestIdPattern.test(requestId)) {
    return undefined;
  }

  return requestId;
}

export async function buildApp(): Promise<FastifyInstance> {
  const app = fastify({
    logger: loggerConfig,
    requestIdHeader: false,
    requestIdLogLabel: "requestId",
    genReqId(request) {
      return (
        normalizeRequestId(request.headers[requestIdHeader]) ?? randomUUID()
      );
    },
  });

  app.addHook("onRequest", async (request, reply) => {
    reply.header(requestIdHeader, request.id);
  });

  await app.register(cors, {
    origin: createCorsOriginHandler(env.corsOrigins),
    credentials: true,
  });

  await app.register(helmet);

  await app.register(rateLimit, {
    max: 100,
    timeWindow: "1 minute",
  });

  await app.register(jwt, {
    secret: env.jwtSecret,
  });

  app.setErrorHandler(errorHandler);

  app.get("/", async () => {
    return {
      success: true,
      data: {
        name: "ecommerce-backend-api",
        status: "running",
      },
    };
  });

  await app.register(registerRoutes, {
    prefix: "/api",
  });

  return app;
}
