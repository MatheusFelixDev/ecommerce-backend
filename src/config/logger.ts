import type { FastifyServerOptions } from "fastify";

import { env } from "./env";

export const loggerConfig: FastifyServerOptions["logger"] =
  env.nodeEnv === "test"
    ? false
    : {
        level: env.nodeEnv === "development" ? "debug" : "info",
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
