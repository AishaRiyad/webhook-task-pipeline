import { Router } from "express";
import {
  createPipelineHandler,
  createPipelineLinkHandler,
  deletePipelineHandler,
  deletePipelineLinkHandler,
  getAllPipelinesHandler,
  getPipelineByIdHandler,
  getPipelineLinksHandler,
} from "./pipeline.controller";

const router = Router();

/**
 * @swagger
 * /pipelines:
 *   post:
 *     summary: Create a new pipeline
 *     tags: [Pipelines]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/CreatePipelineInput'
 *     responses:
 *       201:
 *         description: Pipeline created successfully
 *       401:
 *         description: Unauthorized
 */
router.post("/", createPipelineHandler);
/**
 * @swagger
 * /pipelines:
 *   get:
 *     summary: Get all pipelines for the authenticated user
 *     tags: [Pipelines]
 *     responses:
 *       200:
 *         description: List of pipelines
 *       401:
 *         description: Unauthorized
 */
router.get("/", getAllPipelinesHandler);
/**
 * @swagger
 * /pipelines/{id}:
 *   get:
 *     summary: Get pipeline details by ID
 *     tags: [Pipelines]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Pipeline details
 *       404:
 *         description: Pipeline not found
 */
router.get("/:id", getPipelineByIdHandler);
/**
 * @swagger
 * /pipelines/{id}:
 *   delete:
 *     summary: Delete a pipeline
 *     tags: [Pipelines]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Pipeline deleted successfully
 *       404:
 *         description: Pipeline not found
 */
router.delete("/:id", deletePipelineHandler);
/**
 * @swagger
 * /pipelines/{id}/links:
 *   post:
 *     summary: Create a link from one pipeline to another
 *     tags: [Pipeline Chaining]
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
 *             $ref: '#/components/schemas/CreatePipelineLinkInput'
 *     responses:
 *       201:
 *         description: Pipeline link created successfully
 */
router.post("/:id/links", createPipelineLinkHandler);
/**
 * @swagger
 * /pipelines/{id}/links:
 *   get:
 *     summary: Get links for a pipeline
 *     tags: [Pipeline Chaining]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Pipeline links fetched successfully
 */
router.get("/:id/links", getPipelineLinksHandler);
/**
 * @swagger
 * /pipelines/{id}/links/{targetPipelineId}:
 *   delete:
 *     summary: Delete a pipeline link
 *     tags: [Pipeline Chaining]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *       - in: path
 *         name: targetPipelineId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Pipeline link deleted successfully
 */
router.delete("/:id/links/:targetPipelineId", deletePipelineLinkHandler);

export default router;
