import { Router } from "express";
import { ingestWebhookHandler } from "./webhook.controller";
import { webhookRateLimit } from "../../shared/middleware/webhookRateLimit";

const router = Router();

/**
 * @swagger
 * /webhooks/{sourceKey}:
 *   post:
 *     summary: Ingest a signed webhook for a pipeline
 *     tags: [Webhooks]
 *     security: []
 *     parameters:
 *       - in: path
 *         name: sourceKey
 *         required: true
 *         schema:
 *           type: string
 *       - in: header
 *         name: x-webhook-timestamp
 *         required: true
 *         schema:
 *           type: string
 *       - in: header
 *         name: x-webhook-signature
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             example:
 *               orderId: ORD-1002
 *               status: created
 *               amount: 200
 *               customer: Aisha
 *     responses:
 *       202:
 *         description: Webhook accepted and queued
 *       401:
 *         description: Invalid signature
 *       404:
 *         description: Pipeline not found
 */
router.post("/:sourceKey", webhookRateLimit, ingestWebhookHandler);

export default router;
