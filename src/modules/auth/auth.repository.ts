import { pool } from "../../db/database";

export async function findUserByEmail(email: string) {
  const query = `
    SELECT *
    FROM users
    WHERE email = $1
    LIMIT 1;
  `;
  const result = await pool.query(query, [email]);
  return result.rows[0] || null;
}

export async function findUserById(id: string) {
  const query = `
    SELECT id, email, created_at, updated_at
    FROM users
    WHERE id = $1
    LIMIT 1;
  `;
  const result = await pool.query(query, [id]);
  return result.rows[0] || null;
}

export async function createUser(data: {
  id: string;
  email: string;
  password_hash: string;
}) {
  const query = `
    INSERT INTO users (id, email, password_hash)
    VALUES ($1, $2, $3)
    RETURNING id, email, created_at, updated_at;
  `;
  const values = [data.id, data.email, data.password_hash];
  const result = await pool.query(query, values);
  return result.rows[0];
}

export async function createRefreshToken(data: {
  id: string;
  user_id: string;
  token_hash: string;
  expires_at: Date;
}) {
  const query = `
    INSERT INTO refresh_tokens (id, user_id, token_hash, expires_at)
    VALUES ($1, $2, $3, $4)
    RETURNING *;
  `;
  const values = [data.id, data.user_id, data.token_hash, data.expires_at];
  const result = await pool.query(query, values);
  return result.rows[0];
}

export async function findRefreshToken(tokenHash: string) {
  const query = `
    SELECT *
    FROM refresh_tokens
    WHERE token_hash = $1
    LIMIT 1;
  `;
  const result = await pool.query(query, [tokenHash]);
  return result.rows[0] || null;
}

export async function deleteRefreshToken(tokenHash: string) {
  const query = `
    DELETE FROM refresh_tokens
    WHERE token_hash = $1
    RETURNING *;
  `;
  const result = await pool.query(query, [tokenHash]);
  return result.rows[0] || null;
}

export async function deleteExpiredRefreshTokens() {
  const query = `
    DELETE FROM refresh_tokens
    WHERE expires_at < NOW();
  `;
  await pool.query(query);
}