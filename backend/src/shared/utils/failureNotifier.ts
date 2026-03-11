import axios from "axios";
import { createSystemNotification } from "../../modules/notifications/notification.service";

const FAILURE_NOTIFICATION_URL = process.env.FAILURE_NOTIFICATION_URL;

type NotificationPayload = {
  user_id: string;
  type: "job_failed" | "delivery_failed";
  title: string;
  message: string;
  timestamp: string;
  details: Record<string, unknown>;
};

export async function sendFailureNotification(
  payload: NotificationPayload
) {
  try {
    await createSystemNotification({
      user_id: payload.user_id,
      type: payload.type,
      title: payload.title,
      message: payload.message,
      payload: {
        timestamp: payload.timestamp,
        ...payload.details,
      },
    });
  } catch (error) {
    console.error(
      "[failure-notifier] Failed to save notification:",
      error instanceof Error ? error.message : "Unknown error"
    );
  }

  if (!FAILURE_NOTIFICATION_URL) {
    return;
  }

  try {
    await axios.post(
      FAILURE_NOTIFICATION_URL,
      {
        type: payload.type,
        title: payload.title,
        message: payload.message,
        timestamp: payload.timestamp,
        details: payload.details,
      },
      {
        timeout: 5000,
        headers: {
          "Content-Type": "application/json",
        },
      }
    );
  } catch (error) {
    console.error(
      "[failure-notifier] Failed to send notification webhook:",
      error instanceof Error ? error.message : "Unknown error"
    );
  }
}