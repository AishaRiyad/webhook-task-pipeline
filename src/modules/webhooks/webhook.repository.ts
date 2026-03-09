import { pool } from "../../db/database";

export async function createWebhookEventRecord(data: {
  id: string;
  pipeline_id: string;
  headers: Record<string, unknown>;
  payload: Record<string, unknown>;
}) {
  const query = `
    INSERT INTO webhook_events (id, pipeline_id, headers, payload)
    VALUES ($1, $2, $3, $4)
    RETURNING *;
  `;

  const values = [
    data.id,
    data.pipeline_id,
    JSON.stringify(data.headers),
    JSON.stringify(data.payload),
  ];

  const result = await pool.query(query, values);
  return result.rows[0];
}

export async function createJobRecord(data: {
  id: string;
  pipeline_id: string;
  webhook_event_id: string;
  status: string;
}) {
  const query = `
    INSERT INTO jobs (id, pipeline_id, webhook_event_id, status)
    VALUES ($1, $2, $3, $4)
    RETURNING *;
  `;

  const values = [
    data.id,
    data.pipeline_id,
    data.webhook_event_id,
    data.status,
  ];

  const result = await pool.query(query, values);
  return result.rows[0];
}