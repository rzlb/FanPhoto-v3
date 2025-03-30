import { Event } from "@shared/schema";

// Extended Event type with additional fields for frontend
export interface ExtendedEvent {
  id: number;
  name: string;
  slug: string;
  description: string | null;
  startDate: Date | string | null;
  endDate: Date | string | null;
  isActive: boolean;
  createdAt: Date | string;
  // Additional frontend-specific fields
  category: string;
  updatedAt?: Date | string | null;
} 