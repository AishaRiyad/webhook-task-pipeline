import { Response } from "express";
import { AuthenticatedRequest } from "../../shared/middleware/authMiddleware";
import {
  getUserNotifications,
  readNotification,
} from "./notification.service";
import { getUnreadNotificationsCount } from "./notification.service";

type NotificationParams = {
  id: string;
};

export async function getNotificationsHandler(
  req: AuthenticatedRequest,
  res: Response
) {
  try {
    if (!req.user) {
      return res.status(401).json({
        message: "Unauthorized",
      });
    }

    const notifications = await getUserNotifications(req.user.userId);

    return res.status(200).json({
      data: notifications,
    });
  } catch (error) {
    return res.status(500).json({
      message: "Failed to fetch notifications",
      error: error instanceof Error ? error.message : "Unknown error",
    });
  }
}

export async function markNotificationAsReadHandler(
  req: AuthenticatedRequest & { params: NotificationParams },
  res: Response
) {
  try {
    if (!req.user) {
      return res.status(401).json({
        message: "Unauthorized",
      });
    }

    const notification = await readNotification(
      req.params.id,
      req.user.userId
    );

    if (!notification) {
      return res.status(404).json({
        message: "Notification not found",
      });
    }

    return res.status(200).json({
      message: "Notification marked as read",
      data: notification,
    });
  } catch (error) {
    return res.status(500).json({
      message: "Failed to update notification",
      error: error instanceof Error ? error.message : "Unknown error",
    });
  }
}

export async function getUnreadNotificationsCountHandler(
  req: AuthenticatedRequest,
  res: Response
) {
  try {
    if (!req.user) {
      return res.status(401).json({
        message: "Unauthorized",
      });
    }

    const count = await getUnreadNotificationsCount(req.user.userId);

    return res.status(200).json({
      unread_count: count,
    });
  } catch (error) {
    return res.status(500).json({
      message: "Failed to fetch unread notifications count",
      error: error instanceof Error ? error.message : "Unknown error",
    });
  }
}