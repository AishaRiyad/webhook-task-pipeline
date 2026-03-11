import { pool } from "../../db/database";

export async function createPipelineLinkRecord(data: {
  id: string;
  source_pipeline_id: string;
  target_pipeline_id: string;
}) {
  const query = `
    INSERT INTO pipeline_links (id, source_pipeline_id, target_pipeline_id)
    VALUES ($1, $2, $3)
    RETURNING *;
  `;

  const values = [data.id, data.source_pipeline_id, data.target_pipeline_id];
  const result = await pool.query(query, values);
  return result.rows[0];
}

export async function findPipelineLinksBySourcePipelineId(sourcePipelineId: string) {
  const query = `
    SELECT
      pl.*,
      p.name AS target_pipeline_name,
      p.source_key AS target_pipeline_source_key,
      p.action_type AS target_pipeline_action_type,
      p.is_active AS target_pipeline_is_active
    FROM pipeline_links pl
    JOIN pipelines p ON p.id = pl.target_pipeline_id
    WHERE pl.source_pipeline_id = $1
    ORDER BY pl.created_at ASC;
  `;

  const result = await pool.query(query, [sourcePipelineId]);
  return result.rows;
}

export async function findLinkedTargetPipelines(sourcePipelineId: string) {
  const query = `
    SELECT p.*
    FROM pipeline_links pl
    JOIN pipelines p ON p.id = pl.target_pipeline_id
    WHERE pl.source_pipeline_id = $1
      AND p.is_active = TRUE
    ORDER BY pl.created_at ASC;
  `;

  const result = await pool.query(query, [sourcePipelineId]);
  return result.rows;
}

export async function deletePipelineLinkRecord(sourcePipelineId: string, targetPipelineId: string) {
  const query = `
    DELETE FROM pipeline_links
    WHERE source_pipeline_id = $1 AND target_pipeline_id = $2
    RETURNING *;
  `;

  const result = await pool.query(query, [sourcePipelineId, targetPipelineId]);
  return result.rows[0] || null;
}

export async function findPipelineLink(sourcePipelineId: string, targetPipelineId: string) {
  const query = `
    SELECT *
    FROM pipeline_links
    WHERE source_pipeline_id = $1 AND target_pipeline_id = $2
    LIMIT 1;
  `;

  const result = await pool.query(query, [sourcePipelineId, targetPipelineId]);
  return result.rows[0] || null;
}

export async function findPipelineLinksGraph() {
  const query = `
    SELECT source_pipeline_id, target_pipeline_id
    FROM pipeline_links;
  `;

  const result = await pool.query(query);
  return result.rows;
}
