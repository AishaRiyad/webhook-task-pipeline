import { pool } from "../../db/database";

export async function createSubscriber(data: {
  id: string;
  pipeline_id: string;
  target_url: string;
}) {
  const query = `
    INSERT INTO pipeline_subscribers (id, pipeline_id, target_url)
    VALUES ($1, $2, $3)
    RETURNING *;
  `;

  const values = [data.id, data.pipeline_id, data.target_url];
  const result = await pool.query(query, values);
  return result.rows[0];
}

export async function getSubscribersByPipelineId(pipelineId: string) {
  const query = `
    SELECT *
    FROM pipeline_subscribers
    WHERE pipeline_id = $1
    ORDER BY created_at ASC
  `;

  const result = await pool.query(query, [pipelineId]);
  return result.rows;
}

export async function deleteSubscriberById(pipelineId: string, subscriberId: string) {
  const query = `
    DELETE FROM pipeline_subscribers
    WHERE id = $1 AND pipeline_id = $2
    RETURNING *;
  `;

  const result = await pool.query(query, [subscriberId, pipelineId]);
  return result.rows[0] || null;
}
