import { useState } from "react";
import Layout from "../components/Layout";

const API_BASE = "http://localhost:3000";

async function generateSignature(secret: string, timestamp: string, payload: string) {
  const encoder = new TextEncoder();
  const keyData = encoder.encode(secret);
  const message = encoder.encode(`${timestamp}.${payload}`);

  const cryptoKey = await window.crypto.subtle.importKey(
    "raw",
    keyData,
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"]
  );

  const signatureBuffer = await window.crypto.subtle.sign("HMAC", cryptoKey, message);
  const bytes = Array.from(new Uint8Array(signatureBuffer));
  return bytes.map((b) => b.toString(16).padStart(2, "0")).join("");
}

export default function WebhookTesterPage() {
  const [sourceKey, setSourceKey] = useState("");
  const [webhookSecret, setWebhookSecret] = useState("");
  const [payload, setPayload] = useState(
    JSON.stringify(
      {
        orderId: "ORD-1002",
        status: "created",
        amount: 200,
        customer: "Aisha",
      },
      null,
      2
    )
  );
  const [message, setMessage] = useState("");
  const [sending, setSending] = useState(false);

  async function handleSendWebhook(e: React.FormEvent) {
    e.preventDefault();
    setMessage("");

    if (!sourceKey.trim() || !webhookSecret.trim() || !payload.trim()) {
      setMessage("Please fill all fields");
      return;
    }

    try {
      setSending(true);

      JSON.parse(payload);

      const timestamp = Math.floor(Date.now() / 1000).toString();
      const signature = await generateSignature(webhookSecret.trim(), timestamp, payload);

      const response = await fetch(`${API_BASE}/webhooks/${sourceKey.trim()}`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-webhook-timestamp": timestamp,
          "x-webhook-signature": signature,
        },
        body: payload,
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data?.message || `Webhook failed with status ${response.status}`);
      }

      setMessage("Webhook sent successfully and queued for processing");
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Failed to send webhook");
    } finally {
      setSending(false);
    }
  }

  return (
    <Layout>
      <div className="page-header">
        <h1>Webhook Tester</h1>
        <p>Send signed webhook requests directly from the frontend.</p>
      </div>

      <div className="cute-card big-card">
        <form className="pipeline-form" onSubmit={handleSendWebhook}>
          <label>Pipeline Source Key</label>
          <input
            className="cute-input"
            value={sourceKey}
            onChange={(e) => setSourceKey(e.target.value)}
            placeholder="orders-enricher-abc12345"
          />

          <label>Webhook Secret</label>
          <input
            className="cute-input"
            value={webhookSecret}
            onChange={(e) => setWebhookSecret(e.target.value)}
            placeholder="Paste webhook secret"
          />

          <label>Payload JSON</label>
          <textarea
            className="cute-input cute-textarea"
            value={payload}
            onChange={(e) => setPayload(e.target.value)}
          />

          {message && <div className="info-box">{message}</div>}

          <button className="primary-btn" type="submit" disabled={sending}>
            {sending ? "Sending..." : "Send Webhook"}
          </button>
        </form>
      </div>
    </Layout>
  );
}