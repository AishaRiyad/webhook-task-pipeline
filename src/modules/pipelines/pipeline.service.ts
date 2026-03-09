import { randomUUID } from "crypto";
import {
  createPipelineRecord,
  createSubscriberRecord,
  deletePipelineById,
  findAllPipelines,
  findPipelineById,
  findPipelineOwnedByUser,
} from "./pipeline.repository";
import { CreatePipelineInput } from "./pipeline.types";
import {
  createPipelineLinkRecord,
  deletePipelineLinkRecord,
  findPipelineLink,
  findPipelineLinksBySourcePipelineId,
  findPipelineLinksGraph,
} from "./pipelineLink.repository";

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

  const pipeline = await createPipelineRecord({
    id: pipelineId,
    user_id: userId,
    name: data.name,
    source_key: sourceKey,
    webhook_secret: webhookSecret,
    action_type: data.action_type,
    action_config: data.action_config ?? {},
  });

  const subscribers = [];

  if (data.subscribers && data.subscribers.length > 0) {
    for (const subscriber of data.subscribers) {
      const createdSubscriber = await createSubscriberRecord({
        id: randomUUID(),
        pipeline_id: pipelineId,
        target_url: subscriber.target_url,
      });

      subscribers.push(createdSubscriber);
    }
  }

  return {
    ...pipeline,
    subscribers,
  };
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


function willCreateCycle(
  links: Array<{ source_pipeline_id: string; target_pipeline_id: string }>,
  sourcePipelineId: string,
  targetPipelineId: string
) {
  const graph = new Map<string, string[]>();

  for (const link of links) {
    if (!graph.has(link.source_pipeline_id)) {
      graph.set(link.source_pipeline_id, []);
    }
    graph.get(link.source_pipeline_id)!.push(link.target_pipeline_id);
  }

  if (!graph.has(sourcePipelineId)) {
    graph.set(sourcePipelineId, []);
  }
  graph.get(sourcePipelineId)!.push(targetPipelineId);

  const visited = new Set<string>();
  const stack = new Set<string>();

  function dfs(node: string): boolean {
    if (stack.has(node)) return true;
    if (visited.has(node)) return false;

    visited.add(node);
    stack.add(node);

    const neighbors = graph.get(node) ?? [];
    for (const neighbor of neighbors) {
      if (dfs(neighbor)) return true;
    }

    stack.delete(node);
    return false;
  }

  return dfs(sourcePipelineId);
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

  return createPipelineLinkRecord({
    id: randomUUID(),
    source_pipeline_id: sourcePipelineId,
    target_pipeline_id: targetPipelineId,
  });
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