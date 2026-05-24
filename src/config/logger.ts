import type { FastifyServerOptions } from "fastify";
import type { LoggerOptions } from "pino";
import pino from "pino";
import { env } from "./env";

export const sensitiveLogPaths = [
  "password",
  "passwordHash",
  "password_hash",
  "authorization",
  "accessToken",
  "refreshToken",
  "resetToken",
  "emailChangeToken",
  "jwtSecret",
  "JWT_SECRET",
  "MERCADO_PAGO_ACCESS_TOKEN",
  "MERCADO_PAGO_WEBHOOK_SECRET",
  "MELHOR_ENVIO_ACCESS_TOKEN",
  "DATABASE_URL",
  "databaseUrl",
  "req.headers.authorization",
  "req.headers.cookie",
  "req.headers.x-signature",
  "req.headers.x-mercado-pago-signature",
  "headers.authorization",
  "headers.cookie",
  "body.password",
  "body.passwordHash",
  "body.password_hash",
  "body.accessToken",
  "body.refreshToken",
  "payload.password",
  "payload.passwordHash",
  "payload.password_hash",
  "payload.accessToken",
  "payload.refreshToken",
] as const;

const baseLoggerOptions: LoggerOptions = {
  level: env.logLevel,
  redact: {
    paths: [...sensitiveLogPaths],
    censor: "[REDACTED]",
  },
  serializers: {
    err: pino.stdSerializers.err,
    error: pino.stdSerializers.err,
    req: pino.stdSerializers.req,
    res: pino.stdSerializers.res,
  },
};

export const loggerConfig: FastifyServerOptions["logger"] =
  env.nodeEnv === "test"
    ? false
    : {
        ...baseLoggerOptions,
        transport:
          env.nodeEnv === "development"
            ? {
                target: "pino-pretty",
                options: {
                  translateTime: "HH:MM:ss Z",
                  ignore: "pid,hostname",
                },
              }
            : undefined,
      };
