import { initDb } from "./initDb";

async function run() {
  try {
    await initDb();
    process.exit(0);
  } catch (error) {
    console.error("Database initialization failed:", error);
    process.exit(1);
  }
}

run();