import { ThemeToggle } from "../ui/theme-toggle";
import { useState } from "react";
import { Button } from "../ui/button";
import { Menu, X } from "lucide-react";
import { Card } from "../ui/card";
import { useEvent } from "../../context/event-context";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../ui/select";

// Sidebar navigation component
function SidebarNav({ closeMenu }: { closeMenu: () => void }) {
  // Simplified sidebar navigation with default links
  return (
    <div className="px-4 py-2 space-y-1">
      <a 
        href="/admin/dashboard" 
        className="block px-4 py-2 text-sm rounded-md hover:bg-accent hover:text-accent-foreground"
        onClick={closeMenu}
      >
        Dashboard
      </a>
      <a 
        href="/admin/moderation" 
        className="block px-4 py-2 text-sm rounded-md hover:bg-accent hover:text-accent-foreground"
        onClick={closeMenu}
      >
        Moderation
      </a>
      <a 
        href="/admin/display-settings" 
        className="block px-4 py-2 text-sm rounded-md hover:bg-accent hover:text-accent-foreground"
        onClick={closeMenu}
      >
        Display Settings
      </a>
      <a 
        href="/admin/events" 
        className="block px-4 py-2 text-sm rounded-md hover:bg-accent hover:text-accent-foreground"
        onClick={closeMenu}
      >
        Events
      </a>
    </div>
  );
}

export function AdminLayout({ children }: { children: React.ReactNode }) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const { events, currentEvent, switchEvent } = useEvent();

  return (
    <div className="flex min-h-screen dark:bg-background">
      {/* Mobile sidebar toggle */}
      <div className="fixed top-4 left-4 z-50 lg:hidden">
        <Button
          size="icon"
          variant="outline"
          onClick={() => setSidebarOpen(!sidebarOpen)}
        >
          {sidebarOpen ? <X size={20} /> : <Menu size={20} />}
        </Button>
      </div>

      {/* Sidebar */}
      <div
        className={`fixed inset-y-0 z-40 flex w-72 flex-col ${
          sidebarOpen ? "left-0" : "-left-72"
        } lg:left-0 transition-all duration-300 ease-in-out`}
      >
        <Card className="h-full rounded-none shadow-xl border-r dark:border-border dark:bg-card">
          <div className="flex h-16 items-center justify-between px-4">
            <h1 className="text-xl font-bold dark:text-primary">FanPhoto Admin</h1>
            <ThemeToggle />
          </div>
          
          {/* Event Selector */}
          <div className="px-4 py-2">
            <Select
              value={currentEvent?.id?.toString()}
              onValueChange={(value) => switchEvent(Number(value))}
              disabled={events.length === 0}
            >
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Select an event" />
              </SelectTrigger>
              <SelectContent>
                {events.map((event) => (
                  <SelectItem key={event.id} value={event.id.toString()}>
                    {event.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          
          <SidebarNav closeMenu={() => setSidebarOpen(false)} />
        </Card>
      </div>

      {/* Overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 z-30 bg-black bg-opacity-50 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Main content */}
      <div className="flex flex-1 flex-col lg:pl-72">
        <main className="flex-1 p-4 sm:p-6 overflow-x-hidden">
          {children}
        </main>
      </div>
    </div>
  );
} 