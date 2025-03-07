import { z } from "zod";

export const profileSchema = z.object({
  availableIds: z.object({
    types: z.array(z.string()).optional(),
    others: z.array(z.string()).optional(),
  }).optional(),
  canProvideResidenceRecord: z.boolean().optional(),
  canPhotoDiary: z.boolean().optional(),
  canHomeDelivery: z.boolean().optional(),
  ngOptions: z.object({
    common: z.array(z.string()).optional(),
    others: z.array(z.string()).optional(),
  }),
  allergies: z.object({
    types: z.array(z.string()).optional(),
    others: z.array(z.string()).optional(),
  }),
  smoking: z.object({
    types: z.array(z.string()).optional(),
    others: z.array(z.string()).optional(),
  }),
  estheOptions: z.object({
    available: z.array(z.string()).optional(),
    otherNgOptions: z.string().optional(), 
  }).optional(),
});

export type ProfileData = z.infer<typeof profileSchema>;