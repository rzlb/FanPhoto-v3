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
  caption: text("caption"),
  status: text("status").notNull().default("pending"), // pending, approved, rejected, archived
  displayOrder: integer("display_order").default(0), // For ordering photos in the display rotation
  createdAt: timestamp("created_at").defaultNow(),
});

export const insertPhotoSchema = createInsertSchema(photos).pick({
  originalPath: true,
  submitterName: true,
  caption: true,
});

export const displaySettings = pgTable("display_settings", {
  id: serial("id").primaryKey(),
  backgroundPath: text("background_path"),
  autoRotate: boolean("auto_rotate").notNull().default(true),
  slideInterval: integer("slide_interval").notNull().default(8),
  showInfo: boolean("show_info").notNull().default(true),
  showCaptions: boolean("show_captions").notNull().default(true),
  separateCaptions: boolean("separate_captions").notNull().default(false),
  transitionEffect: text("transition_effect").notNull().default("slide"),
  blacklistWords: text("blacklist_words"),
  borderStyle: text("border_style").default("none"),
  borderWidth: integer("border_width").default(0),
  borderColor: text("border_color").default("#ffffff"),
  fontFamily: text("font_family").default("Arial"),
  fontColor: text("font_color").default("#ffffff"),
  fontSize: integer("font_size").default(16),
  imagePosition: text("image_position").default("center"),
  captionBgColor: text("caption_bg_color").default("rgba(0,0,0,0.5)"),
  captionFontFamily: text("caption_font_family").default("Arial"),
  captionFontColor: text("caption_font_color").default("#ffffff"),
  captionFontSize: integer("caption_font_size").default(14),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const insertDisplaySettingsSchema = createInsertSchema(displaySettings).pick({
  backgroundPath: true,
  autoRotate: true,
  slideInterval: true,
  showInfo: true,
  showCaptions: true,
  separateCaptions: true,
  transitionEffect: true,
  blacklistWords: true,
  borderStyle: true,
  borderWidth: true,
  borderColor: true,
  fontFamily: true,
  fontColor: true,
  fontSize: true,
  imagePosition: true,
  captionBgColor: true,
  captionFontFamily: true,
  captionFontColor: true,
  captionFontSize: true,
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
  caption: z.string().max(200).optional(),
});

export const moderationActionSchema = z.object({
  photoId: z.number(),
  action: z.enum(["approve", "reject", "archive"]),
});

export const displaySettingsSchema = z.object({
  backgroundPath: z.string().optional(),
  autoRotate: z.boolean().default(true),
  slideInterval: z.number().min(1).max(60).default(8),
  showInfo: z.boolean().default(true),
  showCaptions: z.boolean().default(true),
  separateCaptions: z.boolean().default(false),
  transitionEffect: z.enum(["fade", "slide", "zoom", "flip"]).default("slide"),
  blacklistWords: z.string().optional(),
  borderStyle: z.enum(["none", "solid", "dashed", "dotted", "double"]).default("none"),
  borderWidth: z.number().min(0).max(20).default(0),
  borderColor: z.string().default("#ffffff"),
  fontFamily: z.enum(["Arial", "Helvetica", "Verdana", "Georgia", "Times New Roman", "Courier New"]).default("Arial"),
  fontColor: z.string().default("#ffffff"),
  fontSize: z.number().min(8).max(36).default(16),
  imagePosition: z.enum(["center", "top", "bottom", "left", "right"]).default("center"),
  captionBgColor: z.string().default("rgba(0,0,0,0.5)"),
  captionFontFamily: z.enum(["Arial", "Helvetica", "Verdana", "Georgia", "Times New Roman", "Courier New"]).default("Arial"),
  captionFontColor: z.string().default("#ffffff"),
  captionFontSize: z.number().min(8).max(36).default(14),
});

export const photoDisplayOrderSchema = z.object({
  photoId: z.number(),
  displayOrder: z.number().int().min(0),
});

export const reorderPhotosSchema = z.object({
  photoOrders: z.array(photoDisplayOrderSchema)
});
