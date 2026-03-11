import { describe, expect, it, beforeEach, vi } from "vitest";
import type { Request, Response, NextFunction } from "express";
import { webhookRateLimit } from "./webhookRateLimit";

function createMockRequest(sourceKey = "pipeline-1", ip = "127.0.0.1") {
  return {
    params: { sourceKey },
    ip,
    header: () => undefined,
  } as unknown as Request;
}

function createMockResponse() {
  const headers: Record<string, string> = {};

  const res = {
    setHeader: vi.fn((key: string, value: string) => {
      headers[key as keyof typeof headers] = value;
      return res;
    }),

    status: vi.fn(() => res),

    json: vi.fn(() => res),
  } as unknown as Response;

  return { res, headers };
}

describe("webhookRateLimit", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it("allows requests within limit", () => {
    const req = createMockRequest();

    const { res, headers } = createMockResponse();

    const next: NextFunction = vi.fn();

    webhookRateLimit(req, res, next);

    expect(next).toHaveBeenCalled();

    expect(headers["X-RateLimit-Limit"]).toBeDefined();

    expect(headers["X-RateLimit-Remaining"]).toBeDefined();
  });

  it("blocks request when rate limit exceeded", () => {
    const req = createMockRequest("pipeline-limit-test", "10.0.0.1");

    const next: NextFunction = vi.fn();

    for (let i = 0; i < 10; i++) {
      const r = createMockResponse();
      webhookRateLimit(req, r.res, next);
    }

    const blocked = createMockResponse();

    webhookRateLimit(req, blocked.res, next);

    expect(blocked.res.status).toHaveBeenCalledWith(429);

    expect(blocked.res.json).toHaveBeenCalled();

    expect(blocked.headers["Retry-After"]).toBeDefined();
  });
});
