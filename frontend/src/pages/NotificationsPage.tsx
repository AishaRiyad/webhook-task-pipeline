import { useEffect, useState } from "react";
import Layout from "../components/Layout";
import { getNotifications, markNotificationAsRead } from "../api/client";
import type { SystemNotification } from "../types";

export default function NotificationsPage() {
  const [notifications, setNotifications] = useState<SystemNotification[]>([]);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState("");

  async function loadNotifications() {
    try {
      const response = await getNotifications();
      setNotifications(response.data || []);
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Failed to load notifications");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadNotifications();
  }, []);

  async function handleMarkAsRead(notificationId: string) {
    try {
      await markNotificationAsRead(notificationId);
      await loadNotifications();
      window.location.reload();
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Failed to mark notification as read");
    }
  }

  return (
    <Layout>
      <div className="page-header">
        <h1>Notifications</h1>
        <p>Track system alerts for failed jobs and failed deliveries.</p>
      </div>

      {loading ? (
        <div className="loading-box">Loading notifications...</div>
      ) : message ? (
        <div className="info-box">{message}</div>
      ) : notifications.length === 0 ? (
        <div className="loading-box">No notifications yet.</div>
      ) : (
        <div className="cards-grid single-column">
          {notifications.map((notification) => (
            <div
              key={notification.id}
              className={`cute-card ${notification.is_read ? "" : "notification-unread"}`}
            >
              <div className="row-between">
                <div>
                  <h3>{notification.title}</h3>
                  <p className="muted">{notification.message}</p>
                </div>
                <span
                  className={`badge ${
                    notification.type === "job_failed" ? "badge-red" : "badge-yellow"
                  }`}
                >
                  {notification.type}
                </span>
              </div>

              <p className="muted">Created: {new Date(notification.created_at).toLocaleString()}</p>

              <div className="json-box">
                <strong>Payload</strong>
                <pre>{JSON.stringify(notification.payload, null, 2)}</pre>
              </div>

              {!notification.is_read && (
                <div className="card-actions">
                  <button
                    className="secondary-btn"
                    onClick={() => handleMarkAsRead(notification.id)}
                  >
                    Mark as Read
                  </button>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </Layout>
  );
}
