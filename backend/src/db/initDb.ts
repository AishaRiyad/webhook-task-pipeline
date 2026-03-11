import fs from "fs";
import path from "path";
import { pool } from "./database";

export async function initDb() {
  const filePath = path.join(__dirname, "sql", "init.sql");
  const sql = fs.readFileSync(filePath, "utf-8");

  await pool.query(sql);

  console.log("Database tables initialized successfully.");
}
