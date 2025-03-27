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

export const displaySettings = pgTable("display_settings", {
  id: serial("id").primaryKey(),
  backgroundPath: text("background_path"),
  autoRotate: boolean("auto_rotate").notNull().default(true),
  slideInterval: integer("slide_interval").notNull().default(8),
  showInfo: boolean("show_info").notNull().default(true),
  transitionEffect: text("transition_effect").notNull().default("slide"),
  blacklistWords: text("blacklist_words"),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const insertDisplaySettingsSchema = createInsertSchema(displaySettings).pick({
  backgroundPath: true,
  autoRotate: true,
  slideInterval: true,
  showInfo: true,
  transitionEffect: true,
  blacklistWords: true,
});

// Types
export type User = typeof users.$inferSelect;
export type InsertUser = z.infer<typeof insertUserSchema>;

export type Photo = typeof photos.$inferSelect;
export type InsertPhoto = z.infer<typeof insertPhotoSchema>;

export type DisplaySettings = typeof displaySettings.$inferSelect;
export type InsertDisplaySettings = z.infer<typeof insertDisplaySettingsSchema>;

// Additional validation schemas for our application
export const photoUploadSchema = z.object({
  submitterName: z.string().optional(),
});

export const moderationActionSchema = z.object({
  photoId: z.number(),
  action: z.enum(["approve", "reject"]),
});

export const displaySettingsSchema = z.object({
  backgroundPath: z.string().optional(),
  autoRotate: z.boolean().default(true),
  slideInterval: z.number().min(1).max(60).default(8),
  showInfo: z.boolean().default(true),
  transitionEffect: z.enum(["fade", "slide", "zoom"]).default("slide"),
  blacklistWords: z.string().optional(),
});
