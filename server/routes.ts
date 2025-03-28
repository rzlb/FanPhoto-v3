import type { Express, Request, Response } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import multer from "multer";
import path from "path";
import fs from "fs";
import { 
  photoUploadSchema, 
  moderationActionSchema,
  displaySettingsSchema,
  reorderPhotosSchema,
  photoDisplayOrderSchema
} from "@shared/schema";
import { z } from "zod";

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

export async function registerRoutes(app: Express): Promise<Server> {
  // Allow CORS for development
  app.use((req, res, next) => {
    res.header('Access-Control-Allow-Origin', '*');
    res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept');
    res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
    next();
  });

  // Serve uploaded files
  app.use('/uploads', express.static(UPLOAD_DIR));

  // API Routes
  app.get('/api/stats', async (req: Request, res: Response) => {
    try {
      const pendingPhotos = await storage.getPendingPhotosCount();
      const approvedPhotos = await storage.getApprovedPhotosCount();
      const rejectedPhotos = await storage.getRejectedPhotosCount();
      
      res.json({
        totalUploads: pendingPhotos + approvedPhotos + rejectedPhotos,
        approvedPhotos,
        pendingApproval: pendingPhotos
      });
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch stats" });
    }
  });

  // Get recent photos
  app.get('/api/photos/recent', async (req: Request, res: Response) => {
    try {
      const limit = Number(req.query.limit) || 6;
      const photos = await storage.getRecentPhotos(limit);
      res.json(photos);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch recent photos" });
    }
  });
  
  // Get photos by status
  app.get('/api/photos', async (req: Request, res: Response) => {
    try {
      const status = req.query.status as string | undefined;
      const photos = await storage.getPhotos(status);
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
          originalPath: `/uploads/original/${file.filename}`,
          submitterName: req.body.submitterName || "Anonymous",
          caption: req.body.caption || null
        });
        
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
      
      const status = action === "approve" ? "approved" : "rejected";
      const updatedPhoto = await storage.updatePhotoStatus(photoId, status);
      
      res.json(updatedPhoto);
    } catch (error) {
      console.error("Moderation error:", error);
      res.status(500).json({ error: "Failed to moderate photo" });
    }
  });
  

  
  // Generate a QR code based on hostname
  app.get('/api/qrcode', (req: Request, res: Response) => {
    const host = req.headers.host || 'localhost:5000';
    const protocol = req.secure ? 'https' : 'http';
    const uploadUrl = `${protocol}://${host}/upload`;
    
    // We're returning just the URL that can be used with a QR code service
    // The frontend will handle the actual QR code generation
    res.json({
      uploadUrl,
      qrCodeUrl: `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(uploadUrl)}`
    });
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
      const result = displaySettingsSchema.safeParse(req.body);
      
      if (!result.success) {
        return res.status(400).json({ error: result.error.errors });
      }
      
      const settings = await storage.updateDisplaySettings(result.data);
      res.json(settings);
    } catch (error) {
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
      // Get approved photos directly
      const approvedPhotos = await storage.getPhotos("approved");
      
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

  const httpServer = createServer(app);
  return httpServer;
}

// Import express for static typing
import express from 'express';
