import { describe, expect, it, vi, afterEach } from "vitest";
import { calculateNextRetry, calculateRetryDelaySeconds } from "./retry";

describe("retry utils", () => {
  afterEach(() => {
    vi.useRealTimers();
  });

  it("calculates exponential delay for first attempts", () => {
    expect(calculateRetryDelaySeconds(1)).toBe(10);
    expect(calculateRetryDelaySeconds(2)).toBe(20);
    expect(calculateRetryDelaySeconds(3)).toBe(40);
  });

  it("caps retry delay at 300 seconds", () => {
    expect(calculateRetryDelaySeconds(10)).toBe(300);
    expect(calculateRetryDelaySeconds(20)).toBe(300);
  });

  it("returns a future retry date based on the attempt number", () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-03-11T10:00:00.000Z"));

    const nextRetry = calculateNextRetry(2);

    expect(nextRetry.toISOString()).toBe("2026-03-11T10:00:20.000Z");
  });
});
