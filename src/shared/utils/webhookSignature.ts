import crypto from "crypto";

const SIGNATURE_TOLERANCE_SECONDS = 300; 

export function generateWebhookSignature(
  rawBody: string,
  secret: string,
  timestamp: string
): string {
  const signedPayload = `${timestamp}.${rawBody}`;

  return crypto
    .createHmac("sha256", secret)
    .update(signedPayload)
    .digest("hex");
}

export function verifyWebhookSignature(
  rawBody: string,
  secret: string,
  receivedSignature: string,
  timestamp: string
): boolean {
  if (!receivedSignature || !timestamp) {
    return false;
  }

  const now = Math.floor(Date.now() / 1000);
  const requestTime = parseInt(timestamp, 10);

  if (isNaN(requestTime)) {
    return false;
  }

  if (Math.abs(now - requestTime) > SIGNATURE_TOLERANCE_SECONDS) {
    return false;
  }

  const expectedSignature = generateWebhookSignature(
    rawBody,
    secret,
    timestamp
  );

  const expectedBuffer = Buffer.from(expectedSignature, "hex");
  const receivedBuffer = Buffer.from(receivedSignature, "hex");

  if (expectedBuffer.length !== receivedBuffer.length) {
    return false;
  }

  return crypto.timingSafeEqual(expectedBuffer, receivedBuffer);
}