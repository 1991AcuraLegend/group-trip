import { z } from "zod";

export const createTripSchema = z.object({
  name: z.string().min(1, "Trip name is required").max(100),
  description: z.string().max(500).optional(),
  startDate: z.string().optional(),
  endDate: z.string().optional(),
  coverImage: z.string().optional(),
});

export const updateTripSchema = createTripSchema.partial();

export type CreateTripInput = z.infer<typeof createTripSchema>;
export type UpdateTripInput = z.infer<typeof updateTripSchema>;
