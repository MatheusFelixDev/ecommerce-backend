import type { FastifyInstance } from "fastify";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { buildTestApp } from "../helpers/build-test-app";

describe("Request ID observability", () => {
  let app: FastifyInstance;

  beforeAll(async () => {
    app = await buildTestApp();
  });

  afterAll(async () => {
    await app.close();
  });

  it("should return the received x-request-id header", async () => {
    const requestId = "test-request-id-123";

    const response = await app.inject({
      method: "GET",
      url: "/api/health",
      headers: {
        "x-request-id": requestId,
      },
    });

    expect(response.statusCode).toBe(200);
    expect(response.headers["x-request-id"]).toBe(requestId);
  });

  it("should generate x-request-id when the header is missing", async () => {
    const response = await app.inject({
      method: "GET",
      url: "/api/health",
    });

    expect(response.statusCode).toBe(200);
    expect(response.headers["x-request-id"]).toEqual(expect.any(String));
    expect(String(response.headers["x-request-id"]).length).toBeGreaterThan(0);
  });

  it("should replace unsafe x-request-id values", async () => {
    const response = await app.inject({
      method: "GET",
      url: "/api/health",
      headers: {
        "x-request-id": "../../unsafe request id",
      },
    });

    expect(response.statusCode).toBe(200);
    expect(response.headers["x-request-id"]).toEqual(expect.any(String));
    expect(response.headers["x-request-id"]).not.toBe(
      "../../unsafe request id",
    );
  });
});
