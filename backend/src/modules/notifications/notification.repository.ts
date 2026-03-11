import { pool } from "../../db/database";

export async function createNotificationRecord(data: {
  id: string;
  user_id: string;
  type: string;
  title: string;
  message: string;
  payload: Record<string, unknown>;
}) {
  const query = `
    INSERT INTO system_notifications (
      id,
      user_id,
      type,
      title,
      message,
      payload
    )
    VALUES ($1, $2, $3, $4, $5, $6)
    RETURNING *;
  `;

  const values = [
    data.id,
    data.user_id,
    data.type,
    data.title,
    data.message,
    JSON.stringify(data.payload ?? {}),
  ];

  const result = await pool.query(query, values);
  return result.rows[0];
}

export async function findNotificationsByUserId(userId: string) {
  const query = `
    SELECT *
    FROM system_notifications
    WHERE user_id = $1
    ORDER BY created_at DESC;
  `;

  const result = await pool.query(query, [userId]);
  return result.rows;
}

export async function markNotificationAsRead(notificationId: string, userId: string) {
  const query = `
    UPDATE system_notifications
    SET is_read = TRUE
    WHERE id = $1 AND user_id = $2
    RETURNING *;
  `;

  const result = await pool.query(query, [notificationId, userId]);
  return result.rows[0] || null;
}

export async function countUnreadNotifications(userId: string) {
  const query = `
    SELECT COUNT(*)
    FROM system_notifications
    WHERE user_id = $1 AND is_read = FALSE
  `;

  const result = await pool.query(query, [userId]);
  return Number(result.rows[0].count);
}
