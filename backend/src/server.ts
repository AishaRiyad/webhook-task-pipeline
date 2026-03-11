import dotenv from "dotenv";
import app from "./app";
import { initDb } from "./db/initDb";

dotenv.config();

const PORT = process.env.PORT || 3000;

async function startServer() {
  try {
    await initDb();

    app.listen(PORT, () => {
      console.log(`Server running on port ${PORT}`);
    });
  } catch (error) {
    console.error("Failed to start server:", error);
    process.exit(1);
  }
}

startServer();
