import { Response } from "express";
import { getAllJobs, getJobDeliveries, getJobDetails } from "./job.service";
import { AuthenticatedRequest } from "../../shared/middleware/authMiddleware";

type JobParams = {
  id: string;
};

export async function getAllJobsHandler(
  req: AuthenticatedRequest,
  res: Response
) {
  try {
    if (!req.user) {
      return res.status(401).json({
        message: "Unauthorized",
      });
    }

    const jobs = await getAllJobs(req.user.userId);

    return res.status(200).json({
      data: jobs,
    });
  } catch (error) {
    return res.status(500).json({
      message: "Failed to fetch jobs",
      error: error instanceof Error ? error.message : "Unknown error",
    });
  }
}

export async function getJobByIdHandler(
  req: AuthenticatedRequest & { params: JobParams },
  res: Response
) {
  try {
    if (!req.user) {
      return res.status(401).json({
        message: "Unauthorized",
      });
    }

    const result = await getJobDetails(req.params.id, req.user.userId);

    if (!result) {
      return res.status(404).json({
        message: "Job not found",
      });
    }

    return res.status(200).json({
      data: result,
    });
  } catch (error) {
    return res.status(500).json({
      message: "Failed to fetch job details",
      error: error instanceof Error ? error.message : "Unknown error",
    });
  }
}

export async function getJobDeliveriesHandler(
  req: AuthenticatedRequest & { params: JobParams },
  res: Response
) {
  try {
    if (!req.user) {
      return res.status(401).json({
        message: "Unauthorized",
      });
    }

    const result = await getJobDeliveries(req.params.id, req.user.userId);

    if (!result) {
      return res.status(404).json({
        message: "Job not found",
      });
    }

    return res.status(200).json({
      data: result,
    });
  } catch (error) {
    return res.status(500).json({
      message: "Failed to fetch job deliveries",
      error: error instanceof Error ? error.message : "Unknown error",
    });
  }
}