import { Response } from "express";
import { ZodError } from "zod";
import { createSubscriberSchema } from "./subscriber.types";
import {
  addSubscriberToPipeline,
  listPipelineSubscribers,
  removeSubscriberFromPipeline,
} from "./subscriber.service";
import { AuthenticatedRequest } from "../../shared/middleware/authMiddleware";

type PipelineParams = {
  id: string;
};

type SubscriberParams = {
  id: string;
  subscriberId: string;
};

export async function createSubscriberHandler(
  req: AuthenticatedRequest & { params: PipelineParams },
  res: Response
) {
  try {
    if (!req.user) {
      return res.status(401).json({
        message: "Unauthorized",
      });
    }

    const pipelineId = req.params.id;
    const validated = createSubscriberSchema.parse(req.body);

    const subscriber = await addSubscriberToPipeline(
      pipelineId,
      validated.target_url,
      req.user.userId
    );

    if (!subscriber) {
      return res.status(404).json({
        message: "Pipeline not found",
      });
    }

    return res.status(201).json({
      message: "Subscriber added successfully",
      data: subscriber,
    });
  } catch (error) {
    if (error instanceof ZodError) {
      return res.status(400).json({
        message: "Validation error",
        errors: error.flatten(),
      });
    }

    return res.status(500).json({
      message: "Failed to add subscriber",
      error: error instanceof Error ? error.message : "Unknown error",
    });
  }
}

export async function getSubscribersHandler(
  req: AuthenticatedRequest & { params: PipelineParams },
  res: Response
) {
  try {
    if (!req.user) {
      return res.status(401).json({
        message: "Unauthorized",
      });
    }

    const subscribers = await listPipelineSubscribers(req.params.id, req.user.userId);

    if (!subscribers) {
      return res.status(404).json({
        message: "Pipeline not found",
      });
    }

    return res.status(200).json({
      data: subscribers,
    });
  } catch (error) {
    return res.status(500).json({
      message: "Failed to fetch subscribers",
      error: error instanceof Error ? error.message : "Unknown error",
    });
  }
}

export async function deleteSubscriberHandler(
  req: AuthenticatedRequest & { params: SubscriberParams },
  res: Response
) {
  try {
    if (!req.user) {
      return res.status(401).json({
        message: "Unauthorized",
      });
    }

    const deleted = await removeSubscriberFromPipeline(
      req.params.id,
      req.params.subscriberId,
      req.user.userId
    );

    if (!deleted) {
      return res.status(404).json({
        message: "Subscriber not found or pipeline not found",
      });
    }

    return res.status(200).json({
      message: "Subscriber deleted successfully",
      data: deleted,
    });
  } catch (error) {
    return res.status(500).json({
      message: "Failed to delete subscriber",
      error: error instanceof Error ? error.message : "Unknown error",
    });
  }
}
