import { pool } from "../db/database";
import { createDeliveriesForJob } from "../modules/deliveries/delivery.service";
import { randomUUID } from "crypto";
import { findLinkedTargetPipelines } from "../modules/pipelines/pipelineLink.repository";
import {
  createJobRecord,
  createWebhookEventRecord,
} from "../modules/webhooks/webhook.repository";


const WORKER_NAME = process.env.WORKER_NAME || "job-worker";

const parsedPollInterval = Number(process.env.WORKER_POLL_INTERVAL_MS);
const POLL_INTERVAL_MS =
  Number.isFinite(parsedPollInterval) && parsedPollInterval > 0
    ? parsedPollInterval
    : 2000;

async function sleep(ms: number) {
  await new Promise((resolve) => setTimeout(resolve, ms));
}

async function enqueueChainedJobs(
  sourceJob: any,
  processedPayload: Record<string, unknown>
) {
  const targetPipelines = await findLinkedTargetPipelines(sourceJob.pipeline_id);

  for (const targetPipeline of targetPipelines) {
    const chainedWebhookEvent = await createWebhookEventRecord({
      id: randomUUID(),
      pipeline_id: targetPipeline.id,
      headers: {
        "x-internal-chain": true,
        "x-parent-job-id": sourceJob.id,
        "x-parent-pipeline-id": sourceJob.pipeline_id,
      },
      payload: processedPayload,
    });

    await createJobRecord({
      id: randomUUID(),
      pipeline_id: targetPipeline.id,
      webhook_event_id: chainedWebhookEvent.id,
      status: "pending",
    });
  }
}

async function fetchNextJob() {
  const client = await pool.connect();

  try {
    await client.query("BEGIN");

    const result = await client.query(`
      SELECT *
      FROM jobs
      WHERE status = 'pending'
        AND available_at <= NOW()
      ORDER BY created_at ASC
      LIMIT 1
      FOR UPDATE SKIP LOCKED
    `);

    if (result.rows.length === 0) {
      await client.query("COMMIT");
      return null;
    }

    const job = result.rows[0];

    await client.query(
      `
      UPDATE jobs
      SET status = 'processing',
          started_at = NOW()
      WHERE id = $1
      `,
      [job.id]
    );

    await client.query("COMMIT");
    return job;
  } catch (error) {
    await client.query("ROLLBACK");
    throw error;
  } finally {
    client.release();
  }
}

async function processJob(job: any) {
  try {
    console.log(`[${WORKER_NAME}] Processing job: ${job.id}`);

    const eventResult = await pool.query(
      `
      SELECT *
      FROM webhook_events
      WHERE id = $1
      `,
      [job.webhook_event_id]
    );

    const event = eventResult.rows[0];
    if (!event) {
      throw new Error(`Webhook event not found for job ${job.id}`);
    }

    const pipelineResult = await pool.query(
      `
      SELECT *
      FROM pipelines
      WHERE id = $1
      `,
      [job.pipeline_id]
    );

    const pipeline = pipelineResult.rows[0];
    if (!pipeline) {
      throw new Error(`Pipeline not found for job ${job.id}`);
    }

    let processedPayload = event.payload;
    let shouldSkipJob = false;
    let skipReason: string | null = null;

    if (pipeline.action_type === "deduplicate") {
  const idField = pipeline.action_config?.id_field;

  if (idField) {
    const eventId = event.payload?.[idField];

    if (eventId) {
      const duplicateCheck = await pool.query(
        `
        SELECT COUNT(*)
        FROM webhook_events
        WHERE pipeline_id = $1
          AND payload ->> $2 = $3
          AND id != $4
        `,
        [pipeline.id, idField, String(eventId), event.id]
      );

      const count = Number(duplicateCheck.rows[0].count);

      if (count > 0) {
        console.log(
          `[${WORKER_NAME}] Duplicate event detected for ${eventId}`
        );

        shouldSkipJob = true;
        skipReason = `Duplicate event detected for ${eventId}`;
        processedPayload = null;
      }
    }
  }
}

    if (pipeline.action_type === "transform") {
      const fields = pipeline.action_config?.fields ?? [];
      const transformed: Record<string, unknown> = {};

      for (const field of fields) {
        if (field in event.payload) {
          transformed[field] = event.payload[field];
        }
      }

      processedPayload = transformed;
    }

    if (pipeline.action_type === "enrich") {
      processedPayload = {
        ...event.payload,
        processed_at: new Date().toISOString(),
      };
    }

    if (pipeline.action_type === "filter") {
      const field = pipeline.action_config?.field;
      const value = pipeline.action_config?.value;

      if (event.payload?.[field] !== value) {
        processedPayload = null;
      }
    }

   if (shouldSkipJob) {
  await pool.query(
    `
    UPDATE jobs
    SET status = 'skipped',
        completed_at = NOW(),
        result_payload = NULL,
        error_message = $2
    WHERE id = $1
    `,
    [job.id, skipReason]
  );

  console.log(`[${WORKER_NAME}] Job skipped: ${job.id}`);
  return;
}

await pool.query(
  `
  UPDATE jobs
  SET status = 'completed',
      completed_at = NOW(),
      result_payload = $2
  WHERE id = $1
  `,
  [job.id, processedPayload]
);

if (processedPayload) {
  await createDeliveriesForJob(job.id, job.pipeline_id);
  await enqueueChainedJobs(job, processedPayload as Record<string, unknown>);
}

    console.log(`[${WORKER_NAME}] Job completed: ${job.id}`);
  } catch (error) {
    await pool.query(
      `
      UPDATE jobs
      SET status = 'failed',
          failed_at = NOW(),
          error_message = $2
      WHERE id = $1
      `,
      [job.id, error instanceof Error ? error.message : "Unknown error"]
    );

    console.error(`[${WORKER_NAME}] Job failed: ${job.id}`, error);
  }
}

async function workerLoop() {
  console.log(
    `[${WORKER_NAME}] Started. Poll interval: ${POLL_INTERVAL_MS}ms`
  );

  while (true) {
    try {
      const job = await fetchNextJob();

      if (job) {
        await processJob(job);
      }
    } catch (error) {
      console.error(`[${WORKER_NAME}] Worker error:`, error);
    } finally {
      await sleep(POLL_INTERVAL_MS);
    }
  }
}

workerLoop();