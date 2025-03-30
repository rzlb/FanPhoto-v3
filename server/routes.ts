import type { Express, Request, Response } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import multer from "multer";
import path from "path";
import fs from "fs";
import { 
  photoUploadSchema, 
  moderationActionSchema,
  displaySettingsSchema as originalDisplaySettingsSchema,
  reorderPhotosSchema,
  photoDisplayOrderSchema,
  Event
} from "@shared/schema";
import { z } from "zod";
import cors from "cors";
import express from 'express';

// Override the display settings schema to explicitly include text-only
const displaySettingsSchema = z.object({
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

// Setup upload directories
const UPLOAD_DIR = path.join(process.cwd(), "uploads");
const ORIGINAL_DIR = path.join(UPLOAD_DIR, "original");
const TRANSFORMED_DIR = path.join(UPLOAD_DIR, "transformed");

// Create upload directories if they don't exist
[UPLOAD_DIR, ORIGINAL_DIR, TRANSFORMED_DIR].forEach(dir => {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
});

// Configure multer storage
const storageConfig = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, ORIGINAL_DIR);
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, uniqueSuffix + path.extname(file.originalname));
  }
});

// Configure upload middleware
const upload = multer({
  storage: storageConfig,
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB limit
  },
  fileFilter: (req, file, cb) => {
    // Only accept images
    if (file.mimetype.startsWith('image/')) {
      cb(null, true);
    } else {
      cb(new Error('Only image files are allowed'));
    }
  }
});

// Function to generate a slug from a name
function generateSlug(name: string): string {
  return name
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, '')
    .replace(/[\s_-]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

export async function registerRoutes(app: Express): Promise<Server> {
  // Allow CORS for development
  app.use(cors());
  
  // Parse JSON and URL-encoded bodies
  app.use(express.json());
  app.use(express.urlencoded({ extended: true }));

  // Serve uploaded files
  app.use('/uploads', express.static(UPLOAD_DIR));
  
  // Handle OPTIONS requests
  app.options('*', (req, res) => {
    res.status(200).end();
  });
  
  // Event routes
  // Get all events
  app.get('/events', async (req: Request, res: Response) => {
    try {
      // For now, just return an empty array as we don't have an event storage yet
      // const events = await storage.getEvents();
      const events: Event[] = []; // Mock empty list of events
      res.json(events);
    } catch (error) {
      console.error("Error fetching events:", error);
      res.status(500).json({ error: "Failed to fetch events" });
    }
  });
  
  // Get event by ID
  app.get('/events/:id', async (req: Request, res: Response) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ error: "Invalid event ID" });
      }
      
      // Mock event for now
      const event: Event = {
        id,
        name: `Event ${id}`,
        slug: `event-${id}`,
        description: "Mock event description",
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date()
      };
      
      res.json(event);
    } catch (error) {
      console.error("Error fetching event:", error);
      res.status(500).json({ error: "Failed to fetch event" });
    }
  });
  
  // Get event by slug
  app.get('/events/slug/:slug', async (req: Request, res: Response) => {
    try {
      const slug = req.params.slug;
      
      // Mock event for now
      const event: Event = {
        id: 1,
        name: `Event for ${slug}`,
        slug,
        description: "Mock event description",
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date()
      };
      
      res.json(event);
    } catch (error) {
      console.error("Error fetching event by slug:", error);
      res.status(500).json({ error: "Failed to fetch event" });
    }
  });
  
  // Create event
  app.post('/events', async (req: Request, res: Response) => {
    try {
      const eventData = req.body;
      
      // Generate slug if not provided
      if (!eventData.slug && eventData.name) {
        eventData.slug = generateSlug(eventData.name);
      }
      
      // Mock created event
      const event: Event = {
        id: Date.now(), // Use timestamp as mock ID
        ...eventData,
        createdAt: new Date(),
        updatedAt: new Date()
      };
      
      res.status(201).json(event);
    } catch (error) {
      console.error("Error creating event:", error);
      res.status(500).json({ error: "Failed to create event" });
    }
  });
  
  // Update event
  app.put('/events/:id', async (req: Request, res: Response) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ error: "Invalid event ID" });
      }
      
      const eventData = req.body;
      
      // Mock updated event
      const event: Event = {
        id,
        ...eventData,
        updatedAt: new Date()
      };
      
      res.json(event);
    } catch (error) {
      console.error("Error updating event:", error);
      res.status(500).json({ error: "Failed to update event" });
    }
  });
  
  // Delete event
  app.delete('/events/:id', async (req: Request, res: Response) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ error: "Invalid event ID" });
      }
      
      // Mock successful deletion
      res.status(204).end();
    } catch (error) {
      console.error("Error deleting event:", error);
      res.status(500).json({ error: "Failed to delete event" });
    }
  });

  // API Routes
  app.get('/api/stats', async (req: Request, res: Response) => {
    try {
      const pendingPhotos = await storage.getPendingPhotosCount();
      const approvedPhotos = await storage.getApprovedPhotosCount();
      const rejectedPhotos = await storage.getRejectedPhotosCount();
      const archivedPhotos = await storage.getArchivedPhotosCount();
      
      res.json({
        totalUploads: pendingPhotos + approvedPhotos + rejectedPhotos + archivedPhotos,
        approvedPhotos,
        pendingApproval: pendingPhotos,
        archivedPhotos
      });
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch stats" });
    }
  });
  
  // API event routes
  app.get('/api/events', async (req: Request, res: Response) => {
    try {
      console.log("GET /api/events called");
      const events = await storage.getEvents();
      console.log("Events from storage:", events);
      
      // If no events found, return a default one
      if (!events || events.length === 0) {
        console.log("No events found, returning default event");
        const defaultEvent: any = {
          id: 1,
          name: "Default Event",
          slug: "default-event",
          description: "This is a default event created by the system",
          startDate: new Date(),
          endDate: null,
          isActive: true,
          createdAt: new Date(),
          updatedAt: new Date(),
          category: "other"
        };
        
        console.log("Sending default event:", [defaultEvent]);
        return res.json([defaultEvent]);
      } else {
        console.log("Sending events:", events);
        return res.json(events);
      }
    } catch (error) {
      console.error("Error fetching events:", error);
      res.status(500).json({ error: "Failed to fetch events" });
    }
  });
  
  app.get('/api/events/:id', async (req: Request, res: Response) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ error: "Invalid event ID" });
      }
      
      const event = await storage.getEvent(id);
      if (!event) {
        return res.status(404).json({ error: "Event not found" });
      }
      
      res.json(event);
    } catch (error) {
      console.error("Error fetching event:", error);
      res.status(500).json({ error: "Failed to fetch event" });
    }
  });
  
  app.get('/api/events/slug/:slug', async (req: Request, res: Response) => {
    try {
      const slug = req.params.slug;
      
      const event = await storage.getEventBySlug(slug);
      if (!event) {
        return res.status(404).json({ error: "Event not found" });
      }
      
      res.json(event);
    } catch (error) {
      console.error("Error fetching event by slug:", error);
      res.status(500).json({ error: "Failed to fetch event" });
    }
  });
  
  app.post('/api/events', async (req: Request, res: Response) => {
    try {
      const eventData = req.body;
      
      const event = await storage.createEvent(eventData);
      res.status(201).json(event);
    } catch (error) {
      console.error("Error creating event:", error);
      res.status(500).json({ error: "Failed to create event" });
    }
  });
  
  app.put('/api/events/:id', async (req: Request, res: Response) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ error: "Invalid event ID" });
      }
      
      const eventData = req.body;
      
      const event = await storage.updateEvent(id, eventData);
      if (!event) {
        return res.status(404).json({ error: "Event not found" });
      }
      
      res.json(event);
    } catch (error) {
      console.error("Error updating event:", error);
      res.status(500).json({ error: "Failed to update event" });
    }
  });
  
  app.delete('/api/events/:id', async (req: Request, res: Response) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ error: "Invalid event ID" });
      }
      
      const success = await storage.deleteEvent(id);
      if (!success) {
        return res.status(404).json({ error: "Event not found" });
      }
      
      res.status(204).end();
    } catch (error) {
      console.error("Error deleting event:", error);
      res.status(500).json({ error: "Failed to delete event" });
    }
  });
  
  // Analytics routes
  app.get('/api/analytics', async (req: Request, res: Response) => {
    try {
      // Parse start and end dates if provided
      let startDate: Date | undefined;
      let endDate: Date | undefined;
      
      if (req.query.startDate && typeof req.query.startDate === 'string') {
        startDate = new Date(req.query.startDate);
      }
      
      if (req.query.endDate && typeof req.query.endDate === 'string') {
        endDate = new Date(req.query.endDate);
      }
      
      const analyticsData = await storage.getAnalytics(startDate, endDate);
      
      res.json(analyticsData);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch analytics data" });
    }
  });
  
  app.get('/api/analytics/daily', async (req: Request, res: Response) => {
    try {
      const dailyAnalytics = await storage.getDailyAnalytics();
      res.json(dailyAnalytics);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch daily analytics" });
    }
  });

  // Get recent photos
  app.get('/api/photos/recent', async (req: Request, res: Response) => {
    try {
      const limit = Number(req.query.limit) || 6;
      // If eventId is provided, use it, otherwise get recent photos across all events
      const eventId = req.query.eventId ? Number(req.query.eventId) : undefined;
      
      // Use the default event ID (1) if no eventId is provided
      const photos = await storage.getRecentPhotos(eventId || 1, limit);
      res.json(photos);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch recent photos" });
    }
  });
  
  // Get photos by status
  app.get('/api/photos', async (req: Request, res: Response) => {
    try {
      const status = req.query.status as string | undefined;
      const eventId = req.query.eventId ? Number(req.query.eventId) : undefined;
      
      // Use the default event ID (1) if no eventId is provided
      const photos = await storage.getPhotos(eventId || 1, status);
      res.json(photos);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch photos" });
    }
  });
  
  // Upload new photo
  app.post('/api/photos/upload', upload.array('photos', 5), async (req: Request, res: Response) => {
    try {
      const files = req.files as Express.Multer.File[];
      
      if (!files || files.length === 0) {
        return res.status(400).json({ error: "No files uploaded" });
      }
      
      const result = photoUploadSchema.safeParse(req.body);
      if (!result.success) {
        return res.status(400).json({ error: result.error.errors });
      }
      
      const createdPhotos = [];
      
      for (const file of files) {
        const photo = await storage.createPhoto({
          eventId: 1, // Use the default event ID
          originalPath: `/uploads/original/${file.filename}`,
          submitterName: req.body.submitterName || "Anonymous",
          caption: req.body.caption || null
        });
        
        // Track upload in analytics
        await storage.incrementAnalyticValue('uploads', 1, 1);
        
        createdPhotos.push(photo);
      }
      
      res.status(201).json(createdPhotos);
    } catch (error) {
      console.error("Upload error:", error);
      res.status(500).json({ error: "Failed to upload photos" });
    }
  });
  
  // Moderate photo (approve/reject)
  app.post('/api/photos/moderate', async (req: Request, res: Response) => {
    try {
      const result = moderationActionSchema.safeParse(req.body);
      
      if (!result.success) {
        return res.status(400).json({ error: result.error.errors });
      }
      
      const { photoId, action } = result.data;
      const photo = await storage.getPhoto(photoId);
      
      if (!photo) {
        return res.status(404).json({ error: "Photo not found" });
      }
      
      let status;
      if (action === "approve") {
        status = "approved";
        // Track approval in analytics
        await storage.incrementAnalyticValue('approved', 1, 1);
      } else if (action === "reject") {
        status = "rejected";
        // Track rejection in analytics
        await storage.incrementAnalyticValue('rejected', 1, 1);
      } else if (action === "archive") {
        status = "archived";
        // Track archiving in analytics
        await storage.incrementAnalyticValue('archived', 1, 1);
      } else {
        status = "rejected";
        // Track rejection in analytics as default
        await storage.incrementAnalyticValue('rejected', 1, 1);
      }
      
      const updatedPhoto = await storage.updatePhotoStatus(photoId, status);
      
      res.json(updatedPhoto);
    } catch (error) {
      res.status(500).json({ error: "Failed to moderate photo" });
    }
  });
  
  // Get QR code for upload page
  app.get('/api/qrcode', async (req: Request, res: Response) => {
    try {
      const host = req.headers.host || 'localhost:3000';
      const protocol = req.secure ? 'https' : 'http';
      const uploadUrl = `${protocol}://${host}/upload`;
      
      // Track QR code scan in analytics
      try {
        await storage.incrementAnalyticValue('qrScans');
      } catch (err) {
        console.error("Failed to track QR scan:", err);
      }
      
      // We're returning both the URL and a URL to a QR code generator service
      res.json({
        uploadUrl,
        qrCodeUrl: `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(uploadUrl)}`
      });
    } catch (error) {
      res.status(500).json({ error: "Failed to generate QR code" });
    }
  });
  
  // Get display settings
  app.get('/api/display-settings', async (req: Request, res: Response) => {
    try {
      const settings = await storage.getDisplaySettings();
      res.json(settings || {});
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch display settings" });
    }
  });
  
  // Update display settings
  app.post('/api/display-settings', async (req: Request, res: Response) => {
    try {
      // Log the request body for debugging
      console.log("Received display settings update:", JSON.stringify(req.body));
      
      // Accept the request data without validation first
      const requestData = req.body;
      
      // Check if it's a text-only format - if so, we need to handle it specially
      if (requestData.displayFormat === "text-only") {
        console.log("Detected text-only format, bypassing validation");
        
        // Directly update the settings without schema validation
        const settings = await storage.updateDisplaySettings({
          ...requestData,
          displayFormat: "text-only" // Ensure it's correctly set
        });
        
        return res.json(settings);
      }
      
      // For other formats, use regular validation
      const result = displaySettingsSchema.safeParse(req.body);
      
      if (!result.success) {
        console.error("Validation error:", JSON.stringify(result.error.errors));
        return res.status(400).json({ error: result.error.errors });
      }
      
      const settings = await storage.updateDisplaySettings(result.data);
      res.json(settings);
    } catch (error) {
      console.error("Display settings update error:", error);
      res.status(500).json({ error: "Failed to update display settings" });
    }
  });
  
  // Upload background image for display
  app.post('/api/display-settings/background', upload.single('background'), async (req: Request, res: Response) => {
    try {
      const file = req.file as Express.Multer.File;
      
      if (!file) {
        return res.status(400).json({ error: "No background image uploaded" });
      }
      
      const settings = await storage.uploadBackgroundImage(`/uploads/original/${file.filename}`);
      res.json(settings);
    } catch (error) {
      console.error("Background upload error:", error);
      res.status(500).json({ error: "Failed to upload background image" });
    }
  });
  
  // Upload logo image for display
  app.post('/api/display-settings/logo', upload.single('logo'), async (req: Request, res: Response) => {
    try {
      const file = req.file as Express.Multer.File;
      
      if (!file) {
        return res.status(400).json({ error: "No logo image uploaded" });
      }
      
      const settings = await storage.uploadLogoImage(`/uploads/original/${file.filename}`);
      res.json(settings);
    } catch (error) {
      console.error("Logo upload error:", error);
      res.status(500).json({ error: "Failed to upload logo image" });
    }
  });
  
  // Update photo display order (single photo)
  app.post('/api/photos/display-order', async (req: Request, res: Response) => {
    try {
      const result = photoDisplayOrderSchema.safeParse(req.body);
      
      if (!result.success) {
        return res.status(400).json({ error: result.error.errors });
      }
      
      const { photoId, displayOrder } = result.data;
      const photo = await storage.getPhoto(photoId);
      
      if (!photo) {
        return res.status(404).json({ error: "Photo not found" });
      }
      
      const updatedPhoto = await storage.updatePhotoDisplayOrder(photoId, displayOrder);
      res.json(updatedPhoto);
    } catch (error) {
      console.error("Display order update error:", error);
      res.status(500).json({ error: "Failed to update photo display order" });
    }
  });
  
  // Batch update multiple photos' display order
  app.post('/api/photos/reorder', async (req: Request, res: Response) => {
    try {
      const result = reorderPhotosSchema.safeParse(req.body);
      
      if (!result.success) {
        return res.status(400).json({ error: result.error.errors });
      }
      
      const { photoOrders } = result.data;
      const updatedPhotos = await storage.updatePhotosDisplayOrder(photoOrders);
      
      res.json(updatedPhotos);
    } catch (error) {
      console.error("Reorder photos error:", error);
      res.status(500).json({ error: "Failed to reorder photos" });
    }
  });
  
  // Get approved display images
  app.get('/api/display/images', async (req: Request, res: Response) => {
    try {
      // Track view in analytics
      await storage.incrementAnalyticValue('views', 1, 1);
      
      // Get approved photos directly (excluding archived photos)
      const approvedPhotos = await storage.getPhotos(1, "approved");
      
      // Sort by display order (lower values first, then by createdAt date)
      const sortedPhotos = [...approvedPhotos].sort((a, b) => {
        // Handle null/undefined cases
        const orderA = a.displayOrder === null || a.displayOrder === undefined ? Number.MAX_SAFE_INTEGER : a.displayOrder;
        const orderB = b.displayOrder === null || b.displayOrder === undefined ? Number.MAX_SAFE_INTEGER : b.displayOrder;
        
        // Compare display orders
        if (orderA !== orderB) {
          return orderA - orderB;
        }
        
        // If same order or both don't have order, sort by date (most recent first)
        const timeA = a.createdAt ? a.createdAt.getTime() : 0;
        const timeB = b.createdAt ? b.createdAt.getTime() : 0;
        return timeB - timeA;
      });
      
      // Convert to display format
      const displayImages = sortedPhotos.map(photo => ({
        id: photo.id,
        originalPath: photo.originalPath,
        submitterName: photo.submitterName || "Anonymous",
        caption: photo.caption,
        displayOrder: photo.displayOrder,
        createdAt: photo.createdAt
      }));
      
      res.json(displayImages);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch display images" });
    }
  });

  // Update display settings (partial update)
  app.patch('/api/display/settings', async (req: Request, res: Response) => {
    try {
      // Validate only the fields we want to update
      const { autoRotate } = req.body;
      
      if (typeof autoRotate !== 'boolean' && autoRotate !== undefined) {
        return res.status(400).json({ error: "Invalid autoRotate value" });
      }
      
      // Update only the provided settings
      const settings = await storage.updateDisplaySettings({
        autoRotate: autoRotate !== undefined ? autoRotate : undefined
      });
      
      res.json(settings);
    } catch (error) {
      console.error("Display settings patch error:", error);
      res.status(500).json({ error: "Failed to update display settings" });
    }
  });
  
  // Set current image in rotation
  app.post('/api/display/set-current-image', async (req: Request, res: Response) => {
    try {
      const { imageId } = req.body;
      
      if (!imageId || typeof imageId !== 'number') {
        return res.status(400).json({ error: "Invalid image ID" });
      }
      
      // Get the photo to set as current
      const photo = await storage.getPhoto(imageId);
      
      if (!photo) {
        return res.status(404).json({ error: "Image not found" });
      }
      
      if (photo.status !== "approved") {
        return res.status(400).json({ error: "Image is not approved for display" });
      }
      
      // Get all approved photos
      const approvedPhotos = await storage.getPhotos("approved");
      
      // Reorder the photos to put the target image first
      const photoOrders = approvedPhotos.map(p => {
        if (p.id === imageId) {
          // Set target image to order 0 (first position)
          return { photoId: p.id, displayOrder: 0 };
        } else {
          // Shift other photos down by 1
          return { photoId: p.id, displayOrder: (p.displayOrder || 0) + 1 };
        }
      });
      
      // Update all display orders
      const updatedPhotos = await storage.updatePhotosDisplayOrder(photoOrders);
      
      res.json({
        success: true,
        currentImageId: imageId,
        message: "Current image has been set"
      });
    } catch (error) {
      console.error("Set current image error:", error);
      res.status(500).json({ error: "Failed to set current image" });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}
