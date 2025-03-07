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
  bodyMark: z.object({
    hasBodyMark: z.boolean().optional(),
    details: z.string().optional(),
    others: z.array(z.string()).optional(),
  }).optional(),
  estheOptions: z.object({
    available: z.array(z.string()).optional(),
    otherNgOptions: z.string().optional(), // テキストフィールドなのでstring型
  }).optional(),
});

export type ProfileData = z.infer<typeof profileSchema>;