import { Router } from "express";
import {
  createSubscriberHandler,
  deleteSubscriberHandler,
  getSubscribersHandler,
} from "./subscriber.controller";

const router = Router({ mergeParams: true });

/**
 * @swagger
 * /pipelines/{id}/subscribers:
 *   post:
 *     summary: Add a subscriber to a pipeline
 *     tags: [Subscribers]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/CreateSubscriberInput'
 *     responses:
 *       201:
 *         description: Subscriber added successfully
 */
router.post("/", createSubscriberHandler);
/**
 * @swagger
 * /pipelines/{id}/subscribers:
 *   get:
 *     summary: Get all subscribers for a pipeline
 *     tags: [Subscribers]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: List of subscribers
 */
router.get("/", getSubscribersHandler);
/**
 * @swagger
 * /pipelines/{id}/subscribers/{subscriberId}:
 *   delete:
 *     summary: Delete a subscriber from a pipeline
 *     tags: [Subscribers]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *       - in: path
 *         name: subscriberId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Subscriber deleted successfully
 */
router.delete("/:subscriberId", deleteSubscriberHandler);

export default router;