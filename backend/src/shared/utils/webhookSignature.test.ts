import { describe, expect, it } from "vitest";
import { generateWebhookSignature, verifyWebhookSignature } from "./webhookSignature";

describe("webhookSignature", () => {
  it("generates and verifies a valid signature", () => {
    const secret = "super_secret_key";

    const timestamp = Math.floor(Date.now() / 1000).toString();

    const rawBody = JSON.stringify({
      orderId: "ORD-1001",
      status: "created",
      amount: 150,
    });

    const signature = generateWebhookSignature(rawBody, secret, timestamp);

    const isValid = verifyWebhookSignature(rawBody, secret, signature, timestamp);

    expect(isValid).toBe(true);
  });

  it("rejects an invalid signature", () => {
    const secret = "super_secret_key";

    const timestamp = Math.floor(Date.now() / 1000).toString();

    const rawBody = JSON.stringify({
      orderId: "ORD-1001",
      status: "created",
    });

    const isValid = verifyWebhookSignature(
      rawBody,
      secret,
      "invalidsignature",
      timestamp
    );

    expect(isValid).toBe(false);
  });

  it("rejects an expired timestamp", () => {
    const secret = "super_secret_key";

    const oldTimestamp = (Math.floor(Date.now() / 1000) - 1000).toString();

    const rawBody = JSON.stringify({
      orderId: "ORD-1002",
    });

    const signature = generateWebhookSignature(rawBody, secret, oldTimestamp);

    const isValid = verifyWebhookSignature(
      rawBody,
      secret,
      signature,
      oldTimestamp
    );

    expect(isValid).toBe(false);
  });

  it("rejects malformed timestamp", () => {
    const secret = "super_secret_key";

    const rawBody = JSON.stringify({
      orderId: "ORD-1003",
    });

    const isValid = verifyWebhookSignature(
      rawBody,
      secret,
      "abcd",
      "not-a-number"
    );

    expect(isValid).toBe(false);
  });
});