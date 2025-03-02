import { pgTable, text, serial, integer, boolean, timestamp, json } from "drizzle-orm/pg-core";
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
  age: integer("age").notNull(),
  guaranteeAmount: integer("guarantee_amount").notNull(),
  availableFrom: timestamp("available_from").notNull(),
  availableTo: timestamp("available_to").notNull(),
  sameDay: boolean("same_day").default(false),
  height: integer("height").notNull(),
  weight: integer("weight").notNull(),
  bust: integer("bust").notNull(),
  waist: integer("waist").notNull(),
  hip: integer("hip").notNull(),
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

export const insertTalentProfileSchema = createInsertSchema(talentProfiles).omit({
  id: true,  
  userId: true,
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
