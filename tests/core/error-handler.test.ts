import type { FastifyInstance } from "fastify";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { buildApp } from "../../src/app";
import { AppError } from "../../src/core/errors/app-error";

describe("Error handler observability", () => {
  let app: FastifyInstance;

  beforeAll(async () => {
    app = await buildApp();

    app.get("/test/unexpected-error", async () => {
      throw new Error("Sensitive internal stack should not leak");
    });

    app.get("/test/app-error", async () => {
      throw new AppError("Controlled failure.", 409, "CONTROLLED_FAILURE");
    });

    await app.ready();
  });

  afterAll(async () => {
    await app.close();
  });

  it("should not expose internal error details to the client", async () => {
    const response = await app.inject({
      method: "GET",
      url: "/test/unexpected-error",
      headers: {
        "x-request-id": "unexpected-error-request",
      },
    });

    const body = response.json();

    expect(response.statusCode).toBe(500);
    expect(response.headers["x-request-id"]).toBe("unexpected-error-request");
    expect(body).toEqual({
      success: false,
      error: {
        code: "INTERNAL_SERVER_ERROR",
        message: "Internal server error.",
      },
    });
    expect(JSON.stringify(body)).not.toContain("Sensitive internal stack");
  });

  it("should preserve AppError response format", async () => {
    const response = await app.inject({
      method: "GET",
      url: "/test/app-error",
      headers: {
        "x-request-id": "app-error-request",
      },
    });

    const body = response.json();

    expect(response.statusCode).toBe(409);
    expect(response.headers["x-request-id"]).toBe("app-error-request");
    expect(body).toEqual({
      success: false,
      error: {
        code: "CONTROLLED_FAILURE",
        message: "Controlled failure.",
      },
    });
  });
});
