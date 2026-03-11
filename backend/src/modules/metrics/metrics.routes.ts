import { Router, Response } from "express";
import { pool } from "../../db/database";
import { AuthenticatedRequest } from "../../shared/middleware/authMiddleware";

const router = Router();

/**
 * @swagger
 * /metrics:
 *   get:
 *     summary: Get metrics for the authenticated user
 *     tags: [Metrics]
 *     responses:
 *       200:
 *         description: Metrics fetched successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/MetricsResponse'
 */
router.get("/", async (req: AuthenticatedRequest, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({
        message: "Unauthorized",
      });
    }

    const userId = req.user.userId;

    const jobsProcessed = await pool.query(
      `
      SELECT COUNT(*) 
      FROM jobs j
      JOIN pipelines p ON p.id = j.pipeline_id
      WHERE p.user_id = $1 AND j.status = 'completed'
      `,
      [userId]
    );

    const jobsFailed = await pool.query(
      `
      SELECT COUNT(*) 
      FROM jobs j
      JOIN pipelines p ON p.id = j.pipeline_id
      WHERE p.user_id = $1 AND j.status = 'failed'
      `,
      [userId]
    );

    const deliveriesSent = await pool.query(
      `
      SELECT COUNT(*)
      FROM job_deliveries jd
      JOIN jobs j ON j.id = jd.job_id
      JOIN pipelines p ON p.id = j.pipeline_id
      WHERE p.user_id = $1 AND jd.status = 'delivered'
      `,
      [userId]
    );

    const deliveriesFailed = await pool.query(
      `
      SELECT COUNT(*)
      FROM job_deliveries jd
      JOIN jobs j ON j.id = jd.job_id
      JOIN pipelines p ON p.id = j.pipeline_id
      WHERE p.user_id = $1 AND jd.status = 'failed'
      `,
      [userId]
    );

    const retries = await pool.query(
      `
      SELECT COUNT(*)
      FROM job_deliveries jd
      JOIN jobs j ON j.id = jd.job_id
      JOIN pipelines p ON p.id = j.pipeline_id
      WHERE p.user_id = $1 AND jd.status = 'retry_pending'
      `,
      [userId]
    );

    const pipelines = await pool.query(
      `
      SELECT COUNT(*)
      FROM pipelines
      WHERE user_id = $1
      `,
      [userId]
    );

    return res.status(200).json({
      metrics: {
        pipelines: Number(pipelines.rows[0].count),
        jobs_processed: Number(jobsProcessed.rows[0].count),
        jobs_failed: Number(jobsFailed.rows[0].count),
        deliveries_sent: Number(deliveriesSent.rows[0].count),
        deliveries_failed: Number(deliveriesFailed.rows[0].count),
        pending_retries: Number(retries.rows[0].count),
      },
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    return res.status(500).json({
      message: "Failed to fetch metrics",
      error: error instanceof Error ? error.message : "Unknown error",
    });
  }
});

export default router;
