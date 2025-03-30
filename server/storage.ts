import { Photo, InsertPhoto, User, InsertUser, DisplaySettings, InsertDisplaySettings, Analytics, InsertAnalytics, Event, InsertEvent } from "@shared/schema";
import * as fs from 'fs/promises';
import * as path from 'path';

export interface IStorage {
  // User methods
  getUser(id: number): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  
  // Event methods
  getEvents(): Promise<Event[]>;
  getEvent(id: number): Promise<Event | undefined>;
  getEventBySlug(slug: string): Promise<Event | undefined>;
  createEvent(event: InsertEvent): Promise<Event>;
  updateEvent(id: number, event: Partial<InsertEvent>): Promise<Event | undefined>;
  deleteEvent(id: number): Promise<boolean>;
  
  // Photo methods
  getPhotos(eventId: number, status?: string): Promise<Photo[]>;
  getPhoto(id: number): Promise<Photo | undefined>;
  createPhoto(photo: InsertPhoto): Promise<Photo>;
  updatePhotoStatus(id: number, status: string): Promise<Photo | undefined>;
  updatePhotoDisplayOrder(id: number, displayOrder: number): Promise<Photo | undefined>;
  updatePhotosDisplayOrder(orders: {photoId: number, displayOrder: number}[]): Promise<Photo[]>;
  getRecentPhotos(eventId: number, limit: number): Promise<Photo[]>;
  getPendingPhotosCount(eventId?: number): Promise<number>;
  getApprovedPhotosCount(eventId?: number): Promise<number>;
  getRejectedPhotosCount(eventId?: number): Promise<number>;
  getArchivedPhotosCount(eventId?: number): Promise<number>;
  
  // Display settings methods
  getDisplaySettings(eventId: number): Promise<DisplaySettings | undefined>;
  updateDisplaySettings(settings: Partial<DisplaySettings>): Promise<DisplaySettings>;
  uploadBackgroundImage(eventId: number, imagePath: string): Promise<DisplaySettings>;
  uploadLogoImage(eventId: number, imagePath: string): Promise<DisplaySettings>;
  
  // Analytics methods
  getAnalytics(eventId: number, startDate?: Date, endDate?: Date): Promise<Analytics[]>;
  getDailyAnalytics(eventId: number): Promise<Analytics | undefined>;
  incrementAnalyticValue(
    field: 'uploads' | 'views' | 'qrScans' | 'approved' | 'rejected' | 'archived', 
    amount?: number,
    eventId?: number
  ): Promise<void>;
}

export class MemStorage implements IStorage {
  private users: Map<number, User>;
  private events: Map<number, Event>;
  private photos: Map<number, Photo>;
  private displaySettings: Map<number, DisplaySettings>; // Map for multiple event display settings
  private analytics: Map<string, Analytics>;
  private userId: number;
  private eventId: number;
  private photoId: number;
  private analyticsId: number;
  private displaySettingsId: number;

  constructor() {
    this.users = new Map();
    this.events = new Map();
    this.photos = new Map();
    this.displaySettings = new Map();
    this.analytics = new Map();
    this.userId = 1;
    this.eventId = 1;
    this.photoId = 1;
    this.analyticsId = 1;
    this.displaySettingsId = 1;
    
    // Create a default event
    const defaultEvent: Event = {
      id: this.eventId++,
      name: "Default Event",
      slug: "default",
      description: "Default event created on initialization",
      startDate: new Date(),
      endDate: null,
      isActive: true,
      createdAt: new Date()
    };
    this.events.set(defaultEvent.id, defaultEvent);
    
    // Initialize with default display settings for the default event
    const defaultSettings: DisplaySettings = {
      id: this.displaySettingsId++,
      eventId: defaultEvent.id,
      backgroundPath: null,
      logoPath: null,
      displayFormat: "16:9-default",
      autoRotate: true,
      slideInterval: 8,
      showInfo: true,
      showCaptions: true,
      separateCaptions: false,
      transitionEffect: "slide",
      blacklistWords: null,
      borderStyle: "none",
      borderWidth: 0,
      borderColor: "#ffffff",
      fontFamily: "Arial",
      fontColor: "#ffffff",
      fontSize: 16,
      imagePosition: "center",
      captionBgColor: "rgba(0,0,0,0.5)",
      captionFontFamily: "Arial",
      captionFontColor: "#ffffff",
      captionFontSize: 14,
      textPosition: "overlay-bottom",
      textAlignment: "center",
      textPadding: 10,
      textMaxWidth: "full",
      textBackground: true,
      textBackgroundColor: "#000000",
      textBackgroundOpacity: 50,
      updatedAt: new Date()
    };
    this.displaySettings.set(defaultEvent.id, defaultSettings);
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

  // Event methods
  async getEvents(): Promise<Event[]> {
    const events = Array.from(this.events.values());
    console.log("MemStorage.getEvents returning:", events);
    return events;
  }

  async getEvent(id: number): Promise<Event | undefined> {
    return this.events.get(id);
  }

  async getEventBySlug(slug: string): Promise<Event | undefined> {
    return Array.from(this.events.values()).find(event => event.slug === slug);
  }

  async createEvent(insertEvent: InsertEvent): Promise<Event> {
    const id = this.eventId++;
    const event: Event = { 
      ...insertEvent, 
      id, 
      createdAt: new Date(),
      startDate: insertEvent.startDate ? new Date(insertEvent.startDate) : null,
      endDate: insertEvent.endDate ? new Date(insertEvent.endDate) : null,
      isActive: insertEvent.isActive ?? true,
      description: insertEvent.description ?? null
    };
    this.events.set(id, event);

    // Create default display settings for the new event
    const defaultSettings: DisplaySettings = {
      id: this.displaySettingsId++,
      eventId: event.id,
      backgroundPath: null,
      logoPath: null,
      displayFormat: "16:9-default",
      autoRotate: true,
      slideInterval: 8,
      showInfo: true,
      showCaptions: true,
      separateCaptions: false,
      transitionEffect: "slide",
      blacklistWords: null,
      borderStyle: "none",
      borderWidth: 0,
      borderColor: "#ffffff",
      fontFamily: "Arial",
      fontColor: "#ffffff",
      fontSize: 16,
      imagePosition: "center",
      captionBgColor: "rgba(0,0,0,0.5)",
      captionFontFamily: "Arial",
      captionFontColor: "#ffffff",
      captionFontSize: 14,
      textPosition: "overlay-bottom",
      textAlignment: "center",
      textPadding: 10,
      textMaxWidth: "full",
      textBackground: true,
      textBackgroundColor: "#000000",
      textBackgroundOpacity: 50,
      updatedAt: new Date()
    };
    this.displaySettings.set(event.id, defaultSettings);
    
    return event;
  }

  async updateEvent(id: number, updateEvent: Partial<InsertEvent>): Promise<Event | undefined> {
    const event = this.events.get(id);
    if (!event) return undefined;
    
    const updatedEvent: Event = { 
      ...event,
      ...updateEvent,
      startDate: updateEvent.startDate ? new Date(updateEvent.startDate) : event.startDate,
      endDate: updateEvent.endDate ? new Date(updateEvent.endDate) : event.endDate
    };
    
    this.events.set(id, updatedEvent);
    return updatedEvent;
  }

  async deleteEvent(id: number): Promise<boolean> {
    return this.events.delete(id);
  }

  // Photo methods
  async getPhotos(eventId: number, status?: string): Promise<Photo[]> {
    const photos = Array.from(this.photos.values()).filter(photo => photo.eventId === eventId);
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
      displayOrder: 0,
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

  async updatePhotoDisplayOrder(id: number, displayOrder: number): Promise<Photo | undefined> {
    const photo = this.photos.get(id);
    if (!photo) return undefined;
    
    const updatedPhoto = { ...photo, displayOrder };
    this.photos.set(id, updatedPhoto);
    return updatedPhoto;
  }

  async updatePhotosDisplayOrder(orders: {photoId: number, displayOrder: number}[]): Promise<Photo[]> {
    const updatedPhotos: Photo[] = [];

    for (const order of orders) {
      const photo = this.photos.get(order.photoId);
      if (photo) {
        const updatedPhoto = { ...photo, displayOrder: order.displayOrder };
        this.photos.set(order.photoId, updatedPhoto);
        updatedPhotos.push(updatedPhoto);
      }
    }

    return updatedPhotos;
  }

  async getRecentPhotos(eventId: number, limit: number): Promise<Photo[]> {
    return Array.from(this.photos.values())
      .filter(photo => photo.eventId === eventId)
      .sort((a, b) => {
        if (!a.createdAt || !b.createdAt) return 0;
        return b.createdAt.getTime() - a.createdAt.getTime();
      })
      .slice(0, limit);
  }

  async getPendingPhotosCount(eventId?: number): Promise<number> {
    const photos = Array.from(this.photos.values());
    return photos.filter(photo => 
      (eventId === undefined || photo.eventId === eventId) && 
      photo.status === "pending"
    ).length;
  }

  async getApprovedPhotosCount(eventId?: number): Promise<number> {
    const photos = Array.from(this.photos.values());
    return photos.filter(photo => 
      (eventId === undefined || photo.eventId === eventId) && 
      photo.status === "approved"
    ).length;
  }

  async getRejectedPhotosCount(eventId?: number): Promise<number> {
    const photos = Array.from(this.photos.values());
    return photos.filter(photo => 
      (eventId === undefined || photo.eventId === eventId) && 
      photo.status === "rejected"
    ).length;
  }

  async getArchivedPhotosCount(eventId?: number): Promise<number> {
    const photos = Array.from(this.photos.values());
    return photos.filter(photo => 
      (eventId === undefined || photo.eventId === eventId) && 
      photo.status === "archived"
    ).length;
  }

  // Display settings methods
  async getDisplaySettings(eventId: number): Promise<DisplaySettings | undefined> {
    return this.displaySettings.get(eventId);
  }

  async updateDisplaySettings(settings: Partial<DisplaySettings>): Promise<DisplaySettings> {
    if (!settings.eventId) {
      throw new Error("Event ID is required for display settings");
    }
    
    let currentSettings = this.displaySettings.get(settings.eventId);
    
    if (!currentSettings) {
      // Create new settings for this event if they don't exist
      currentSettings = {
        id: this.displaySettingsId++,
        eventId: settings.eventId,
        backgroundPath: null,
        logoPath: null,
        displayFormat: "16:9-default",
        autoRotate: true,
        slideInterval: 8,
        showInfo: true,
        showCaptions: true,
        separateCaptions: false,
        transitionEffect: "slide",
        blacklistWords: null,
        borderStyle: "none",
        borderWidth: 0,
        borderColor: "#ffffff",
        fontFamily: "Arial",
        fontColor: "#ffffff",
        fontSize: 16,
        imagePosition: "center",
        captionBgColor: "rgba(0,0,0,0.5)",
        captionFontFamily: "Arial",
        captionFontColor: "#ffffff",
        captionFontSize: 14,
        textPosition: "overlay-bottom",
        textAlignment: "center",
        textPadding: 10,
        textMaxWidth: "full",
        textBackground: true,
        textBackgroundColor: "#000000",
        textBackgroundOpacity: 50,
        updatedAt: new Date()
      };
    }
    
    const updatedSettings = {
      ...currentSettings,
      ...settings,
      updatedAt: new Date()
    };
    
    this.displaySettings.set(settings.eventId, updatedSettings);
    return updatedSettings;
  }

  async uploadBackgroundImage(eventId: number, imagePath: string): Promise<DisplaySettings> {
    let settings = await this.getDisplaySettings(eventId);
    if (!settings) {
      throw new Error(`No display settings found for event ${eventId}`);
    }
    
    return this.updateDisplaySettings({ 
      eventId, 
      backgroundPath: imagePath 
    });
  }
  
  async uploadLogoImage(eventId: number, imagePath: string): Promise<DisplaySettings> {
    let settings = await this.getDisplaySettings(eventId);
    if (!settings) {
      throw new Error(`No display settings found for event ${eventId}`);
    }
    
    return this.updateDisplaySettings({ 
      eventId, 
      logoPath: imagePath 
    });
  }
  
  // Analytics methods
  async getAnalytics(eventId: number, startDate?: Date, endDate?: Date): Promise<Analytics[]> {
    let analytics = Array.from(this.analytics.values())
      .filter(entry => entry.eventId === eventId);
    
    if (startDate) {
      analytics = analytics.filter(entry => entry.date >= startDate);
    }
    
    if (endDate) {
      analytics = analytics.filter(entry => entry.date <= endDate);
    }
    
    return analytics.sort((a, b) => a.date.getTime() - b.date.getTime());
  }
  
  async getDailyAnalytics(eventId: number): Promise<Analytics | undefined> {
    const today = new Date();
    const dateKey = `${eventId}-${today.getFullYear()}-${today.getMonth() + 1}-${today.getDate()}`;
    
    // If we don't have an entry for today, create one
    if (!this.analytics.has(dateKey)) {
      const newAnalytics: Analytics = {
        id: this.analyticsId++,
        eventId: eventId,
        date: today,
        uploads: 0,
        views: 0,
        qrScans: 0,
        approved: 0,
        rejected: 0,
        archived: 0
      };
      this.analytics.set(dateKey, newAnalytics);
    }
    
    return this.analytics.get(dateKey);
  }
  
  async incrementAnalyticValue(
    field: 'uploads' | 'views' | 'qrScans' | 'approved' | 'rejected' | 'archived', 
    amount?: number,
    eventId?: number
  ): Promise<void> {
    // Use default values
    const actualAmount = amount ?? 1;
    const actualEventId = eventId ?? 1;

    // Get today's analytics
    const today = new Date();
    const dateKey = `${actualEventId}-${today.getFullYear()}-${today.getMonth() + 1}-${today.getDate()}`;
    
    // If we don't have an entry for today, create one
    if (!this.analytics.has(dateKey)) {
      const newAnalytics: Analytics = {
        id: this.analyticsId++,
        eventId: actualEventId,
        date: today,
        uploads: 0,
        views: 0,
        qrScans: 0,
        approved: 0,
        rejected: 0,
        archived: 0
      };
      this.analytics.set(dateKey, newAnalytics);
    }
    
    // Increment the value
    const analytics = this.analytics.get(dateKey)!;
    analytics[field] += actualAmount;
    
    // Save back to the map
    this.analytics.set(dateKey, analytics);
  }
}

export const storage = new MemStorage();
