import { randomUUID } from "crypto";
import {
  createNotificationRecord,
  findNotificationsByUserId,
  markNotificationAsRead,
} from "./notification.repository";
import { countUnreadNotifications } from "./notification.repository";

export async function createSystemNotification(data: {
  user_id: string;
  type: string;
  title: string;
  message: string;
  payload: Record<string, unknown>;
}) {
  return createNotificationRecord({
    id: randomUUID(),
    user_id: data.user_id,
    type: data.type,
    title: data.title,
    message: data.message,
    payload: data.payload,
  });
}

export async function getUserNotifications(userId: string) {
  return findNotificationsByUserId(userId);
}

export async function readNotification(notificationId: string, userId: string) {
  return markNotificationAsRead(notificationId, userId);
}

export async function getUnreadNotificationsCount(userId: string) {
  return countUnreadNotifications(userId);
}