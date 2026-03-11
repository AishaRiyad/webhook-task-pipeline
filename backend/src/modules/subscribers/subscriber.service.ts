import { randomUUID } from "crypto";
import { findPipelineById } from "../pipelines/pipeline.repository";
import {
  createSubscriber,
  deleteSubscriberById,
  getSubscribersByPipelineId,
} from "./subscriber.repository";

export async function addSubscriberToPipeline(
  pipelineId: string,
  targetUrl: string,
  userId: string
) {
  const pipeline = await findPipelineById(pipelineId, userId);

  if (!pipeline) {
    return null;
  }

  const subscriber = await createSubscriber({
    id: randomUUID(),
    pipeline_id: pipelineId,
    target_url: targetUrl,
  });

  return subscriber;
}

export async function listPipelineSubscribers(
  pipelineId: string,
  userId: string
) {
  const pipeline = await findPipelineById(pipelineId, userId);

  if (!pipeline) {
    return null;
  }

  return getSubscribersByPipelineId(pipelineId);
}

export async function removeSubscriberFromPipeline(
  pipelineId: string,
  subscriberId: string,
  userId: string
) {
  const pipeline = await findPipelineById(pipelineId, userId);

  if (!pipeline) {
    return null;
  }

  return deleteSubscriberById(pipelineId, subscriberId);
}