import { pool } from "../../db/database";

export async function findAllJobs(userId: string) {
  const query = `
    SELECT j.*
    FROM jobs j
    JOIN pipelines p ON p.id = j.pipeline_id
    WHERE p.user_id = $1
    ORDER BY j.created_at DESC
  `;

  const result = await pool.query(query, [userId]);
  return result.rows;
}

export async function findJobById(jobId: string, userId: string) {
  const query = `
    SELECT j.*
    FROM jobs j
    JOIN pipelines p ON p.id = j.pipeline_id
    WHERE j.id = $1 AND p.user_id = $2
    LIMIT 1
  `;

  const result = await pool.query(query, [jobId, userId]);
  return result.rows[0] || null;
}

export async function findDeliveriesByJobId(jobId: string, userId: string) {
  const query = `
    SELECT
      jd.*,
      ps.target_url
    FROM job_deliveries jd
    JOIN jobs j ON j.id = jd.job_id
    JOIN pipelines p ON p.id = j.pipeline_id
    JOIN pipeline_subscribers ps ON ps.id = jd.subscriber_id
    WHERE jd.job_id = $1 AND p.user_id = $2
    ORDER BY jd.created_at ASC
  `;

  const result = await pool.query(query, [jobId, userId]);
  return result.rows;
}

export async function findDeliveryAttemptLogsByJobId(
  jobId: string,
  userId: string
) {
  const query = `
    SELECT
      dal.*,
      jd.subscriber_id
    FROM delivery_attempt_logs dal
    JOIN job_deliveries jd ON jd.id = dal.delivery_id
    JOIN jobs j ON j.id = jd.job_id
    JOIN pipelines p ON p.id = j.pipeline_id
    WHERE jd.job_id = $1 AND p.user_id = $2
    ORDER BY dal.attempted_at DESC
  `;

  const result = await pool.query(query, [jobId, userId]);
  return result.rows;
}