import { Event, Photo, DisplaySettings } from "@shared/schema";
import { ExtendedEvent } from "./extended-schema";

// Define the base URL for API requests
const API_BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:3000";

// Define response types
export interface ApiResponse<T> {
  data?: T;
  error?: string;
}

export interface StatsResponse {
  uploads: number;
  views: number;
  qrScans: number;
  pending: number;
  approved: number;
  rejected: number;
  archived: number;
}

export interface DisplayResponse {
  settings: DisplaySettings;
  photos: Photo[];
}

// API Client
class ApiClient {
  private token: string | null = null;

  constructor() {
    // Check for token in localStorage
    this.token = localStorage.getItem("auth_token");
  }

  setToken(token: string) {
    this.token = token;
    localStorage.setItem("auth_token", token);
  }

  clearToken() {
    this.token = null;
    localStorage.removeItem("auth_token");
  }

  private async request<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<ApiResponse<T>> {
    try {
      console.log(`Making request to ${API_BASE_URL}${endpoint}`);
      const headers: Record<string, string> = {
        "Content-Type": "application/json",
        ...options.headers as Record<string, string>,
      };

      if (this.token) {
        headers["Authorization"] = `Bearer ${this.token}`;
      }

      const response = await fetch(`${API_BASE_URL}${endpoint}`, {
        ...options,
        headers,
      });

      console.log(`Response from ${endpoint}:`, {
        status: response.status,
        statusText: response.statusText,
        headers: Object.fromEntries(Array.from(response.headers))
      });

      // For 204 No Content responses
      if (response.status === 204) {
        return {};
      }

      // Parse the response as JSON
      const data = await response.json();
      console.log(`Parsed data from ${endpoint}:`, data);

      // Check if the response was successful
      if (!response.ok) {
        console.error(`Error response from ${endpoint}:`, data);
        return { error: data.error || "An error occurred" };
      }

      return { data };
    } catch (error: any) {
      console.error(`Request error for ${endpoint}:`, error);
      return { error: error.message || "An error occurred" };
    }
  }

  // Auth methods
  async login(username: string, password: string): Promise<ApiResponse<string>> {
    const response = await this.request<{ token: string }>("/login", {
      method: "POST",
      body: JSON.stringify({ username, password }),
    });

    if (response.data?.token) {
      this.setToken(response.data.token);
      return { data: response.data.token };
    }

    return { error: response.error };
  }

  async register(
    username: string,
    password: string
  ): Promise<ApiResponse<void>> {
    return this.request<void>("/register", {
      method: "POST",
      body: JSON.stringify({ username, password }),
    });
  }

  // Event methods
  async getEvents(): Promise<ApiResponse<ExtendedEvent[]>> {
    console.log("ApiClient.getEvents() called");
    try {
      const response = await this.request<ExtendedEvent[]>("/api/events");
      console.log("ApiClient.getEvents() raw response:", response);
      return response;
    } catch (error) {
      console.error("ApiClient.getEvents() error:", error);
      return { error: error instanceof Error ? error.message : "Unknown error" };
    }
  }

  async getEvent(id: number): Promise<ApiResponse<ExtendedEvent>> {
    return this.request<ExtendedEvent>(`/api/events/${id}`);
  }

  async getEventBySlug(slug: string): Promise<ApiResponse<ExtendedEvent>> {
    return this.request<ExtendedEvent>(`/api/events/slug/${slug}`);
  }

  async createEvent(eventData: Partial<ExtendedEvent>): Promise<ApiResponse<ExtendedEvent>> {
    return this.request<ExtendedEvent>("/api/events", {
      method: "POST",
      body: JSON.stringify(eventData),
    });
  }

  async updateEvent(id: number, eventData: Partial<ExtendedEvent>): Promise<ApiResponse<ExtendedEvent>> {
    return this.request<ExtendedEvent>(`/api/events/${id}`, {
      method: "PUT",
      body: JSON.stringify(eventData),
    });
  }

  async deleteEvent(id: number): Promise<ApiResponse<void>> {
    return this.request<void>(`/api/events/${id}`, {
      method: "DELETE",
    });
  }

  // Photo methods
  async getPhotos(eventId: number, status?: string): Promise<ApiResponse<Photo[]>> {
    const url = status
      ? `/api/events/${eventId}/photos?status=${status}`
      : `/api/events/${eventId}/photos`;
    return this.request<Photo[]>(url);
  }

  async getRecentPhotos(eventId: number, limit = 5): Promise<ApiResponse<Photo[]>> {
    return this.request<Photo[]>(`/api/events/${eventId}/photos/recent?limit=${limit}`);
  }

  async getPhoto(id: number): Promise<ApiResponse<Photo>> {
    return this.request<Photo>(`/api/photos/${id}`);
  }

  async uploadPhoto(
    eventId: number,
    file: File,
    data: { submitterName?: string; caption?: string }
  ): Promise<ApiResponse<Photo>> {
    try {
      const formData = new FormData();
      formData.append("photo", file);

      if (data.submitterName) {
        formData.append("submitterName", data.submitterName);
      }

      if (data.caption) {
        formData.append("caption", data.caption);
      }

      const headers: Record<string, string> = {};
      if (this.token) {
        headers["Authorization"] = `Bearer ${this.token}`;
      }

      const response = await fetch(
        `${API_BASE_URL}/api/events/${eventId}/photos/upload`,
        {
          method: "POST",
          body: formData,
          headers,
        }
      );

      const responseData = await response.json();

      if (!response.ok) {
        return { error: responseData.error || "Failed to upload photo" };
      }

      return { data: responseData };
    } catch (error: any) {
      return { error: error.message || "An error occurred" };
    }
  }

  async updatePhotoStatus(
    id: number,
    status: string
  ): Promise<ApiResponse<Photo>> {
    return this.request<Photo>(`/api/photos/${id}/status`, {
      method: "PATCH",
      body: JSON.stringify({ status }),
    });
  }

  async updatePhotoDisplayOrder(
    id: number,
    displayOrder: number
  ): Promise<ApiResponse<Photo>> {
    return this.request<Photo>(`/api/photos/${id}/display-order`, {
      method: "PATCH",
      body: JSON.stringify({ displayOrder }),
    });
  }

  async batchUpdatePhotoOrder(
    orders: { photoId: number; displayOrder: number }[]
  ): Promise<ApiResponse<Photo[]>> {
    return this.request<Photo[]>(`/api/photos/batch-update-order`, {
      method: "POST",
      body: JSON.stringify({ orders }),
    });
  }

  // Display settings methods
  async getDisplaySettings(eventId: number): Promise<ApiResponse<DisplaySettings>> {
    return this.request<DisplaySettings>(`/api/events/${eventId}/display-settings`);
  }

  async updateDisplaySettings(
    eventId: number,
    settings: Partial<DisplaySettings>
  ): Promise<ApiResponse<DisplaySettings>> {
    return this.request<DisplaySettings>(`/api/events/${eventId}/display-settings`, {
      method: "PATCH",
      body: JSON.stringify(settings),
    });
  }

  async uploadBackgroundImage(
    eventId: number,
    file: File
  ): Promise<ApiResponse<DisplaySettings>> {
    try {
      const formData = new FormData();
      formData.append("image", file);

      const headers: HeadersInit = {};
      if (this.token) {
        headers["Authorization"] = `Bearer ${this.token}`;
      }

      const response = await fetch(
        `${API_BASE_URL}/api/events/${eventId}/display-settings/background`,
        {
          method: "POST",
          body: formData,
          headers,
        }
      );

      const data = await response.json();

      if (!response.ok) {
        return { error: data.error || "Failed to upload image" };
      }

      return { data };
    } catch (error: any) {
      return { error: error.message || "An error occurred" };
    }
  }

  async uploadLogoImage(
    eventId: number,
    file: File
  ): Promise<ApiResponse<DisplaySettings>> {
    try {
      const formData = new FormData();
      formData.append("image", file);

      const headers: HeadersInit = {};
      if (this.token) {
        headers["Authorization"] = `Bearer ${this.token}`;
      }

      const response = await fetch(
        `${API_BASE_URL}/api/events/${eventId}/display-settings/logo`,
        {
          method: "POST",
          body: formData,
          headers,
        }
      );

      const data = await response.json();

      if (!response.ok) {
        return { error: data.error || "Failed to upload image" };
      }

      return { data };
    } catch (error: any) {
      return { error: error.message || "An error occurred" };
    }
  }

  // Analytics methods
  async getStats(eventId: number): Promise<ApiResponse<StatsResponse>> {
    return this.request<StatsResponse>(`/api/events/${eventId}/stats`);
  }

  async recordQRScan(eventId: number): Promise<ApiResponse<void>> {
    return this.request<void>(`/api/events/${eventId}/analytics/qr-scan`, {
      method: "POST",
    });
  }

  // Display methods
  async getDisplayData(eventId: number): Promise<ApiResponse<DisplayResponse>> {
    return this.request<DisplayResponse>(`/api/events/${eventId}/display`);
  }
}

// Create and export a singleton instance
export const apiClient = new ApiClient();

// Helper function to ensure image paths are absolute
export function getFullImagePath(relativePath: string): string {
  if (!relativePath) return '';
  if (relativePath.startsWith('http')) return relativePath;
  
  // In development, we need to prepend the server URL
  return `http://localhost:3000${relativePath}`;
} 