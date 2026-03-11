import { pool } from "../../db/database";

export async function findSubscribersByPipelineId(pipelineId: string) {
  const query = `
    SELECT *
    FROM pipeline_subscribers
    WHERE pipeline_id = $1 AND is_active = TRUE
    ORDER BY created_at ASC
  `;

  const result = await pool.query(query, [pipelineId]);
  return result.rows;
}

export async function createDeliveryRecord(data: {
  id: string;
  job_id: string;
  subscriber_id: string;
  status: string;
}) {
  const query = `
    INSERT INTO job_deliveries (id, job_id, subscriber_id, status)
    VALUES ($1, $2, $3, $4)
    RETURNING *;
  `;

  const values = [data.id, data.job_id, data.subscriber_id, data.status];
  const result = await pool.query(query, values);
  return result.rows[0];
}

export async function createDeliveryAttemptLog(data: {
  id: string;
  delivery_id: string;
  attempt_number: number;
  request_payload: Record<string, unknown> | null;
  response_status: number | null;
  response_body: string | null;
  error_message: string | null;
}) {
  const query = `
    INSERT INTO delivery_attempt_logs (
      id,
      delivery_id,
      attempt_number,
      request_payload,
      response_status,
      response_body,
      error_message
    )
    VALUES ($1, $2, $3, $4, $5, $6, $7)
    RETURNING *;
  `;

  const values = [
    data.id,
    data.delivery_id,
    data.attempt_number,
    JSON.stringify(data.request_payload ?? {}),
    data.response_status,
    data.response_body,
    data.error_message,
  ];

  const result = await pool.query(query, values);
  return result.rows[0];
}

export async function updateDeliverySuccess(data: {
  delivery_id: string;
  attempt_number: number;
  response_status: number | null;
}) {
  const query = `
    UPDATE job_deliveries
    SET status = 'delivered',
        attempts = $2,
        last_response_status = $3,
        last_error = NULL,
        next_retry_at = NULL,
        delivered_at = NOW()
    WHERE id = $1
    RETURNING *;
  `;

  const values = [data.delivery_id, data.attempt_number, data.response_status];
  const result = await pool.query(query, values);
  return result.rows[0];
}

export async function updateDeliveryFailure(data: {
  delivery_id: string;
  attempt_number: number;
  response_status: number | null;
  error_message: string;
  next_retry_at: Date | null;
  status: string;
}) {
  const query = `
    UPDATE job_deliveries
    SET status = $2,
        attempts = $3,
        last_response_status = $4,
        last_error = $5,
        next_retry_at = $6
    WHERE id = $1
    RETURNING *;
  `;

  const values = [
    data.delivery_id,
    data.status,
    data.attempt_number,
    data.response_status,
    data.error_message,
    data.next_retry_at,
  ];

  const result = await pool.query(query, values);
  return result.rows[0];
}

export async function findPendingDeliveries() {
  const query = `
    SELECT jd.*, ps.target_url
    FROM job_deliveries jd
    JOIN pipeline_subscribers ps ON ps.id = jd.subscriber_id
    WHERE jd.status IN ('pending', 'retry_pending')
      AND (jd.next_retry_at IS NULL OR jd.next_retry_at <= NOW())
    ORDER BY jd.created_at ASC
  `;

  const result = await pool.query(query);
  return result.rows;
}

export async function findJobById(jobId: string) {
  const query = `
    SELECT *
    FROM jobs
    WHERE id = $1
  `;

  const result = await pool.query(query, [jobId]);
  return result.rows[0] || null;
}
