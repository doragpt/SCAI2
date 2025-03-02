import { pgTable, text, serial, integer, boolean, timestamp, json, date } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  username: text("username").notNull().unique(),
  password: text("password").notNull(),
  role: text("role", { enum: ["talent", "store"] }).notNull(),
  displayName: text("display_name").notNull(),
  age: integer("age").notNull(),
  location: text("location").notNull(),
  createdAt: timestamp("created_at").defaultNow(),
});

// 詳細プロフィールは別テーブルで管理
export const talentProfiles = pgTable("talent_profiles", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull(),
  birthDate: date("birth_date").notNull(),
  employmentType: text("employment_type", { enum: ["dispatch", "resident"] }).notNull(),
  guaranteeAmount: integer("guarantee_amount"),
  availableFrom: date("available_from"),
  availableTo: date("available_to"),
  sameDay: boolean("same_day").default(false),
  height: integer("height"),
  weight: integer("weight"),
  bust: integer("bust"),
  waist: integer("waist"),
  hip: integer("hip"),
  cupSize: text("cup_size"),
  photos: json("photos").$type<string[]>(),
  serviceTypes: json("service_types").$type<string[]>().default([]),
  preferredLocations: json("preferred_locations").$type<string[]>().default([]),
  ngLocations: json("ng_locations").$type<string[]>().default([]),
  departureLocation: text("departure_location"),
  returnLocation: text("return_location"),
  workingHours: integer("working_hours"),
  hasCompleteProfile: boolean("has_complete_profile").default(false),
});

export const storeProfiles = pgTable("store_profiles", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull(),
  businessName: text("business_name").notNull(),
  serviceType: text("service_type").notNull(),
  location: text("location").notNull(),
  minimumGuarantee: integer("minimum_guarantee"),
  maximumGuarantee: integer("maximum_guarantee"),
  transportationSupport: boolean("transportation_support").default(false),
  housingSupport: boolean("housing_support").default(false),
});

export const applications = pgTable("applications", {
  id: serial("id").primaryKey(),
  talentId: integer("talent_id").notNull(),
  storeId: integer("store_id").notNull(),
  status: text("status", { enum: ["pending", "accepted", "rejected"] }).notNull(),
  guaranteeOffer: integer("guarantee_offer"),
  message: text("message"),
  createdAt: timestamp("created_at").defaultNow(),
});

export const insertUserSchema = createInsertSchema(users)
  .pick({
    username: true,
    password: true,
    role: true,
    displayName: true,
    age: true,
    location: true,
  });

export const insertTalentProfileSchema = createInsertSchema(talentProfiles)
  .omit({
    id: true,
    userId: true,
  })
  .extend({
    birthDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "正しい日付形式を入力してください"),
    availableFrom: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "正しい日付形式を入力してください"),
    availableTo: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "正しい日付形式を入力してください"),
    bust: z.number().optional(),
    waist: z.number().optional(),
    hip: z.number().optional(),
    employmentType: z.enum(["dispatch", "resident"]),
    serviceTypes: z.array(z.string()).default([]),
  });

export const insertStoreProfileSchema = createInsertSchema(storeProfiles).omit({
  id: true,
  userId: true,
});

export const insertApplicationSchema = createInsertSchema(applications).omit({
  id: true,
  createdAt: true,
});

// LoginData型を追加
export const loginSchema = insertUserSchema.pick({
  username: true,
  password: true,
}).extend({
  role: z.enum(["talent", "store"]),
});

export type LoginData = z.infer<typeof loginSchema>;

export type InsertUser = z.infer<typeof insertUserSchema>;
export type User = typeof users.$inferSelect;
export type TalentProfile = typeof talentProfiles.$inferSelect;
export type StoreProfile = typeof storeProfiles.$inferSelect;
export type Application = typeof applications.$inferSelect;