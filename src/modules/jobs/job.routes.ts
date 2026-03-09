import { Router } from "express";
import {
  getAllJobsHandler,
  getJobByIdHandler,
  getJobDeliveriesHandler,
} from "./job.controller";

const router = Router();

router.get("/", getAllJobsHandler);
router.get("/:id", getJobByIdHandler);
router.get("/:id/deliveries", getJobDeliveriesHandler);

export default router;