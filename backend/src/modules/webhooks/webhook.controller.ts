import { Request, Response } from "express";
import { findPipelineBySourceKey } from "../pipelines/pipeline.repository";
import { verifyWebhookSignature } from "../../shared/utils/webhookSignature";
import { ingestWebhook } from "./webhook.service";

type WebhookParams = {
  sourceKey: string;
};

type RawBodyRequest<TParams = Record<string, string>> = Request<TParams> & {
  rawBody?: string;
};

export async function ingestWebhookHandler(req: RawBodyRequest<WebhookParams>, res: Response) {
  try {
    const sourceKey = req.params.sourceKey;

    const signature = req.header("x-webhook-signature");
    const timestamp = req.header("x-webhook-timestamp");

    const pipeline = await findPipelineBySourceKey(sourceKey);

    if (!pipeline) {
      return res.status(404).json({
        message: "Pipeline not found or inactive",
      });
    }

    if (!signature || !timestamp) {
      return res.status(401).json({
        message: "Missing webhook signature headers",
      });
    }

    const rawBody = req.rawBody ?? "";

    const isValid = verifyWebhookSignature(rawBody, pipeline.webhook_secret, signature, timestamp);

    if (!isValid) {
      return res.status(401).json({
        message: "Invalid webhook signature",
      });
    }

    const result = await ingestWebhook(
      pipeline,
      req.body ?? {},
      req.headers as Record<string, unknown>
    );

    return res.status(202).json({
      message: "Webhook accepted and queued for processing",
      data: {
        pipeline_id: result.pipeline.id,
        webhook_event_id: result.webhook_event.id,
        job_id: result.job.id,
        job_status: result.job.status,
      },
    });
  } catch (error) {
    return res.status(500).json({
      message: "Failed to ingest webhook",
      error: error instanceof Error ? error.message : "Unknown error",
    });
  }
}
