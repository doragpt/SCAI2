import { z } from "zod";

export const storeSchema = z.object({
  id: z.number(),
  name: z.string(),
  location: z.string(),
  rating: z.number(),
  matches: z.array(z.string()),
  checked: z.boolean().optional(),
  status: z.enum(['pending', 'accepted', 'rejected']).optional(),
  responseTime: z.string().optional(),
  description: z.string().optional(),
  features: z.array(z.string()).optional(),
  requirements: z.array(z.string()).optional(),
  workTypes: z.array(z.string()).optional(),
  hourlyRate: z.number().optional(),
  guaranteeAmount: z.number().optional(),
});

export type Store = z.infer<typeof storeSchema>;

export const storeListResponseSchema = z.object({
  stores: z.array(storeSchema),
  total: z.number(),
  hasMore: z.boolean(),
});

export type StoreListResponse = z.infer<typeof storeListResponseSchema>;
