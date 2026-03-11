import { randomUUID } from "crypto";

import { pool } from "../db/database";
import { createDeliveriesForJob } from "../modules/deliveries/delivery.service";
import { findLinkedTargetPipelines } from "../modules/pipelines/pipelineLink.repository";
import { createJobRecord, createWebhookEventRecord } from "../modules/webhooks/webhook.repository";
import { sendFailureNotification } from "../shared/utils/failureNotifier";

const WORKER_NAME = process.env.WORKER_NAME || "job-worker";

const parsedPollInterval = Number(process.env.WORKER_POLL_INTERVAL_MS);
const POLL_INTERVAL_MS =
  Number.isFinite(parsedPollInterval) && parsedPollInterval > 0 ? parsedPollInterval : 2000;

type JsonObject = Record<string, unknown>;

type JobRow = {
  id: string;
  pipeline_id: string;
  webhook_event_id: string;
  status: string;
};

type PipelineActionConfig = {
  force_fail?: boolean;
  group_by_field?: string;
  value_field?: string;
  target_field?: string;
  id_field?: string;
  fields?: string[];
  field?: string;
  value?: unknown;
};

type PipelineRow = {
  id: string;
  user_id: string;
  action_type: string;
  action_config: PipelineActionConfig | null;
};

type WebhookEventRow = {
  id: string;
  pipeline_id: string;
  payload: JsonObject;
};

function isJsonObject(value: unknown): value is JsonObject {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

async function sleep(ms: number) {
  await new Promise((resolve) => setTimeout(resolve, ms));
}

async function enqueueChainedJobs(sourceJob: JobRow, processedPayload: Record<string, unknown>) {
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

async function fetchNextJob(): Promise<JobRow | null> {
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

    const job = result.rows[0] as JobRow;

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

async function processJob(job: JobRow) {
  let pipeline: PipelineRow | null = null;

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

    const event = eventResult.rows[0] as WebhookEventRow | undefined;
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

    pipeline = (pipelineResult.rows[0] as PipelineRow | undefined) ?? null;
    if (!pipeline) {
      throw new Error(`Pipeline not found for job ${job.id}`);
    }

    const eventPayload: JsonObject = isJsonObject(event.payload) ? event.payload : {};
    let processedPayload: JsonObject | null = eventPayload;
    let shouldSkipJob = false;
    let skipReason: string | null = null;

    if (pipeline.action_config?.force_fail === true) {
      throw new Error("Forced processing failure for testing");
    }

    if (pipeline.action_type === "running_sum") {
      const groupField = pipeline.action_config?.group_by_field;
      const valueField = pipeline.action_config?.value_field;
      const targetField = pipeline.action_config?.target_field;

      if (!groupField || !valueField || !targetField) {
        throw new Error("Invalid running_sum configuration");
      }

      /* eslint-disable-next-line security/detect-object-injection */
      const groupKey = String(eventPayload[groupField]);
      /* eslint-disable-next-line security/detect-object-injection */
      const value = Number(eventPayload[valueField]);

      if (!groupKey || Number.isNaN(value)) {
        throw new Error("Invalid aggregation payload values");
      }

      const existing = await pool.query(
        `
        SELECT *
        FROM pipeline_aggregates
        WHERE pipeline_id = $1 AND group_key = $2
        `,
        [pipeline.id, groupKey]
      );

      let newTotal: number;

      if (existing.rows.length === 0) {
        newTotal = value;

        await pool.query(
          `
          INSERT INTO pipeline_aggregates (
            id,
            pipeline_id,
            group_key,
            aggregate_value
          )
          VALUES ($1,$2,$3,$4)
          `,
          [randomUUID(), pipeline.id, groupKey, newTotal]
        );
      } else {
        const current = Number(existing.rows[0].aggregate_value);
        newTotal = current + value;

        await pool.query(
          `
          UPDATE pipeline_aggregates
          SET aggregate_value = $3,
              updated_at = NOW()
          WHERE pipeline_id = $1 AND group_key = $2
          `,
          [pipeline.id, groupKey, newTotal]
        );
      }

      processedPayload = {
        ...eventPayload,
        [targetField]: newTotal,
      };
    }

    if (pipeline.action_type === "deduplicate") {
      const idField = pipeline.action_config?.id_field;

      if (idField) {
        /* eslint-disable-next-line security/detect-object-injection */
        const eventId = eventPayload[idField];

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
            console.log(`[${WORKER_NAME}] Duplicate event detected for ${eventId}`);

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
        if (field in eventPayload) {
          /* eslint-disable-next-line security/detect-object-injection */
          transformed[field] = eventPayload[field];
        }
      }

      processedPayload = transformed;
    }

    if (pipeline.action_type === "enrich") {
      processedPayload = {
        ...eventPayload,
        processed_at: new Date().toISOString(),
      };
    }

    if (pipeline.action_type === "filter") {
      const field = pipeline.action_config?.field;
      const value = pipeline.action_config?.value;

      if (field) {
        /* eslint-disable-next-line security/detect-object-injection */
        if (eventPayload[field] !== value) {
          processedPayload = null;
        }
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
      await enqueueChainedJobs(job, processedPayload);
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

    if (pipeline?.user_id) {
      await sendFailureNotification({
        user_id: pipeline.user_id,
        type: "job_failed",
        title: "Job Processing Failed",
        message: `Job ${job.id} failed during pipeline processing`,
        timestamp: new Date().toISOString(),
        details: {
          job_id: job.id,
          pipeline_id: job.pipeline_id,
          webhook_event_id: job.webhook_event_id,
          worker_name: WORKER_NAME,
          error: error instanceof Error ? error.message : "Unknown processing error",
        },
      });
    }

    console.error(`[${WORKER_NAME}] Job failed: ${job.id}`, error);
  }
}

async function workerLoop() {
  console.log(`[${WORKER_NAME}] Started. Poll interval: ${POLL_INTERVAL_MS}ms`);

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
