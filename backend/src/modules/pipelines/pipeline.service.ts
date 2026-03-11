import { randomUUID } from "crypto";
import { pool } from "../../db/database";
import {
  deletePipelineById,
  findAllPipelines,
  findPipelineById,
  findPipelineOwnedByUser,
} from "./pipeline.repository";
import { CreatePipelineInput } from "./pipeline.types";
import {
  deletePipelineLinkRecord,
  findPipelineLink,
  findPipelineLinksBySourcePipelineId,
  findPipelineLinksGraph,
} from "./pipelineLink.repository";
import { willCreateCycle } from "./pipelineGraph";

function generateSourceKey(name: string) {
  const normalized = name
    .toLowerCase()
    .trim()
    .replace(/\s+/g, "-")
    .replace(/[^a-z0-9-]/g, "");

  return `${normalized}-${randomUUID().slice(0, 8)}`;
}

function generateWebhookSecret() {
  return randomUUID().replace(/-/g, "") + randomUUID().replace(/-/g, "");
}

export async function createPipeline(data: CreatePipelineInput, userId: string) {
  const pipelineId = randomUUID();
  const sourceKey = generateSourceKey(data.name);
  const webhookSecret = generateWebhookSecret();

  const client = await pool.connect();

  try {
    await client.query("BEGIN");

    const pipelineResult = await client.query(
      `
      INSERT INTO pipelines (
        id,
        user_id,
        name,
        source_key,
        webhook_secret,
        action_type,
        action_config
      )
      VALUES ($1, $2, $3, $4, $5, $6, $7)
      RETURNING id, user_id, name, source_key, webhook_secret, action_type, action_config, is_active, created_at, updated_at;
      `,
      [
        pipelineId,
        userId,
        data.name,
        sourceKey,
        webhookSecret,
        data.action_type,
        JSON.stringify(data.action_config ?? {}),
      ]
    );

    const pipeline = pipelineResult.rows[0];
    const subscribers = [];

    if (data.subscribers && data.subscribers.length > 0) {
      for (const subscriber of data.subscribers) {
        const subscriberResult = await client.query(
          `
          INSERT INTO pipeline_subscribers (id, pipeline_id, target_url)
          VALUES ($1, $2, $3)
          RETURNING *;
          `,
          [randomUUID(), pipelineId, subscriber.target_url]
        );

        subscribers.push(subscriberResult.rows[0]);
      }
    }

    await client.query("COMMIT");

    return {
      ...pipeline,
      subscribers,
    };
  } catch (error) {
    await client.query("ROLLBACK");
    throw error;
  } finally {
    client.release();
  }
}

export async function getAllPipelines(userId: string) {
  return findAllPipelines(userId);
}

export async function getPipelineById(id: string, userId: string) {
  return findPipelineById(id, userId);
}

export async function removePipelineById(id: string, userId: string) {
  return deletePipelineById(id, userId);
}

export async function createPipelineLink(
  sourcePipelineId: string,
  targetPipelineId: string,
  userId: string
) {
  if (sourcePipelineId === targetPipelineId) {
    throw new Error("A pipeline cannot be linked to itself");
  }

  const sourcePipeline = await findPipelineOwnedByUser(sourcePipelineId, userId);
  if (!sourcePipeline) {
    return null;
  }

  const targetPipeline = await findPipelineOwnedByUser(targetPipelineId, userId);
  if (!targetPipeline) {
    throw new Error("Target pipeline not found or not owned by the user");
  }

  const existingLink = await findPipelineLink(sourcePipelineId, targetPipelineId);
  if (existingLink) {
    throw new Error("Pipeline link already exists");
  }

  const allLinks = await findPipelineLinksGraph();
  const createsCycle = willCreateCycle(allLinks, sourcePipelineId, targetPipelineId);

  if (createsCycle) {
    throw new Error("This link would create a cycle");
  }

  const client = await pool.connect();

  try {
    await client.query("BEGIN");

    const linkResult = await client.query(
      `
      INSERT INTO pipeline_links (id, source_pipeline_id, target_pipeline_id)
      VALUES ($1, $2, $3)
      RETURNING *;
      `,
      [randomUUID(), sourcePipelineId, targetPipelineId]
    );

    await client.query("COMMIT");
    return linkResult.rows[0];
  } catch (error) {
    await client.query("ROLLBACK");
    throw error;
  } finally {
    client.release();
  }
}

export async function getPipelineLinks(pipelineId: string, userId: string) {
  const pipeline = await findPipelineOwnedByUser(pipelineId, userId);

  if (!pipeline) {
    return null;
  }

  return findPipelineLinksBySourcePipelineId(pipelineId);
}

export async function removePipelineLink(
  sourcePipelineId: string,
  targetPipelineId: string,
  userId: string
) {
  const pipeline = await findPipelineOwnedByUser(sourcePipelineId, userId);

  if (!pipeline) {
    return null;
  }

  return deletePipelineLinkRecord(sourcePipelineId, targetPipelineId);
}
