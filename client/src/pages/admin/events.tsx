import { useState } from "react";
import { useEvent } from "@/context/event-context";
import { apiClient } from "@/api/api-client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { ExtendedEvent } from "@/api/extended-schema";
import { StyledCard } from "@/components/ui/styled-card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { toast } from "@/components/ui/use-toast";
import { Pencil, Trash2, Plus, CalendarIcon, Tags, ArrowUpDown } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter, DialogClose } from "@/components/ui/dialog";
import { format, parseISO } from "date-fns";
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

// Event form interface
interface EventFormData {
  name: string;
  slug: string;
  description: string;
  startDate: string;
  endDate: string;
  isActive: boolean;
  category: string;
}

// Event categories options
const EVENT_CATEGORIES = [
  { value: "rws-sports", label: "RWS Sports" },
  { value: "rws-sea", label: "RWS Sea" },
  { value: "rws-land", label: "RWS Land" },
  { value: "other", label: "Other" }
];

export default function EventsPage() {
  const { refreshEvents } = useEvent();
  const queryClient = useQueryClient();
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [currentEvent, setCurrentEvent] = useState<ExtendedEvent | null>(null);
  const [activeTab, setActiveTab] = useState("all");
  const [formData, setFormData] = useState<EventFormData>({
    name: "",
    slug: "",
    description: "",
    startDate: "",
    endDate: "",
    isActive: true,
    category: "other"
  });

  // Get all events
  const { data: events, isLoading, error } = useQuery({
    queryKey: ["events"],
    queryFn: async () => {
      console.log("Fetching events from API...");
      const response = await apiClient.getEvents();
      console.log("API response:", response);
      
      if (response.error) {
        console.error("API error:", response.error);
        throw new Error(response.error);
      }
      
      if (!response.data) {
        console.warn("No data returned from API");
        return [];
      }
      
      console.log("Events data received:", response.data);
      return response.data;
    }
  });

  // Create event mutation
  const createEventMutation = useMutation({
    mutationFn: async (data: EventFormData) => {
      const eventData = {
        name: data.name,
        slug: data.slug,
        description: data.description || null,
        startDate: data.startDate ? new Date(data.startDate) : null,
        endDate: data.endDate ? new Date(data.endDate) : null,
        isActive: data.isActive,
        category: data.category || "other"
      };
      
      const response = await apiClient.createEvent(eventData);
      if (response.error) throw new Error(response.error);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["events"] });
      refreshEvents();
      setIsCreateDialogOpen(false);
      toast({
        title: "Event created",
        description: "The event was successfully created."
      });
      resetForm();
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive"
      });
    }
  });

  // Update event mutation
  const updateEventMutation = useMutation({
    mutationFn: async (data: { id: number, event: EventFormData }) => {
      const eventData = {
        name: data.event.name,
        slug: data.event.slug,
        description: data.event.description || null,
        startDate: data.event.startDate ? new Date(data.event.startDate) : null,
        endDate: data.event.endDate ? new Date(data.event.endDate) : null,
        isActive: data.event.isActive,
        category: data.event.category || "other"
      };
      
      const response = await apiClient.updateEvent(data.id, eventData);
      if (response.error) throw new Error(response.error);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["events"] });
      refreshEvents();
      setIsEditDialogOpen(false);
      toast({
        title: "Event updated",
        description: "The event was successfully updated."
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive"
      });
    }
  });

  // Delete event mutation
  const deleteEventMutation = useMutation({
    mutationFn: async (id: number) => {
      const response = await apiClient.deleteEvent(id);
      if (response.error) throw new Error(response.error);
      return id;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["events"] });
      refreshEvents();
      setIsDeleteDialogOpen(false);
      toast({
        title: "Event deleted",
        description: "The event was successfully deleted."
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive"
      });
    }
  });

  // Form handlers
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSwitchChange = (checked: boolean) => {
    setFormData((prev) => ({ ...prev, isActive: checked }));
  };

  const handleSelectChange = (name: string, value: string) => {
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleCreateEvent = (e: React.FormEvent) => {
    e.preventDefault();
    createEventMutation.mutate(formData);
  };

  const handleUpdateEvent = (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentEvent) return;
    
    updateEventMutation.mutate({
      id: currentEvent.id,
      event: formData
    });
  };

  const handleDeleteEvent = () => {
    if (!currentEvent) return;
    deleteEventMutation.mutate(currentEvent.id);
  };

  const openEditDialog = (event: ExtendedEvent) => {
    setCurrentEvent(event);
    setFormData({
      name: event.name,
      slug: event.slug,
      description: event.description || "",
      startDate: event.startDate ? format(new Date(event.startDate), "yyyy-MM-dd") : "",
      endDate: event.endDate ? format(new Date(event.endDate), "yyyy-MM-dd") : "",
      isActive: event.isActive || false,
      category: event.category || "other"
    });
    setIsEditDialogOpen(true);
  };

  const openDeleteDialog = (event: ExtendedEvent) => {
    setCurrentEvent(event);
    setIsDeleteDialogOpen(true);
  };

  const resetForm = () => {
    setFormData({
      name: "",
      slug: "",
      description: "",
      startDate: "",
      endDate: "",
      isActive: true,
      category: "other"
    });
    setCurrentEvent(null);
  };

  // Generate a slug from the name
  const generateSlug = () => {
    const slug = formData.name
      .toLowerCase()
      .trim()
      .replace(/[^\w\s-]/g, '')
      .replace(/[\s_-]+/g, '-')
      .replace(/^-+|-+$/g, '');
    
    setFormData(prev => ({ ...prev, slug }));
  };

  const formatDate = (dateStr: string | Date | null) => {
    if (!dateStr) return null;
    try {
      const date = typeof dateStr === 'string' ? parseISO(dateStr) : dateStr;
      return format(date, "PPP");
    } catch (e) {
      return "Invalid date";
    }
  };

  // Filter events based on active tab
  const filteredEvents = events ? events.filter(event => {
    if (activeTab === 'all') return true;
    if (activeTab === 'active') return event.isActive;
    if (activeTab === 'inactive') return !event.isActive;
    return event.category === activeTab;
  }) : [];

  // Get category color class
  const getCategoryColorClass = (category: string) => {
    switch(category) {
      case 'competition':
        return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-100';
      case 'conference':
        return 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-100';
      case 'exhibition':
        return 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-100';
      case 'meeting':
        return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-100';
      default:
        return 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-100';
    }
  };

  // Get unique categories from events
  const getCategories = () => {
    if (!events) return [];
    const categories = [...new Set(events.map(event => event.category || 'other'))];
    return categories;
  };

  if (isLoading) {
    return <div className="p-8 text-center">Loading events...</div>;
  }

  if (error) {
    return <div className="p-8 text-center text-red-500">Error loading events: {(error as Error).message}</div>;
  }

  return (
    <div className="content-container space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold text-foreground">Events</h1>
        <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="mr-2 h-4 w-4" /> Create Event
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Create New Event</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleCreateEvent} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="name">Event Name</Label>
                <Input 
                  id="name" 
                  name="name" 
                  value={formData.name} 
                  onChange={handleInputChange} 
                  onBlur={generateSlug}
                  required 
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="slug">Slug</Label>
                <Input 
                  id="slug" 
                  name="slug" 
                  value={formData.slug} 
                  onChange={handleInputChange} 
                  required 
                />
                <p className="text-xs text-muted-foreground">Used in URLs, must be unique</p>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="description">Description</Label>
                <Textarea 
                  id="description" 
                  name="description" 
                  value={formData.description} 
                  onChange={handleInputChange} 
                  rows={3} 
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="category">Category</Label>
                  <Select
                    value={formData.category}
                    onValueChange={(value) => handleSelectChange('category', value)}
                  >
                    <SelectTrigger id="category">
                      <SelectValue placeholder="Select category" />
                    </SelectTrigger>
                    <SelectContent>
                      {EVENT_CATEGORIES.map(category => (
                        <SelectItem key={category.value} value={category.value}>
                          {category.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="startDate">Start Date</Label>
                  <Input 
                    id="startDate" 
                    name="startDate" 
                    type="date" 
                    value={formData.startDate} 
                    onChange={handleInputChange} 
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="endDate">End Date</Label>
                  <Input 
                    id="endDate" 
                    name="endDate" 
                    type="date" 
                    value={formData.endDate} 
                    onChange={handleInputChange} 
                  />
                </div>
              </div>
              
              <div className="flex items-center space-x-2 pt-2">
                <Switch 
                  id="isActive" 
                  checked={formData.isActive} 
                  onCheckedChange={handleSwitchChange}
                />
                <Label htmlFor="isActive">Active</Label>
              </div>
              
              <DialogFooter>
                <DialogClose asChild>
                  <Button variant="outline" type="button">Cancel</Button>
                </DialogClose>
                <Button type="submit" disabled={createEventMutation.isPending}>
                  {createEventMutation.isPending ? "Creating..." : "Create Event"}
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>
      
      <Tabs defaultValue="all" value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="mb-4">
          <TabsTrigger value="all">All Events</TabsTrigger>
          <TabsTrigger value="active">Active</TabsTrigger>
          <TabsTrigger value="inactive">Inactive</TabsTrigger>
          {getCategories().map(category => (
            <TabsTrigger key={category} value={category}>
              {category.charAt(0).toUpperCase() + category.slice(1)}
            </TabsTrigger>
          ))}
        </TabsList>
        
        <TabsContent value={activeTab} className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {filteredEvents.length > 0 ? (
              filteredEvents.map((event) => (
                <StyledCard key={event.id} className="relative">
                  <div className="p-6">
                    <div className="flex items-start justify-between">
                      <div>
                        <h3 className="text-lg font-semibold">{event.name}</h3>
                        <p className="text-sm text-muted-foreground">/{event.slug}</p>
                      </div>
                      <div className={`px-2 py-1 rounded-full text-xs ${event.isActive ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-100' : 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-100'}`}>
                        {event.isActive ? 'Active' : 'Inactive'}
                      </div>
                    </div>
                    
                    {event.description && (
                      <p className="mt-2 text-sm text-foreground">{event.description}</p>
                    )}
                    
                    <div className="mt-3 flex items-center gap-2">
                      {event.category && (
                        <Badge variant="outline" className={getCategoryColorClass(event.category)}>
                          <Tags className="mr-1 h-3 w-3" />
                          {event.category.charAt(0).toUpperCase() + event.category.slice(1)}
                        </Badge>
                      )}
                    </div>
                    
                    <div className="mt-4 text-xs text-muted-foreground">
                      {event.startDate && (
                        <div>
                          Start: {formatDate(event.startDate)}
                        </div>
                      )}
                      {event.endDate && (
                        <div>
                          End: {formatDate(event.endDate)}
                        </div>
                      )}
                      <div>
                        Created: {formatDate(event.createdAt)}
                      </div>
                    </div>
                    
                    <div className="mt-4 flex space-x-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => openEditDialog(event)}
                      >
                        <Pencil className="mr-2 h-3.5 w-3.5" />
                        Edit
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => openDeleteDialog(event)}
                        className="text-destructive hover:text-destructive"
                      >
                        <Trash2 className="mr-2 h-3.5 w-3.5" />
                        Delete
                      </Button>
                    </div>
                  </div>
                </StyledCard>
              ))
            ) : (
              <div className="col-span-full p-6 text-center border rounded-lg">
                No events found in this category. Create your first event to get started.
              </div>
            )}
          </div>
        </TabsContent>
      </Tabs>
      
      {/* Edit Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Event</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleUpdateEvent} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="edit-name">Event Name</Label>
              <Input 
                id="edit-name" 
                name="name" 
                value={formData.name} 
                onChange={handleInputChange}
                onBlur={generateSlug}
                required 
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="edit-slug">Slug</Label>
              <Input 
                id="edit-slug" 
                name="slug" 
                value={formData.slug} 
                onChange={handleInputChange} 
                required 
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="edit-description">Description</Label>
              <Textarea 
                id="edit-description" 
                name="description" 
                value={formData.description} 
                onChange={handleInputChange} 
                rows={3} 
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="edit-category">Category</Label>
                <Select
                  value={formData.category}
                  onValueChange={(value) => handleSelectChange('category', value)}
                >
                  <SelectTrigger id="edit-category">
                    <SelectValue placeholder="Select category" />
                  </SelectTrigger>
                  <SelectContent>
                    {EVENT_CATEGORIES.map(category => (
                      <SelectItem key={category.value} value={category.value}>
                        {category.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="edit-startDate">Start Date</Label>
                <Input 
                  id="edit-startDate" 
                  name="startDate" 
                  type="date" 
                  value={formData.startDate} 
                  onChange={handleInputChange} 
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="edit-endDate">End Date</Label>
                <Input 
                  id="edit-endDate" 
                  name="endDate" 
                  type="date" 
                  value={formData.endDate} 
                  onChange={handleInputChange} 
                />
              </div>
            </div>
            
            <div className="flex items-center space-x-2">
              <Switch 
                id="edit-isActive" 
                checked={formData.isActive} 
                onCheckedChange={handleSwitchChange} 
              />
              <Label htmlFor="edit-isActive">Active</Label>
            </div>
            
            <DialogFooter>
              <DialogClose asChild>
                <Button variant="outline" type="button">Cancel</Button>
              </DialogClose>
              <Button type="submit" disabled={updateEventMutation.isPending}>
                {updateEventMutation.isPending ? "Saving..." : "Save Changes"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
      
      {/* Delete Confirmation Dialog */}
      <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Event</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <p>Are you sure you want to delete the event "{currentEvent?.name}"?</p>
            <p className="text-sm text-destructive">This action cannot be undone.</p>
            
            <DialogFooter>
              <DialogClose asChild>
                <Button variant="outline" type="button">Cancel</Button>
              </DialogClose>
              <Button 
                variant="destructive" 
                onClick={handleDeleteEvent}
                disabled={deleteEventMutation.isPending}
              >
                {deleteEventMutation.isPending ? "Deleting..." : "Delete Event"}
              </Button>
            </DialogFooter>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
} 