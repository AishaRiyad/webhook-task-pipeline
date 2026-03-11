import { z } from "zod";

export const createPipelineSchema = z.object({
  name: z.string().min(1, "Name is required"),
  action_type: z.enum(["transform", "filter", "enrich", "deduplicate", "aggregate", "running_sum"]),
  action_config: z.record(z.string(), z.any()).optional(),
  subscribers: z
    .array(
      z.object({
        target_url: z.string().url("Subscriber URL must be valid"),
      })
    )
    .optional(),
});

export const createPipelineLinkSchema = z.object({
  target_pipeline_id: z.string().uuid("Target pipeline id must be a valid UUID"),
});

export type CreatePipelineInput = z.infer<typeof createPipelineSchema>;
export type CreatePipelineLinkInput = z.infer<typeof createPipelineLinkSchema>;
