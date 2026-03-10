import { Router } from "express";
import {
  createSubscriberHandler,
  deleteSubscriberHandler,
  getSubscribersHandler,
} from "./subscriber.controller";

const router = Router({ mergeParams: true });

router.post("/", createSubscriberHandler);
router.get("/", getSubscribersHandler);
router.delete("/:subscriberId", deleteSubscriberHandler);

export default router;