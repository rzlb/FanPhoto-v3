import { pgTable, text, serial, integer, boolean, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  username: text("username").notNull().unique(),
  password: text("password").notNull(),
});

export const insertUserSchema = createInsertSchema(users).pick({
  username: true,
  password: true,
});

export const photos = pgTable("photos", {
  id: serial("id").primaryKey(),
  originalPath: text("original_path").notNull(),
  submitterName: text("submitter_name"),
  status: text("status").notNull().default("pending"), // pending, approved, rejected
  createdAt: timestamp("created_at").defaultNow(),
});

export const insertPhotoSchema = createInsertSchema(photos).pick({
  originalPath: true,
  submitterName: true,
});

export const transformations = pgTable("transformations", {
  id: serial("id").primaryKey(),
  photoId: integer("photo_id").notNull(),
  transformedPath: text("transformed_path").notNull(),
  promptUsed: text("prompt_used").notNull(),
  status: text("status").notNull().default("pending"), // pending, approved, rejected
  stylePreset: text("style_preset").notNull(),
  createdAt: timestamp("created_at").defaultNow(),
});

export const insertTransformationSchema = createInsertSchema(transformations).pick({
  photoId: true,
  transformedPath: true,
  promptUsed: true,
  stylePreset: true,
});

export const transformationSettings = pgTable("transformation_settings", {
  id: serial("id").primaryKey(),
  stylePreset: text("style_preset").notNull(),
  promptTemplate: text("prompt_template").notNull(),
  effectIntensity: integer("effect_intensity").notNull().default(7),
  isDefault: boolean("is_default").notNull().default(false),
});

export const insertTransformationSettingsSchema = createInsertSchema(transformationSettings).pick({
  stylePreset: true,
  promptTemplate: true,
  effectIntensity: true,
  isDefault: true,
});

// Types
export type User = typeof users.$inferSelect;
export type InsertUser = z.infer<typeof insertUserSchema>;

export type Photo = typeof photos.$inferSelect;
export type InsertPhoto = z.infer<typeof insertPhotoSchema>;

export type Transformation = typeof transformations.$inferSelect;
export type InsertTransformation = z.infer<typeof insertTransformationSchema>;

export type TransformationSettings = typeof transformationSettings.$inferSelect;
export type InsertTransformationSettings = z.infer<typeof insertTransformationSettingsSchema>;

// Additional validation schemas for our application
export const photoUploadSchema = z.object({
  submitterName: z.string().optional(),
});

export const moderationActionSchema = z.object({
  photoId: z.number(),
  action: z.enum(["approve", "reject"]),
});

export const transformationActionSchema = z.object({
  transformationId: z.number(),
  action: z.enum(["approve", "reject"]),
});

export const stylePresetSchema = z.object({
  name: z.string(),
  promptTemplate: z.string(),
  effectIntensity: z.number().min(1).max(10).default(7),
  isDefault: z.boolean().default(false),
});
