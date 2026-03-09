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

router.post("/", createPipelineHandler);
router.get("/", getAllPipelinesHandler);
router.get("/:id", getPipelineByIdHandler);
router.delete("/:id", deletePipelineHandler);

router.post("/:id/links", createPipelineLinkHandler);
router.get("/:id/links", getPipelineLinksHandler);
router.delete("/:id/links/:targetPipelineId", deletePipelineLinkHandler);

export default router;