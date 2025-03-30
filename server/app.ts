import express from "express";
import cors from "cors";
import multer from "multer";
import path from "path";
import * as fs from "fs";
import { MemStorage } from "./storage";
import { fileURLToPath } from "url";
import { dirname } from "path";
import { Event, InsertEvent, InsertPhoto, InsertUser } from "@shared/schema";
import { generateSlug } from "./utils";
import sharp from "sharp";

// Get the directory name of the current module
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const app = express();
const port = process.env.PORT || 5000;

const storage = new MemStorage();

// Ensure uploads directory exists
const uploadsDir = path.join(__dirname, "../uploads");
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

// Configure multer for file uploads
const upload = multer({
  storage: multer.diskStorage({
    destination: (req, file, cb) => {
      cb(null, uploadsDir);
    },
    filename: (req, file, cb) => {
      const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
      const ext = path.extname(file.originalname);
      cb(null, uniqueSuffix + ext);
    },
  }),
});

// Middleware
app.use(cors());
app.use(express.json());
app.use("/uploads", express.static(uploadsDir));

// Auth middleware
const authenticateToken = (req: any, res: any, next: any) => {
  const authHeader = req.headers["authorization"];
  const token = authHeader && authHeader.split(" ")[1];
  if (!token) return res.sendStatus(401);

  try {
    // Since we're using a simple token system, just check if the user exists
    const user = storage.getUserByUsername(token);
    if (!user) return res.sendStatus(403);
    req.user = user;
    next();
  } catch (err) {
    res.sendStatus(403);
  }
};

// Simple auth functions
async function createUser(userData: InsertUser, storage: MemStorage) {
  // Check if username already exists
  const existingUser = await storage.getUserByUsername(userData.username);
  if (existingUser) {
    throw new Error("Username already exists");
  }
  
  // In a real app, you would hash the password here
  return storage.createUser(userData);
}

async function validateLogin(username: string, password: string, storage: MemStorage) {
  const user = await storage.getUserByUsername(username);
  if (!user) {
    throw new Error("User not found");
  }
  
  // In a real app, you would compare hashed passwords
  if (user.password !== password) {
    throw new Error("Invalid password");
  }
  
  // In a real app, you would generate a JWT here
  return user.username; // Simple token
}

// Auth routes
app.post("/api/register", async (req, res) => {
  try {
    const userData: InsertUser = req.body;
    const user = await createUser(userData, storage);
    res.status(201).json(user);
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
});

app.post("/api/login", async (req, res) => {
  try {
    const { username, password } = req.body;
    const token = await validateLogin(username, password, storage);
    res.status(200).json({ token });
  } catch (error: any) {
    res.status(401).json({ error: error.message });
  }
});

// Event routes
app.get("/api/events", async (req, res) => {
  try {
    const events = await storage.getEvents();
    res.status(200).json(events);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

app.get("/api/events/:id", async (req, res) => {
  try {
    const event = await storage.getEvent(Number(req.params.id));
    if (!event) {
      return res.status(404).json({ error: "Event not found" });
    }
    res.status(200).json(event);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

app.get("/api/events/slug/:slug", async (req, res) => {
  try {
    const event = await storage.getEventBySlug(req.params.slug);
    if (!event) {
      return res.status(404).json({ error: "Event not found" });
    }
    res.status(200).json(event);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

app.post("/api/events", authenticateToken, async (req, res) => {
  try {
    const eventData: InsertEvent = req.body;
    
    // Generate slug if not provided
    if (!eventData.slug) {
      eventData.slug = generateSlug(eventData.name);
    }
    
    const event = await storage.createEvent(eventData);
    res.status(201).json(event);
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
});

app.put("/api/events/:id", authenticateToken, async (req, res) => {
  try {
    const updatedEvent = await storage.updateEvent(
      Number(req.params.id),
      req.body
    );
    if (!updatedEvent) {
      return res.status(404).json({ error: "Event not found" });
    }
    res.status(200).json(updatedEvent);
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
});

app.delete("/api/events/:id", authenticateToken, async (req, res) => {
  try {
    const result = await storage.deleteEvent(Number(req.params.id));
    if (!result) {
      return res.status(404).json({ error: "Event not found" });
    }
    res.status(204).send();
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Photo routes
app.post("/api/events/:eventId/photos/upload", upload.single("photo"), async (req, res) => {
  try {
    const file = req.file;
    if (!file) {
      return res.status(400).json({ error: "No file uploaded" });
    }

    const eventId = Number(req.params.eventId);
    const event = await storage.getEvent(eventId);
    if (!event) {
      return res.status(404).json({ error: "Event not found" });
    }

    // Process the image with sharp
    const outputFilename = path.basename(file.path);
    const outputPath = path.join(uploadsDir, outputFilename);
    
    // Resize and optimize the image while maintaining aspect ratio
    await sharp(file.path)
      .resize({
        width: 1200,
        height: 1200,
        fit: sharp.fit.inside,
        withoutEnlargement: true,
      })
      .jpeg({ quality: 85 })
      .toFile(outputPath);

    // Remove the original file
    fs.unlinkSync(file.path);

    const photoData: InsertPhoto = {
      eventId,
      originalPath: `/uploads/${outputFilename}`,
      submitterName: req.body.submitterName || null,
      caption: req.body.caption || null,
    };

    const photo = await storage.createPhoto(photoData);
    
    // Increment analytics for uploads
    await storage.incrementAnalyticValue(eventId, "uploads");
    
    res.status(201).json(photo);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

app.get("/api/events/:eventId/photos", async (req, res) => {
  try {
    const eventId = Number(req.params.eventId);
    const status = req.query.status as string | undefined;
    const photos = await storage.getPhotos(eventId, status);
    res.status(200).json(photos);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

app.get("/api/events/:eventId/photos/recent", async (req, res) => {
  try {
    const eventId = Number(req.params.eventId);
    const limit = Number(req.query.limit || 5);
    const photos = await storage.getRecentPhotos(eventId, limit);
    res.status(200).json(photos);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

app.get("/api/photos/:id", async (req, res) => {
  try {
    const photo = await storage.getPhoto(Number(req.params.id));
    if (!photo) {
      return res.status(404).json({ error: "Photo not found" });
    }
    res.status(200).json(photo);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

app.patch("/api/photos/:id/status", authenticateToken, async (req, res) => {
  try {
    const { status } = req.body;
    const photoId = Number(req.params.id);
    
    const photo = await storage.getPhoto(photoId);
    if (!photo) {
      return res.status(404).json({ error: "Photo not found" });
    }
    
    const updatedPhoto = await storage.updatePhotoStatus(photoId, status);
    
    // Update analytics based on the new status
    if (status === "approved") {
      await storage.incrementAnalyticValue(photo.eventId, "approved");
    } else if (status === "rejected") {
      await storage.incrementAnalyticValue(photo.eventId, "rejected");
    } else if (status === "archived") {
      await storage.incrementAnalyticValue(photo.eventId, "archived");
    }
    
    res.status(200).json(updatedPhoto);
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
});

app.patch(
  "/api/photos/:id/display-order",
  authenticateToken,
  async (req, res) => {
    try {
      const { displayOrder } = req.body;
      const updatedPhoto = await storage.updatePhotoDisplayOrder(
        Number(req.params.id),
        displayOrder
      );
      if (!updatedPhoto) {
        return res.status(404).json({ error: "Photo not found" });
      }
      res.status(200).json(updatedPhoto);
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  }
);

app.post(
  "/api/photos/batch-update-order",
  authenticateToken,
  async (req, res) => {
    try {
      const { orders } = req.body;
      const updatedPhotos = await storage.updatePhotosDisplayOrder(orders);
      res.status(200).json(updatedPhotos);
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  }
);

// Display settings routes
app.get("/api/events/:eventId/display-settings", async (req, res) => {
  try {
    const eventId = Number(req.params.eventId);
    const settings = await storage.getDisplaySettings(eventId);
    if (!settings) {
      return res.status(404).json({ error: "Display settings not found" });
    }
    res.status(200).json(settings);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

app.patch("/api/events/:eventId/display-settings", authenticateToken, async (req, res) => {
  try {
    const eventId = Number(req.params.eventId);
    // Add the eventId to the settings update
    const settingsToUpdate = { 
      ...req.body, 
      eventId 
    };
    
    const updatedSettings = await storage.updateDisplaySettings(settingsToUpdate);
    res.status(200).json(updatedSettings);
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
});

app.post(
  "/api/events/:eventId/display-settings/background",
  authenticateToken,
  upload.single("image"),
  async (req, res) => {
    try {
      const file = req.file;
      if (!file) {
        return res.status(400).json({ error: "No file uploaded" });
      }

      const eventId = Number(req.params.eventId);
      const outputFilename = path.basename(file.path);
      const outputPath = path.join(uploadsDir, outputFilename);

      // Process the image
      await sharp(file.path)
        .resize({
          width: 1920,
          height: 1080,
          fit: sharp.fit.inside,
          withoutEnlargement: true,
        })
        .jpeg({ quality: 90 })
        .toFile(outputPath);

      // Remove the original file
      fs.unlinkSync(file.path);

      const updatedSettings = await storage.uploadBackgroundImage(
        eventId,
        `/uploads/${outputFilename}`
      );
      res.status(200).json(updatedSettings);
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  }
);

app.post(
  "/api/events/:eventId/display-settings/logo",
  authenticateToken,
  upload.single("image"),
  async (req, res) => {
    try {
      const file = req.file;
      if (!file) {
        return res.status(400).json({ error: "No file uploaded" });
      }

      const eventId = Number(req.params.eventId);
      const outputFilename = path.basename(file.path);
      const outputPath = path.join(uploadsDir, outputFilename);

      // Process the image
      await sharp(file.path)
        .resize({
          width: 400,
          height: 400,
          fit: sharp.fit.inside,
          withoutEnlargement: true,
        })
        .png({ quality: 95 })
        .toFile(outputPath);

      // Remove the original file
      fs.unlinkSync(file.path);

      const updatedSettings = await storage.uploadLogoImage(
        eventId,
        `/uploads/${outputFilename}`
      );
      res.status(200).json(updatedSettings);
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  }
);

// Analytics routes
app.get("/api/events/:eventId/analytics", authenticateToken, async (req, res) => {
  try {
    const eventId = Number(req.params.eventId);
    const startDate = req.query.startDate
      ? new Date(req.query.startDate as string)
      : undefined;
    const endDate = req.query.endDate
      ? new Date(req.query.endDate as string)
      : undefined;
    
    const analytics = await storage.getAnalytics(eventId, startDate, endDate);
    res.status(200).json(analytics);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

app.get("/api/events/:eventId/stats", async (req, res) => {
  try {
    const eventId = Number(req.params.eventId);
    
    // Get today's analytics
    const analytics = await storage.getDailyAnalytics(eventId);
    
    // Get counts of photos by status
    const pending = await storage.getPendingPhotosCount(eventId);
    const approved = await storage.getApprovedPhotosCount(eventId);
    const rejected = await storage.getRejectedPhotosCount(eventId);
    const archived = await storage.getArchivedPhotosCount(eventId);
    
    // Increment the view count
    await storage.incrementAnalyticValue(eventId, "views");
    
    res.status(200).json({
      uploads: analytics?.uploads || 0,
      views: analytics?.views || 0,
      qrScans: analytics?.qrScans || 0,
      pending,
      approved,
      rejected,
      archived,
    });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

app.post("/api/events/:eventId/analytics/qr-scan", async (req, res) => {
  try {
    const eventId = Number(req.params.eventId);
    await storage.incrementAnalyticValue(eventId, "qrScans");
    res.status(200).json({ success: true });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Display routes
app.get("/api/events/:eventId/display", async (req, res) => {
  try {
    const eventId = Number(req.params.eventId);
    
    // Get the display settings for this event
    const settings = await storage.getDisplaySettings(eventId);
    if (!settings) {
      return res.status(404).json({ error: "Display settings not found" });
    }
    
    // Get all approved photos for this event
    const photos = await storage.getPhotos(eventId, "approved");
    
    // Sort photos by display order (with null safe comparison)
    photos.sort((a, b) => {
      const orderA = a.displayOrder || 0;
      const orderB = b.displayOrder || 0;
      return orderA - orderB;
    });
    
    res.status(200).json({
      settings,
      photos,
    });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

export default app;

export const startServer = () => {
  return app.listen(port, () => {
    console.log(`Server is running on port ${port}`);
  });
}; 