import type { Express, Request, Response } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import multer from "multer";
import path from "path";
import fs from "fs";
import { 
  photoUploadSchema, 
  moderationActionSchema, 
  transformationActionSchema,
  stylePresetSchema
} from "@shared/schema";
import { z } from "zod";
import { generateTransformedImage } from "./openai";

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
      const pendingTransformations = await storage.getPendingTransformationsCount();
      const approvedTransformations = await storage.getApprovedTransformationsCount();
      
      res.json({
        totalUploads: pendingPhotos + approvedPhotos + rejectedPhotos,
        approvedPhotos,
        aiTransformations: approvedTransformations,
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
          submitterName: req.body.submitterName || "Anonymous"
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
      
      // If approved, automatically generate a transformation
      if (status === "approved") {
        try {
          const defaultSettings = await storage.getDefaultTransformationSettings();
          
          if (defaultSettings) {
            // Generate the transformation
            const originalFilePath = path.join(process.cwd(), photo.originalPath.replace('/uploads', 'uploads'));
            const transformedImageResult = await generateTransformedImage(
              originalFilePath,
              defaultSettings.promptTemplate,
              defaultSettings.effectIntensity
            );
            
            if (transformedImageResult) {
              const transformedFileName = `transformed-${Date.now()}-${photoId}.jpg`;
              const transformedFilePath = path.join(TRANSFORMED_DIR, transformedFileName);
              
              // Save the transformed image
              fs.writeFileSync(transformedFilePath, Buffer.from(transformedImageResult, 'base64'));
              
              // Create transformation record
              await storage.createTransformation({
                photoId,
                transformedPath: `/uploads/transformed/${transformedFileName}`,
                promptUsed: defaultSettings.promptTemplate,
                stylePreset: defaultSettings.stylePreset
              });
            }
          }
        } catch (transformError) {
          console.error("Transformation error:", transformError);
          // Continue even if transformation fails
        }
      }
      
      res.json(updatedPhoto);
    } catch (error) {
      console.error("Moderation error:", error);
      res.status(500).json({ error: "Failed to moderate photo" });
    }
  });
  
  // Get transformations by status
  app.get('/api/transformations', async (req: Request, res: Response) => {
    try {
      const status = req.query.status as string | undefined;
      const transformations = await storage.getTransformations(status);
      
      // Fetch the original photos for each transformation
      const transformationsWithPhotos = await Promise.all(
        transformations.map(async (transformation) => {
          const photo = await storage.getPhoto(transformation.photoId);
          return {
            ...transformation,
            originalPhoto: photo
          };
        })
      );
      
      res.json(transformationsWithPhotos);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch transformations" });
    }
  });
  
  // Create individual image transformation
  app.post('/api/transformations', async (req: Request, res: Response) => {
    try {
      const { imageId, prompt, stylePreset } = req.body;
      
      if (!imageId || !stylePreset) {
        return res.status(400).json({ error: "Image ID and style preset are required" });
      }
      
      // Get the photo to transform
      const photo = await storage.getPhoto(imageId);
      if (!photo) {
        return res.status(404).json({ error: "Photo not found" });
      }
      
      // Get the transformation settings for this style
      const allSettings = await storage.getAllTransformationSettings();
      const settings = allSettings.find(s => s.stylePreset === stylePreset);
      
      if (!settings) {
        return res.status(404).json({ error: "Style preset not found" });
      }
      
      // Generate the transformed image
      const originalFilePath = path.join(process.cwd(), photo.originalPath.replace('/uploads', 'uploads'));
      const transformedImageResult = await generateTransformedImage(
        originalFilePath,
        prompt || settings.promptTemplate,
        settings.effectIntensity
      );
      
      if (!transformedImageResult) {
        return res.status(500).json({ error: "Failed to generate transformed image" });
      }
      
      // Save the transformed image
      const transformedFileName = `transformed-${Date.now()}-${photo.id}.jpg`;
      const transformedFilePath = path.join(TRANSFORMED_DIR, transformedFileName);
      fs.writeFileSync(transformedFilePath, Buffer.from(transformedImageResult, 'base64'));
      
      // Create transformation record
      const transformation = await storage.createTransformation({
        photoId: photo.id,
        transformedPath: `/uploads/transformed/${transformedFileName}`,
        promptUsed: prompt || settings.promptTemplate,
        stylePreset: settings.stylePreset
      });
      
      res.status(201).json(transformation);
    } catch (error) {
      console.error("Transformation error:", error);
      res.status(500).json({ error: "Failed to transform image" });
    }
  });

  // Moderate transformation (approve/reject)
  app.post('/api/transformations/moderate', async (req: Request, res: Response) => {
    try {
      const result = transformationActionSchema.safeParse(req.body);
      
      if (!result.success) {
        return res.status(400).json({ error: result.error.errors });
      }
      
      const { transformationId, action } = result.data;
      const transformation = await storage.getTransformation(transformationId);
      
      if (!transformation) {
        return res.status(404).json({ error: "Transformation not found" });
      }
      
      const status = action === "approve" ? "approved" : "rejected";
      const updatedTransformation = await storage.updateTransformationStatus(transformationId, status);
      
      res.json(updatedTransformation);
    } catch (error) {
      console.error("Transformation moderation error:", error);
      res.status(500).json({ error: "Failed to moderate transformation" });
    }
  });
  
  // Get all transformation settings
  app.get('/api/transformation-settings', async (req: Request, res: Response) => {
    try {
      const settings = await storage.getAllTransformationSettings();
      res.json(settings);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch transformation settings" });
    }
  });
  
  // Get default transformation settings
  app.get('/api/transformation-settings/default', async (req: Request, res: Response) => {
    try {
      const settings = await storage.getDefaultTransformationSettings();
      
      if (!settings) {
        return res.status(404).json({ error: "No default transformation settings found" });
      }
      
      res.json(settings);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch default transformation settings" });
    }
  });
  
  // Create new transformation settings
  app.post('/api/transformation-settings', async (req: Request, res: Response) => {
    try {
      const result = stylePresetSchema.safeParse(req.body);
      
      if (!result.success) {
        return res.status(400).json({ error: result.error.errors });
      }
      
      const { name, promptTemplate, effectIntensity, isDefault } = result.data;
      
      const settings = await storage.createTransformationSettings({
        stylePreset: name,
        promptTemplate,
        effectIntensity,
        isDefault
      });
      
      res.status(201).json(settings);
    } catch (error) {
      res.status(500).json({ error: "Failed to create transformation settings" });
    }
  });
  
  // Apply transformation to pending photos
  app.post('/api/transformations/apply-to-pending', async (req: Request, res: Response) => {
    try {
      const settingsId = req.body.settingsId;
      
      if (!settingsId) {
        return res.status(400).json({ error: "Settings ID is required" });
      }
      
      const settings = await storage.getTransformationSettings(settingsId);
      
      if (!settings) {
        return res.status(404).json({ error: "Transformation settings not found" });
      }
      
      const approvedPhotos = await storage.getPhotos("approved");
      const results = [];
      
      for (const photo of approvedPhotos) {
        // Check if a transformation already exists for this photo with this style
        const existingTransformations = await storage.getTransformations();
        const hasExistingTransformation = existingTransformations.some(
          t => t.photoId === photo.id && t.stylePreset === settings.stylePreset
        );
        
        if (!hasExistingTransformation) {
          try {
            const originalFilePath = path.join(process.cwd(), photo.originalPath.replace('/uploads', 'uploads'));
            const transformedImageResult = await generateTransformedImage(
              originalFilePath,
              settings.promptTemplate,
              settings.effectIntensity
            );
            
            if (transformedImageResult) {
              const transformedFileName = `transformed-${Date.now()}-${photo.id}.jpg`;
              const transformedFilePath = path.join(TRANSFORMED_DIR, transformedFileName);
              
              // Save the transformed image
              fs.writeFileSync(transformedFilePath, Buffer.from(transformedImageResult, 'base64'));
              
              // Create transformation record
              const transformation = await storage.createTransformation({
                photoId: photo.id,
                transformedPath: `/uploads/transformed/${transformedFileName}`,
                promptUsed: settings.promptTemplate,
                stylePreset: settings.stylePreset
              });
              
              results.push(transformation);
            }
          } catch (transformError) {
            console.error("Transformation error for photo", photo.id, ":", transformError);
            // Continue with next photo even if this one fails
          }
        }
      }
      
      res.json({
        message: `Applied transformations to ${results.length} photos`,
        transformations: results
      });
    } catch (error) {
      console.error("Apply to pending error:", error);
      res.status(500).json({ error: "Failed to apply transformations to pending photos" });
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
  
  // Get approved display images
  app.get('/api/display/images', async (req: Request, res: Response) => {
    try {
      const approvedTransformations = await storage.getTransformations("approved");
      
      // Fetch the original photos for each transformation
      const displayImages = await Promise.all(
        approvedTransformations.map(async (transformation) => {
          const photo = await storage.getPhoto(transformation.photoId);
          return {
            id: transformation.id,
            originalPath: photo?.originalPath,
            transformedPath: transformation.transformedPath,
            stylePreset: transformation.stylePreset,
            submitterName: photo?.submitterName || "Anonymous",
            createdAt: transformation.createdAt
          };
        })
      );
      
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
