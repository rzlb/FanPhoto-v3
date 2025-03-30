import { createContext, useContext, useEffect, useState, ReactNode } from "react";
import { Event } from "@shared/schema";
import { ExtendedEvent } from "../api/extended-schema";
import { apiClient } from "../api/api-client";

interface EventContextType {
  events: ExtendedEvent[];
  currentEvent: ExtendedEvent | null;
  isLoading: boolean;
  error: string | null;
  setCurrentEvent: (event: ExtendedEvent) => void;
  switchEvent: (eventId: number) => Promise<void>;
  refreshEvents: () => Promise<void>;
}

const EventContext = createContext<EventContextType | undefined>(undefined);

export function EventProvider({ children }: { children: ReactNode }) {
  const [events, setEvents] = useState<ExtendedEvent[]>([]);
  const [currentEvent, setCurrentEvent] = useState<ExtendedEvent | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const refreshEvents = async () => {
    setIsLoading(true);
    setError(null);
    
    try {
      console.log("Fetching events...");
      const response = await apiClient.getEvents();
      console.log("Events response:", response);
      
      if (response.error) {
        console.error("Error fetching events:", response.error);
        setError(response.error);
        return;
      }
      
      if (response.data) {
        console.log("Events data:", response.data);
        // Transform data to ensure it matches ExtendedEvent interface
        const extendedEvents: ExtendedEvent[] = response.data.map(event => ({
          ...event,
          category: event.category || 'other',
          updatedAt: event.updatedAt || null
        }));
        // Even if the response is empty, set it to the state
        setEvents(extendedEvents);
        
        // If no current event is set and we have events, set the first one as current
        if (!currentEvent && extendedEvents.length > 0) {
          setCurrentEvent(extendedEvents[0]);
        }
      } else {
        console.log("No events data returned");
        // If there's no data, set empty array
        setEvents([]);
      }
    } catch (err: any) {
      console.error("Error in refreshEvents:", err);
      setError(err.message || "Failed to fetch events");
    } finally {
      setIsLoading(false);
    }
  };

  const switchEvent = async (eventId: number) => {
    setIsLoading(true);
    setError(null);
    
    try {
      const response = await apiClient.getEvent(eventId);
      
      if (response.error) {
        setError(response.error);
        return;
      }
      
      if (response.data) {
        // Transform to extended event
        const extendedEvent: ExtendedEvent = {
          ...response.data,
          category: response.data.category || 'other',
          updatedAt: response.data.updatedAt || null
        };
        setCurrentEvent(extendedEvent);
      }
    } catch (err: any) {
      setError(err.message || "Failed to switch event");
    } finally {
      setIsLoading(false);
    }
  };

  // Initialize events on first load
  useEffect(() => {
    refreshEvents();
  }, []);

  return (
    <EventContext.Provider
      value={{
        events,
        currentEvent,
        isLoading,
        error,
        setCurrentEvent,
        switchEvent,
        refreshEvents,
      }}
    >
      {children}
    </EventContext.Provider>
  );
}

// Fix the named export to be compatible with React Fast Refresh 
export const useEvent = () => {
  const context = useContext(EventContext);
  if (context === undefined) {
    throw new Error("useEvent must be used within an EventProvider");
  }
  return context;
} 