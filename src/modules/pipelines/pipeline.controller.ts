import { Response } from "express";
import { ZodError } from "zod";
import {
  createPipeline,
  createPipelineLink,
  getAllPipelines,
  getPipelineById,
  getPipelineLinks,
  removePipelineById,
  removePipelineLink,
} from "./pipeline.service";
import {
  createPipelineLinkSchema,
  createPipelineSchema,
} from "./pipeline.types";
import { AuthenticatedRequest } from "../../shared/middleware/authMiddleware";

type PipelineParams = {
  id: string;
};

type PipelineLinkParams = {
  id: string;
  targetPipelineId: string;
};

export async function createPipelineHandler(
  req: AuthenticatedRequest,
  res: Response
) {
  try {
    if (!req.user) {
      return res.status(401).json({
        message: "Unauthorized",
      });
    }

    const validatedData = createPipelineSchema.parse(req.body);
    const pipeline = await createPipeline(validatedData, req.user.userId);

    return res.status(201).json({
      message: "Pipeline created successfully",
      data: pipeline,
    });
  } catch (error) {
    if (error instanceof ZodError) {
      return res.status(400).json({
        message: "Validation error",
        errors: error.flatten(),
      });
    }

    return res.status(500).json({
      message: "Failed to create pipeline",
      error: error instanceof Error ? error.message : "Unknown error",
    });
  }
}

export async function getAllPipelinesHandler(
  req: AuthenticatedRequest,
  res: Response
) {
  try {
    if (!req.user) {
      return res.status(401).json({
        message: "Unauthorized",
      });
    }

    const pipelines = await getAllPipelines(req.user.userId);

    return res.status(200).json({
      data: pipelines,
    });
  } catch (error) {
    return res.status(500).json({
      message: "Failed to fetch pipelines",
      error: error instanceof Error ? error.message : "Unknown error",
    });
  }
}

export async function getPipelineByIdHandler(
  req: AuthenticatedRequest & { params: PipelineParams },
  res: Response
) {
  try {
    if (!req.user) {
      return res.status(401).json({
        message: "Unauthorized",
      });
    }

    const pipeline = await getPipelineById(req.params.id, req.user.userId);

    if (!pipeline) {
      return res.status(404).json({
        message: "Pipeline not found",
      });
    }

    return res.status(200).json({
      data: pipeline,
    });
  } catch (error) {
    return res.status(500).json({
      message: "Failed to fetch pipeline",
      error: error instanceof Error ? error.message : "Unknown error",
    });
  }
}

export async function deletePipelineHandler(
  req: AuthenticatedRequest & { params: PipelineParams },
  res: Response
) {
  try {
    if (!req.user) {
      return res.status(401).json({
        message: "Unauthorized",
      });
    }

    const deleted = await removePipelineById(req.params.id, req.user.userId);

    if (!deleted) {
      return res.status(404).json({
        message: "Pipeline not found",
      });
    }

    return res.status(200).json({
      message: "Pipeline deleted successfully",
      data: deleted,
    });
  } catch (error) {
    return res.status(500).json({
      message: "Failed to delete pipeline",
      error: error instanceof Error ? error.message : "Unknown error",
    });
  }
}


export async function createPipelineLinkHandler(
  req: AuthenticatedRequest & { params: PipelineParams },
  res: Response
) {
  try {
    if (!req.user) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    const validatedData = createPipelineLinkSchema.parse(req.body);

    const link = await createPipelineLink(
      req.params.id,
      validatedData.target_pipeline_id,
      req.user.userId
    );

    if (!link) {
      return res.status(404).json({
        message: "Source pipeline not found",
      });
    }

    return res.status(201).json({
      message: "Pipeline link created successfully",
      data: link,
    });
  } catch (error) {
    if (error instanceof ZodError) {
      return res.status(400).json({
        message: "Validation error",
        errors: error.flatten(),
      });
    }

    return res.status(400).json({
      message: "Failed to create pipeline link",
      error: error instanceof Error ? error.message : "Unknown error",
    });
  }
}

export async function getPipelineLinksHandler(
  req: AuthenticatedRequest & { params: PipelineParams },
  res: Response
) {
  try {
    if (!req.user) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    const links = await getPipelineLinks(req.params.id, req.user.userId);

    if (!links) {
      return res.status(404).json({
        message: "Pipeline not found",
      });
    }

    return res.status(200).json({
      data: links,
    });
  } catch (error) {
    return res.status(500).json({
      message: "Failed to fetch pipeline links",
      error: error instanceof Error ? error.message : "Unknown error",
    });
  }
}

export async function deletePipelineLinkHandler(
  req: AuthenticatedRequest & { params: PipelineLinkParams },
  res: Response
) {
  try {
    if (!req.user) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    const deleted = await removePipelineLink(
      req.params.id,
      req.params.targetPipelineId,
      req.user.userId
    );

    if (!deleted) {
      return res.status(404).json({
        message: "Pipeline link not found",
      });
    }

    return res.status(200).json({
      message: "Pipeline link deleted successfully",
      data: deleted,
    });
  } catch (error) {
    return res.status(500).json({
      message: "Failed to delete pipeline link",
      error: error instanceof Error ? error.message : "Unknown error",
    });
  }
}