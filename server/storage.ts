import { Photo, InsertPhoto, Transformation, InsertTransformation, TransformationSettings, InsertTransformationSettings, User, InsertUser } from "@shared/schema";
import * as fs from 'fs/promises';
import * as path from 'path';

export interface IStorage {
  // User methods
  getUser(id: number): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  
  // Photo methods
  getPhotos(status?: string): Promise<Photo[]>;
  getPhoto(id: number): Promise<Photo | undefined>;
  createPhoto(photo: InsertPhoto): Promise<Photo>;
  updatePhotoStatus(id: number, status: string): Promise<Photo | undefined>;
  getRecentPhotos(limit: number): Promise<Photo[]>;
  getPendingPhotosCount(): Promise<number>;
  getApprovedPhotosCount(): Promise<number>;
  getRejectedPhotosCount(): Promise<number>;
  
  // Transformation methods
  getTransformations(status?: string): Promise<Transformation[]>;
  getTransformation(id: number): Promise<Transformation | undefined>;
  createTransformation(transformation: InsertTransformation): Promise<Transformation>;
  updateTransformationStatus(id: number, status: string): Promise<Transformation | undefined>;
  getApprovedTransformationsCount(): Promise<number>;
  getPendingTransformationsCount(): Promise<number>;
  
  // TransformationSettings methods
  getAllTransformationSettings(): Promise<TransformationSettings[]>;
  getDefaultTransformationSettings(): Promise<TransformationSettings | undefined>;
  getTransformationSettings(id: number): Promise<TransformationSettings | undefined>;
  createTransformationSettings(settings: InsertTransformationSettings): Promise<TransformationSettings>;
  updateTransformationSettings(id: number, settings: Partial<TransformationSettings>): Promise<TransformationSettings | undefined>;
}

export class MemStorage implements IStorage {
  private users: Map<number, User>;
  private photos: Map<number, Photo>;
  private transformations: Map<number, Transformation>;
  private transformationSettings: Map<number, TransformationSettings>;
  private userId: number;
  private photoId: number;
  private transformationId: number;
  private transformationSettingsId: number;

  constructor() {
    this.users = new Map();
    this.photos = new Map();
    this.transformations = new Map();
    this.transformationSettings = new Map();
    this.userId = 1;
    this.photoId = 1;
    this.transformationId = 1;
    this.transformationSettingsId = 1;
    
    // Initialize with default transformation settings
    const defaultSettings: InsertTransformationSettings = {
      stylePreset: "Abstract Watercolor",
      promptTemplate: "Transform this image into an abstract watercolor with vibrant colors and flowing shapes, maintaining the original composition",
      effectIntensity: 7,
      isDefault: true
    };
    this.createTransformationSettings(defaultSettings);
    
    // Add more presets
    this.createTransformationSettings({
      stylePreset: "Neon Cyberpunk",
      promptTemplate: "Transform this image into a cyberpunk scene with neon lights, high contrast, and futuristic elements",
      effectIntensity: 8,
      isDefault: false
    });
    
    this.createTransformationSettings({
      stylePreset: "Vintage Film",
      promptTemplate: "Transform this image into a vintage film photograph with film grain, soft contrast, and a nostalgic color palette",
      effectIntensity: 6,
      isDefault: false
    });
    
    this.createTransformationSettings({
      stylePreset: "Comic Book",
      promptTemplate: "Transform this image into a comic book style with bold outlines, flat colors, and halftone patterns",
      effectIntensity: 9,
      isDefault: false
    });
    
    this.createTransformationSettings({
      stylePreset: "Oil Painting",
      promptTemplate: "Transform this image into an oil painting with textured brush strokes, rich colors, and classical composition",
      effectIntensity: 7,
      isDefault: false
    });
  }

  // User methods
  async getUser(id: number): Promise<User | undefined> {
    return this.users.get(id);
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(
      (user) => user.username === username,
    );
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const id = this.userId++;
    const user: User = { ...insertUser, id };
    this.users.set(id, user);
    return user;
  }

  // Photo methods
  async getPhotos(status?: string): Promise<Photo[]> {
    const photos = Array.from(this.photos.values());
    if (status) {
      return photos.filter(photo => photo.status === status);
    }
    return photos;
  }

  async getPhoto(id: number): Promise<Photo | undefined> {
    return this.photos.get(id);
  }

  async createPhoto(insertPhoto: InsertPhoto): Promise<Photo> {
    const id = this.photoId++;
    const photo: Photo = { 
      ...insertPhoto, 
      id, 
      status: "pending",
      createdAt: new Date()
    };
    this.photos.set(id, photo);
    return photo;
  }

  async updatePhotoStatus(id: number, status: string): Promise<Photo | undefined> {
    const photo = this.photos.get(id);
    if (!photo) return undefined;
    
    const updatedPhoto = { ...photo, status };
    this.photos.set(id, updatedPhoto);
    return updatedPhoto;
  }

  async getRecentPhotos(limit: number): Promise<Photo[]> {
    return Array.from(this.photos.values())
      .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())
      .slice(0, limit);
  }

  async getPendingPhotosCount(): Promise<number> {
    return Array.from(this.photos.values()).filter(photo => photo.status === "pending").length;
  }

  async getApprovedPhotosCount(): Promise<number> {
    return Array.from(this.photos.values()).filter(photo => photo.status === "approved").length;
  }

  async getRejectedPhotosCount(): Promise<number> {
    return Array.from(this.photos.values()).filter(photo => photo.status === "rejected").length;
  }

  // Transformation methods
  async getTransformations(status?: string): Promise<Transformation[]> {
    const transformations = Array.from(this.transformations.values());
    if (status) {
      return transformations.filter(t => t.status === status);
    }
    return transformations;
  }

  async getTransformation(id: number): Promise<Transformation | undefined> {
    return this.transformations.get(id);
  }

  async createTransformation(insertTransformation: InsertTransformation): Promise<Transformation> {
    const id = this.transformationId++;
    const transformation: Transformation = { 
      ...insertTransformation, 
      id,
      status: "pending",
      createdAt: new Date()
    };
    this.transformations.set(id, transformation);
    return transformation;
  }

  async updateTransformationStatus(id: number, status: string): Promise<Transformation | undefined> {
    const transformation = this.transformations.get(id);
    if (!transformation) return undefined;
    
    const updatedTransformation = { ...transformation, status };
    this.transformations.set(id, updatedTransformation);
    return updatedTransformation;
  }

  async getApprovedTransformationsCount(): Promise<number> {
    return Array.from(this.transformations.values()).filter(t => t.status === "approved").length;
  }

  async getPendingTransformationsCount(): Promise<number> {
    return Array.from(this.transformations.values()).filter(t => t.status === "pending").length;
  }

  // TransformationSettings methods
  async getAllTransformationSettings(): Promise<TransformationSettings[]> {
    return Array.from(this.transformationSettings.values());
  }

  async getDefaultTransformationSettings(): Promise<TransformationSettings | undefined> {
    return Array.from(this.transformationSettings.values()).find(settings => settings.isDefault);
  }
  
  async getTransformationSettings(id: number): Promise<TransformationSettings | undefined> {
    return this.transformationSettings.get(id);
  }

  async createTransformationSettings(insertSettings: InsertTransformationSettings): Promise<TransformationSettings> {
    const id = this.transformationSettingsId++;
    const settings: TransformationSettings = { ...insertSettings, id };
    
    // If this is marked as default, update any existing defaults
    if (settings.isDefault) {
      for (const [existingId, existingSettings] of this.transformationSettings.entries()) {
        if (existingSettings.isDefault) {
          this.transformationSettings.set(existingId, { ...existingSettings, isDefault: false });
        }
      }
    }
    
    this.transformationSettings.set(id, settings);
    return settings;
  }

  async updateTransformationSettings(id: number, partialSettings: Partial<TransformationSettings>): Promise<TransformationSettings | undefined> {
    const settings = this.transformationSettings.get(id);
    if (!settings) return undefined;
    
    const updatedSettings = { ...settings, ...partialSettings };
    
    // If this is being marked as default, update any existing defaults
    if (partialSettings.isDefault === true) {
      for (const [existingId, existingSettings] of this.transformationSettings.entries()) {
        if (existingId !== id && existingSettings.isDefault) {
          this.transformationSettings.set(existingId, { ...existingSettings, isDefault: false });
        }
      }
    }
    
    this.transformationSettings.set(id, updatedSettings);
    return updatedSettings;
  }
}

export const storage = new MemStorage();
