import { pgTable, text, serial, integer, boolean, timestamp, json, date } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  username: text("username").notNull().unique(),
  password: text("password").notNull(),
  role: text("role", { enum: ["talent", "scout"] }).notNull(),
  createdAt: timestamp("created_at").defaultNow(),
});

export const talentProfiles = pgTable("talent_profiles", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull(),
  birthDate: date("birth_date").notNull(),
  age: integer("age").notNull(),
  guaranteeAmount: integer("guarantee_amount").notNull(),
  availableFrom: date("available_from").notNull(),
  availableTo: date("available_to").notNull(),
  sameDay: boolean("same_day").default(false),
  height: integer("height").notNull(),
  weight: integer("weight").notNull(),
  bust: integer("bust"),
  waist: integer("waist"),
  hip: integer("hip"),
  cupSize: text("cup_size").notNull(),
  photos: json("photos").$type<string[]>().notNull(),
  serviceTypes: json("service_types").$type<string[]>().notNull(),
  location: text("location").notNull(),
});

export const scoutProfiles = pgTable("scout_profiles", {
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
  scoutId: integer("scout_id").notNull(),
  status: text("status", { enum: ["pending", "accepted", "rejected"] }).notNull(),
  guaranteeOffer: integer("guarantee_offer"),
  message: text("message"),
  createdAt: timestamp("created_at").defaultNow(),
});

export const insertUserSchema = createInsertSchema(users).pick({
  username: true,
  password: true,
  role: true,
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
    cupSize: z.string(),
  });

export const insertScoutProfileSchema = createInsertSchema(scoutProfiles).omit({
  id: true,
  userId: true,
});

export const insertApplicationSchema = createInsertSchema(applications).omit({
  id: true,
  createdAt: true,
});

export type InsertUser = z.infer<typeof insertUserSchema>;
export type User = typeof users.$inferSelect;
export type TalentProfile = typeof talentProfiles.$inferSelect;
export type ScoutProfile = typeof scoutProfiles.$inferSelect;
export type Application = typeof applications.$inferSelect;