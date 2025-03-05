import { z } from "zod";

export const profileSchema = z.object({
  lastName: z.string(),
  firstName: z.string(),
  lastNameKana: z.string(),
  firstNameKana: z.string(),
  birthDate: z.string(),
  age: z.number(),
  phoneNumber: z.string(),
  email: z.string(),
  location: z.string(),
  nearestStation: z.string(),
  height: z.number(),
  weight: z.number(),
  bust: z.number(),
  waist: z.number(),
  hip: z.number(),
  cupSize: z.string(),
  availableIds: z.object({
    types: z.array(z.string()).optional(),
    others: z.array(z.string()).optional(),
  }),
  canProvideResidenceRecord: z.boolean(),
  canPhotoDiary: z.boolean(),
  canHomeDelivery: z.boolean(),
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
    ngOptions: z.array(z.string()).optional(),
  }).optional(),
  hasEstheExperience: z.boolean().optional(),
  estheExperiencePeriod: z.string().optional(),
  faceVisibility: z.string().optional(),
  hasSnsAccount: z.boolean().optional(),
  snsUrls: z.array(z.string()).optional(),
  currentStores: z.array(z.object({
    storeName: z.string(),
    stageName: z.string(),
  })).optional(),
  previousStores: z.array(z.object({
    storeName: z.string(),
  })).optional(),
  selfIntroduction: z.string().optional(),
  notes: z.string().optional(),
});

export type ProfileData = z.infer<typeof profileSchema>;
