import { randomUUID } from "crypto";
import { createJobRecord, createWebhookEventRecord } from "./webhook.repository";

type Pipeline = {
  id: string;
  name: string;
  source_key: string;
  webhook_secret: string;
  action_type: string;
  action_config: Record<string, unknown>;
  is_active?: boolean;
};

export async function ingestWebhook(
  pipeline: Pipeline,
  payload: Record<string, unknown>,
  headers: Record<string, unknown>
) {
  const webhookEvent = await createWebhookEventRecord({
    id: randomUUID(),
    pipeline_id: pipeline.id,
    headers,
    payload,
  });

  const job = await createJobRecord({
    id: randomUUID(),
    pipeline_id: pipeline.id,
    webhook_event_id: webhookEvent.id,
    status: "pending",
  });

  return {
    pipeline,
    webhook_event: webhookEvent,
    job,
  };
}
