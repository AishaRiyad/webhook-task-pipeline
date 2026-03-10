import express from "express";
import { pool } from "./db/database";
import pipelineRoutes from "./modules/pipelines/pipeline.routes";
import webhookRoutes from "./modules/webhooks/webhook.routes";
import subscriberRoutes from "./modules/subscribers/subscriber.routes";
import jobRoutes from "./modules/jobs/job.routes";
import metricsRoutes from "./modules/metrics/metrics.routes";
import authRoutes from "./modules/auth/auth.routes";
import { authenticate } from "./shared/middleware/authMiddleware";
import cors from "cors";
import swaggerUi from "swagger-ui-express";
import { swaggerSpec } from "./config/swagger";


const app = express();

app.use(
  cors({
    origin: "http://localhost:5173",
    credentials: true,
  })
);

app.use(
  express.json({
    verify: (req: any, _res, buf) => {
      req.rawBody = buf.toString("utf8");
    },
  })
);

app.get("/health", async (_req, res) => {
  try {
    const result = await pool.query("SELECT NOW()");
    res.status(200).json({
      message: "Server is running",
      database: "connected",
      time: result.rows[0].now,
    });
  } catch (error) {
    res.status(500).json({
      message: "Server is running",
      database: "disconnected",
      error: error instanceof Error ? error.message : "Unknown error",
    });
  }
});

app.use("/api-docs", swaggerUi.serve, swaggerUi.setup(swaggerSpec));

app.post("/subscriber-order-service", (req, res) => {
  console.log("📦 ORDER SERVICE RECEIVED EVENT");
  console.log(JSON.stringify(req.body, null, 2));
  res.status(200).send("Order Service OK");
});

app.post("/subscriber-analytics-service", (req, res) => {
  console.log("📊 ANALYTICS SERVICE RECEIVED EVENT");
  console.log(JSON.stringify(req.body, null, 2));
  res.status(200).send("Analytics Service OK");
});

app.post("/subscriber-notification-service", (req, res) => {
  console.log("🔔 NOTIFICATION SERVICE RECEIVED EVENT");
  console.log(JSON.stringify(req.body, null, 2));
  res.status(200).send("Notification Service OK");
});

app.use("/auth", authRoutes);
app.use("/pipelines", authenticate, pipelineRoutes);
app.use("/webhooks", webhookRoutes);
app.use("/pipelines/:id/subscribers", authenticate, subscriberRoutes);
app.use("/jobs", authenticate, jobRoutes);
app.use("/metrics", authenticate, metricsRoutes);

export default app;