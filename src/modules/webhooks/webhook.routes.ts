import { Router } from "express";
import { ingestWebhookHandler } from "./webhook.controller";
import { webhookRateLimit } from "../../shared/middleware/webhookRateLimit";

const router = Router();

router.post("/:sourceKey", webhookRateLimit, ingestWebhookHandler);

export default router;