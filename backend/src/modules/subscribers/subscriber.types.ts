import { z } from "zod";

export const createSubscriberSchema = z.object({
  target_url: z.string().url("Subscriber URL must be valid"),
});

export type CreateSubscriberInput = z.infer<typeof createSubscriberSchema>;