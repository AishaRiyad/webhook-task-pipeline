import { Router } from "express";
import {
  getAllJobsHandler,
  getJobByIdHandler,
  getJobDeliveriesHandler,
} from "./job.controller";

const router = Router();

/**
 * @swagger
 * /jobs:
 *   get:
 *     summary: Get all jobs for the authenticated user
 *     tags: [Jobs]
 *     responses:
 *       200:
 *         description: List of jobs
 */
router.get("/", getAllJobsHandler);
/**
 * @swagger
 * /jobs/{id}:
 *   get:
 *     summary: Get detailed information for a job
 *     tags: [Jobs]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Job details including deliveries and attempts
 *       404:
 *         description: Job not found
 */
router.get("/:id", getJobByIdHandler);
router.get("/:id/deliveries", getJobDeliveriesHandler);

export default router;