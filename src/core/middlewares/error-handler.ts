import type { FastifyError, FastifyReply, FastifyRequest } from "fastify";
import { ZodError } from "zod";
import { AppError } from "../errors/app-error";

function logRequestError(
  request: FastifyRequest,
  error: Error,
  statusCode: number,
  code: string,
  context?: Record<string, unknown>,
): void {
  const payload = {
    err: error,
    requestId: request.id,
    method: request.method,
    url: request.url,
    statusCode,
    code,
    context,
  };

  if (statusCode >= 500) {
    request.log.error(payload, "Request failed");
    return;
  }

  request.log.warn(payload, "Request rejected");
}

export function errorHandler(
  error: FastifyError,
  request: FastifyRequest,
  reply: FastifyReply,
): void {
  if (error instanceof AppError) {
    logRequestError(
      request,
      error,
      error.statusCode,
      error.code,
      error.context,
    );

    reply.status(error.statusCode).send({
      success: false,
      error: {
        code: error.code,
        message: error.message,
      },
    });

    return;
  }

  if (error instanceof ZodError) {
    logRequestError(request, error, 400, "VALIDATION_ERROR");

    reply.status(400).send({
      success: false,
      error: {
        code: "VALIDATION_ERROR",
        message: "Invalid request data.",
        issues: error.issues,
      },
    });

    return;
  }

  logRequestError(request, error, 500, "INTERNAL_SERVER_ERROR");

  reply.status(500).send({
    success: false,
    error: {
      code: "INTERNAL_SERVER_ERROR",
      message: "Internal server error.",
    },
  });
}
