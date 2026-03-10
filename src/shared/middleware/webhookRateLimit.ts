import { Request, Response, NextFunction } from "express";

type RateLimitEntry = {
  count: number;
  windowStart: number;
};

const store = new Map<string, RateLimitEntry>();

const parsedWindowMs = Number(process.env.WEBHOOK_RATE_LIMIT_WINDOW_MS);
const parsedMaxRequests = Number(process.env.WEBHOOK_RATE_LIMIT_MAX_REQUESTS);

const WINDOW_MS =
  Number.isFinite(parsedWindowMs) && parsedWindowMs > 0
    ? parsedWindowMs
    : 60000;

const MAX_REQUESTS =
  Number.isFinite(parsedMaxRequests) && parsedMaxRequests > 0
    ? parsedMaxRequests
    : 10;

function cleanupExpiredEntries(now: number) {
  for (const [key, value] of store.entries()) {
    if (now - value.windowStart >= WINDOW_MS) {
      store.delete(key);
    }
  }
}

function getSourceKey(req: Request): string {
  const routeSourceKey =
    typeof req.params?.sourceKey === "string"
      ? req.params.sourceKey
      : "unknown-source";

  const forwardedFor = req.header("x-forwarded-for");
  const clientIp =
    forwardedFor?.split(",")[0]?.trim() || req.ip || "unknown-ip";

  return `${routeSourceKey}:${clientIp}`;
}

export function webhookRateLimit(
  req: Request,
  res: Response,
  next: NextFunction
) {
  const now = Date.now();
  cleanupExpiredEntries(now);

  const sourceKey = getSourceKey(req);
  const current = store.get(sourceKey);

  if (!current) {
    store.set(sourceKey, {
      count: 1,
      windowStart: now,
    });

    res.setHeader("X-RateLimit-Limit", MAX_REQUESTS.toString());
    res.setHeader("X-RateLimit-Remaining", (MAX_REQUESTS - 1).toString());

    return next();
  }

  const windowExpired = now - current.windowStart >= WINDOW_MS;

  if (windowExpired) {
    store.set(sourceKey, {
      count: 1,
      windowStart: now,
    });

    res.setHeader("X-RateLimit-Limit", MAX_REQUESTS.toString());
    res.setHeader("X-RateLimit-Remaining", (MAX_REQUESTS - 1).toString());

    return next();
  }

  if (current.count >= MAX_REQUESTS) {
    const retryAfterMs = WINDOW_MS - (now - current.windowStart);
    const retryAfterSeconds = Math.ceil(retryAfterMs / 1000);

    res.setHeader("X-RateLimit-Limit", MAX_REQUESTS.toString());
    res.setHeader("X-RateLimit-Remaining", "0");
    res.setHeader("Retry-After", retryAfterSeconds.toString());

    return res.status(429).json({
      error: "Too many webhook requests",
      retryAfterSeconds,
    });
  }

  current.count += 1;
  store.set(sourceKey, current);

  res.setHeader("X-RateLimit-Limit", MAX_REQUESTS.toString());
  res.setHeader(
    "X-RateLimit-Remaining",
    (MAX_REQUESTS - current.count).toString()
  );

  next();
}