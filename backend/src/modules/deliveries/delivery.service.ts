import axios from "axios";
import { randomUUID } from "crypto";
import { pool } from "../../db/database";
import {
  createDeliveryAttemptLog,
  createDeliveryRecord,
  findJobById,
  findPendingDeliveries,
  findSubscribersByPipelineId,
  updateDeliveryFailure,
  updateDeliverySuccess,
} from "./delivery.repository";
import { sendFailureNotification } from "../../shared/utils/failureNotifier";

function calculateNextRetry(attemptNumber: number): Date {
  const delayInSeconds = Math.min(2 ** attemptNumber * 5, 300);
  return new Date(Date.now() + delayInSeconds * 1000);
}

export async function createDeliveriesForJob(jobId: string, pipelineId: string) {
  const subscribers = await findSubscribersByPipelineId(pipelineId);

  const deliveries = [];

  for (const subscriber of subscribers) {
    const delivery = await createDeliveryRecord({
      id: randomUUID(),
      job_id: jobId,
      subscriber_id: subscriber.id,
      status: "pending",
    });

    deliveries.push(delivery);
  }

  return deliveries;
}

export async function processPendingDeliveries() {
  const deliveries = await findPendingDeliveries();

  for (const delivery of deliveries) {
    const attemptNumber = delivery.attempts + 1;
    const job = await findJobById(delivery.job_id);

    if (!job || !job.result_payload) {
      continue;
    }

    const pipelineOwnerResult = await pool.query(
      `
      SELECT p.user_id
      FROM pipelines p
      JOIN jobs j ON j.pipeline_id = p.id
      WHERE j.id = $1
      LIMIT 1
      `,
      [job.id]
    );

    const userId = pipelineOwnerResult.rows[0]?.user_id;

    try {
      const response = await axios.post(delivery.target_url, job.result_payload, {
        timeout: 5000,
        headers: {
          "Content-Type": "application/json",
          "X-Job-Id": job.id,
        },
        validateStatus: () => true,
      });

      await createDeliveryAttemptLog({
        id: randomUUID(),
        delivery_id: delivery.id,
        attempt_number: attemptNumber,
        request_payload: job.result_payload,
        response_status: response.status,
        response_body:
          typeof response.data === "string" ? response.data : JSON.stringify(response.data),
        error_message: null,
      });

      if (response.status >= 200 && response.status < 300) {
        await updateDeliverySuccess({
          delivery_id: delivery.id,
          attempt_number: attemptNumber,
          response_status: response.status,
        });
      } else {
        const isFinalFailure = attemptNumber >= delivery.max_attempts;

        await updateDeliveryFailure({
          delivery_id: delivery.id,
          attempt_number: attemptNumber,
          response_status: response.status,
          error_message: `Subscriber responded with status ${response.status}`,
          next_retry_at: isFinalFailure ? null : calculateNextRetry(attemptNumber),
          status: isFinalFailure ? "failed" : "retry_pending",
        });

        if (isFinalFailure && userId) {
          await sendFailureNotification({
            user_id: userId,
            type: "delivery_failed",
            title: "Delivery Failed",
            message: `Delivery for job ${job.id} failed after maximum retries`,
            timestamp: new Date().toISOString(),
            details: {
              job_id: job.id,
              delivery_id: delivery.id,
              subscriber_id: delivery.subscriber_id,
              target_url: delivery.target_url,
              attempts: attemptNumber,
              max_attempts: delivery.max_attempts,
              response_status: response.status,
              error: `Subscriber responded with status ${response.status}`,
            },
          });
        }
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : "Unknown delivery error";

      await createDeliveryAttemptLog({
        id: randomUUID(),
        delivery_id: delivery.id,
        attempt_number: attemptNumber,
        request_payload: job.result_payload,
        response_status: null,
        response_body: null,
        error_message: message,
      });

      const isFinalFailure = attemptNumber >= delivery.max_attempts;

      await updateDeliveryFailure({
        delivery_id: delivery.id,
        attempt_number: attemptNumber,
        response_status: null,
        error_message: message,
        next_retry_at: isFinalFailure ? null : calculateNextRetry(attemptNumber),
        status: isFinalFailure ? "failed" : "retry_pending",
      });

      if (isFinalFailure && userId) {
        await sendFailureNotification({
          user_id: userId,
          type: "delivery_failed",
          title: "Delivery Failed",
          message: `Delivery for job ${job.id} failed after maximum retries`,
          timestamp: new Date().toISOString(),
          details: {
            job_id: job.id,
            delivery_id: delivery.id,
            subscriber_id: delivery.subscriber_id,
            target_url: delivery.target_url,
            attempts: attemptNumber,
            max_attempts: delivery.max_attempts,
            error: message,
          },
        });
      }
    }
  }
}
