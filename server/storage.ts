import { Photo, InsertPhoto, User, InsertUser, DisplaySettings, InsertDisplaySettings } from "@shared/schema";
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
  
  // Display settings methods
  getDisplaySettings(): Promise<DisplaySettings | undefined>;
  updateDisplaySettings(settings: Partial<DisplaySettings>): Promise<DisplaySettings>;
  uploadBackgroundImage(imagePath: string): Promise<DisplaySettings>;
}

export class MemStorage implements IStorage {
  private users: Map<number, User>;
  private photos: Map<number, Photo>;
  private displaySettings: DisplaySettings | null;
  private userId: number;
  private photoId: number;

  constructor() {
    this.users = new Map();
    this.photos = new Map();
    this.displaySettings = null;
    this.userId = 1;
    this.photoId = 1;
    
    // Initialize with default display settings
    this.displaySettings = {
      id: 1,
      backgroundPath: null,
      autoRotate: true,
      slideInterval: 8,
      showInfo: true,
      transitionEffect: "slide",
      blacklistWords: null,
      borderStyle: "none",
      borderWidth: 0,
      borderColor: "#ffffff",
      fontFamily: "Arial",
      fontColor: "#ffffff",
      updatedAt: new Date()
    };
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
      caption: insertPhoto.caption || null,
      submitterName: insertPhoto.submitterName || null,
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
      .sort((a, b) => {
        if (!a.createdAt || !b.createdAt) return 0;
        return b.createdAt.getTime() - a.createdAt.getTime();
      })
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

  // Display settings methods
  async getDisplaySettings(): Promise<DisplaySettings | undefined> {
    return this.displaySettings || undefined;
  }

  async updateDisplaySettings(settings: Partial<DisplaySettings>): Promise<DisplaySettings> {
    if (!this.displaySettings) {
      this.displaySettings = {
        id: 1,
        backgroundPath: null,
        autoRotate: true,
        slideInterval: 8,
        showInfo: true,
        transitionEffect: "slide",
        blacklistWords: null,
        borderStyle: "none",
        borderWidth: 0,
        borderColor: "#ffffff",
        fontFamily: "Arial",
        fontColor: "#ffffff",
        updatedAt: new Date()
      };
    }
    
    this.displaySettings = {
      ...this.displaySettings,
      ...settings,
      updatedAt: new Date()
    };
    
    return this.displaySettings;
  }

  async uploadBackgroundImage(imagePath: string): Promise<DisplaySettings> {
    return this.updateDisplaySettings({ backgroundPath: imagePath });
  }
}

export const storage = new MemStorage();
