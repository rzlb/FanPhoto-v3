import { pgTable, text, serial, integer, boolean, timestamp, foreignKey } from "drizzle-orm/pg-core";
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

// New events table
export const events = pgTable("events", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  slug: text("slug").notNull().unique(), // unique identifier for URLs
  description: text("description"),
  startDate: timestamp("start_date"),
  endDate: timestamp("end_date"),
  isActive: boolean("is_active").default(true),
  createdAt: timestamp("created_at").defaultNow(),
});

export const insertEventSchema = createInsertSchema(events).pick({
  name: true,
  slug: true,
  description: true,
  startDate: true,
  endDate: true,
  isActive: true,
});

export const photos = pgTable("photos", {
  id: serial("id").primaryKey(),
  eventId: integer("event_id").notNull().references(() => events.id), // Add event reference
  originalPath: text("original_path").notNull(),
  submitterName: text("submitter_name"),
  caption: text("caption"),
  status: text("status").notNull().default("pending"), // pending, approved, rejected, archived
  displayOrder: integer("display_order").default(0), // For ordering photos in the display rotation
  createdAt: timestamp("created_at").defaultNow(),
});

export const insertPhotoSchema = createInsertSchema(photos).pick({
  eventId: true, // Add event ID to photo upload schema
  originalPath: true,
  submitterName: true,
  caption: true,
});

export const displaySettings = pgTable("display_settings", {
  id: serial("id").primaryKey(),
  eventId: integer("event_id").notNull().references(() => events.id), // Add event reference
  backgroundPath: text("background_path"),
  logoPath: text("logo_path"),
  displayFormat: text("display_format").default("16:9-default"),
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
  textPosition: text("text_position").default("overlay-bottom"),
  textAlignment: text("text_alignment").default("center"),
  textPadding: integer("text_padding").default(10),
  textMaxWidth: text("text_max_width").default("full"),
  textBackground: boolean("text_background").default(true),
  textBackgroundColor: text("text_background_color").default("#000000"),
  textBackgroundOpacity: integer("text_background_opacity").default(50),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const insertDisplaySettingsSchema = createInsertSchema(displaySettings).pick({
  eventId: true, // Add event ID to display settings schema
  backgroundPath: true,
  logoPath: true,
  displayFormat: true,
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
  textPosition: true,
  textAlignment: true,
  textPadding: true,
  textMaxWidth: true,
  textBackground: true,
  textBackgroundColor: true,
  textBackgroundOpacity: true,
});

// Add event-specific analytics
export const analytics = pgTable("analytics", {
  id: serial("id").primaryKey(),
  eventId: integer("event_id").notNull().references(() => events.id), // Add event reference
  date: timestamp("date").defaultNow().notNull(),
  uploads: integer("uploads").notNull().default(0),
  views: integer("views").notNull().default(0),
  qrScans: integer("qr_scans").notNull().default(0),
  approved: integer("approved").notNull().default(0),
  rejected: integer("rejected").notNull().default(0),
  archived: integer("archived").notNull().default(0),
});

// Types
export type User = typeof users.$inferSelect;
export type InsertUser = z.infer<typeof insertUserSchema>;

export type Event = typeof events.$inferSelect;
export type InsertEvent = z.infer<typeof insertEventSchema>;

export type Photo = typeof photos.$inferSelect;
export type InsertPhoto = z.infer<typeof insertPhotoSchema>;

export type DisplaySettings = typeof displaySettings.$inferSelect;
export type InsertDisplaySettings = z.infer<typeof insertDisplaySettingsSchema>;

export type Analytics = typeof analytics.$inferSelect;
export type InsertAnalytics = typeof analytics.$inferInsert;

// Additional validation schemas for our application
export const photoUploadSchema = z.object({
  eventId: z.number().optional(), // Make optional for backward compatibility
  submitterName: z.string().optional(),
  caption: z.string().max(200).optional(),
});

export const moderationActionSchema = z.object({
  photoId: z.number(),
  action: z.enum(["approve", "reject", "archive"]),
});

export const displaySettingsSchema = z.object({
  eventId: z.number(), // Required event ID
  backgroundPath: z.string().optional(),
  logoPath: z.string().optional(),
  displayFormat: z.string().default("16:9-default"),
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
  fontSize: z.number().min(8).max(72).default(16),
  imagePosition: z.enum(["center", "top", "bottom", "left", "right"]).default("center"),
  captionBgColor: z.string().default("rgba(0,0,0,0.5)"),
  captionFontFamily: z.enum(["Arial", "Helvetica", "Verdana", "Georgia", "Times New Roman", "Courier New"]).default("Arial"),
  captionFontColor: z.string().default("#ffffff"),
  captionFontSize: z.number().min(8).max(72).default(14),
  textPosition: z.enum([
    "overlay-bottom", 
    "overlay-top", 
    "below-image", 
    "above-image", 
    "left-of-image", 
    "right-of-image"
  ]).default("overlay-bottom"),
  textAlignment: z.enum(["left", "center", "right"]).default("center"),
  textPadding: z.number().min(0).max(50).default(10),
  textMaxWidth: z.enum(["full", "3/4", "1/2", "1/3"]).default("full"),
  textBackground: z.boolean().default(true),
  textBackgroundColor: z.string().default("#000000"),
  textBackgroundOpacity: z.number().min(0).max(100).default(50),
});

export const photoDisplayOrderSchema = z.object({
  photoId: z.number(),
  displayOrder: z.number().int().min(0),
});

export const reorderPhotosSchema = z.object({
  photoOrders: z.array(photoDisplayOrderSchema)
});

// Event creation and update schemas
export const createEventSchema = z.object({
  name: z.string().min(1, "Event name is required"),
  slug: z.string().min(1, "Slug is required").regex(/^[a-z0-9-]+$/, "Slug can only contain lowercase letters, numbers, and hyphens"),
  description: z.string().optional(),
  startDate: z.string().optional(),
  endDate: z.string().optional(),
  isActive: z.boolean().default(true),
});

export const updateEventSchema = createEventSchema.partial();
