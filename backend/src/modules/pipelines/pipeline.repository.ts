import { pool } from "../../db/database";

export async function createPipelineRecord(data: {
  id: string;
  user_id: string;
  name: string;
  source_key: string;
  webhook_secret: string;
  action_type: string;
  action_config: Record<string, unknown>;
}) {
  const query = `
    INSERT INTO pipelines (id, user_id, name, source_key, webhook_secret, action_type, action_config)
    VALUES ($1, $2, $3, $4, $5, $6, $7)
    RETURNING id, user_id, name, source_key, webhook_secret, action_type, action_config, is_active, created_at, updated_at;
  `;

  const values = [
    data.id,
    data.user_id,
    data.name,
    data.source_key,
    data.webhook_secret,
    data.action_type,
    JSON.stringify(data.action_config),
  ];

  const result = await pool.query(query, values);
  return result.rows[0];
}

export async function createSubscriberRecord(data: {
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

export async function findAllPipelines(userId: string) {
  const query = `
    SELECT id, user_id, name, source_key, action_type, action_config, is_active, created_at, updated_at
    FROM pipelines
    WHERE user_id = $1
    ORDER BY created_at DESC;
  `;
  const result = await pool.query(query, [userId]);
  return result.rows;
}

export async function findPipelineById(id: string, userId: string) {
  const pipelineQuery = `
    SELECT id, user_id, name, source_key, action_type, action_config, is_active, created_at, updated_at
    FROM pipelines
    WHERE id = $1 AND user_id = $2;
  `;
  const pipelineResult = await pool.query(pipelineQuery, [id, userId]);

  if (pipelineResult.rows.length === 0) {
    return null;
  }

  const subscribersQuery = `
    SELECT *
    FROM pipeline_subscribers
    WHERE pipeline_id = $1
    ORDER BY created_at ASC;
  `;
  const subscribersResult = await pool.query(subscribersQuery, [id]);

  return {
    ...pipelineResult.rows[0],
    subscribers: subscribersResult.rows,
  };
}

export async function deletePipelineById(id: string, userId: string) {
  const query = `
    DELETE FROM pipelines
    WHERE id = $1 AND user_id = $2
    RETURNING id, user_id, name, source_key, action_type, action_config, is_active, created_at, updated_at;
  `;
  const result = await pool.query(query, [id, userId]);
  return result.rows[0] || null;
}

export async function findPipelineBySourceKey(sourceKey: string) {
  const pipelineQuery = `
    SELECT *
    FROM pipelines
    WHERE source_key = $1 AND is_active = TRUE;
  `;
  const pipelineResult = await pool.query(pipelineQuery, [sourceKey]);

  if (pipelineResult.rows.length === 0) {
    return null;
  }

  const subscribersQuery = `
    SELECT *
    FROM pipeline_subscribers
    WHERE pipeline_id = $1 AND is_active = TRUE
    ORDER BY created_at ASC;
  `;
  const subscribersResult = await pool.query(subscribersQuery, [
    pipelineResult.rows[0].id,
  ]);

  return {
    ...pipelineResult.rows[0],
    subscribers: subscribersResult.rows,
  };
}

export async function findPipelineOwnedByUser(pipelineId: string, userId: string) {
  const query = `
    SELECT *
    FROM pipelines
    WHERE id = $1 AND user_id = $2
    LIMIT 1;
  `;

  const result = await pool.query(query, [pipelineId, userId]);
  return result.rows[0] || null;
}