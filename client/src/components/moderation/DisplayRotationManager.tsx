import React, { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { 
  DndContext, 
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent
} from "@dnd-kit/core";
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { Loader2, X, Pause, Play, GripVertical } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";

import { useToast } from "@/hooks/use-toast";

interface Photo {
  id: number;
  originalPath: string;
  submitterName: string | null;
  caption: string | null;
  status: string;
  displayOrder: number;
  createdAt: string | Date;
}

interface DisplayImage {
  id: number;
  originalPath: string;
  submitterName: string;
  caption?: string;
  displayOrder?: number;
  createdAt: string | Date;
}

// SortableItem component for each photo in the list
function SortableItem({ image, index, currentIndex, setCurrentIndex, isPaused }: {
  image: DisplayImage;
  index: number;
  currentIndex: number | null;
  setCurrentIndex: (index: number | null) => void;
  isPaused: boolean;
}) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition
  } = useSortable({ id: image.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`border rounded-md p-3 bg-background flex items-center space-x-3 ${
        currentIndex === index ? "ring-2 ring-primary" : ""
      }`}
      {...attributes}
    >
      <div className="flex-shrink-0 cursor-grab" {...listeners}>
        <GripVertical className="h-5 w-5 text-muted-foreground" />
      </div>
      <div className="flex-shrink-0 h-16 w-16 relative">
        <img
          src={image.originalPath}
          alt={`Photo by ${image.submitterName}`}
          className="h-full w-full object-cover rounded-md"
        />
        <Badge className="absolute -top-2 -left-2 text-xs">
          {index + 1}
        </Badge>
      </div>
      <div className="flex-grow overflow-hidden">
        <div className="font-medium truncate">{image.submitterName}</div>
        {image.caption && (
          <p className="text-sm text-muted-foreground truncate">
            {image.caption}
          </p>
        )}
      </div>
      <div className="flex-shrink-0 flex space-x-1">
        {currentIndex === index ? (
          <Button
            variant="outline" 
            size="icon"
            onClick={() => setCurrentIndex(null)}
            title="Deselect as current image"
          >
            <X className="h-4 w-4" />
          </Button>
        ) : (
          <Button
            variant="outline" 
            size="icon"
            onClick={() => setCurrentIndex(index)}
            title="Set as current image"
          >
            {isPaused ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
          </Button>
        )}
      </div>
    </div>
  );
}

export default function DisplayRotationManager() {
  const [currentIndex, setCurrentIndex] = useState<number | null>(null);
  const [isPaused, setIsPaused] = useState(false);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Set up sensors for drag and drop
  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  // Fetch approved photos for display rotation
  const { data: displayImages, isLoading } = useQuery<DisplayImage[]>({
    queryKey: ['/api/display/images'],
    refetchInterval: 30000, // Refetch every 30 seconds
    staleTime: 15000, // Consider stale after 15 seconds
  });

  // Mutation for reordering photos
  const reorderMutation = useMutation({
    mutationFn: async (reorderData: { photoOrders: { photoId: number; displayOrder: number }[] }) => {
      const response = await fetch('/api/photos/reorder', {
        method: 'POST',
        body: JSON.stringify(reorderData),
        headers: {
          'Content-Type': 'application/json',
        },
      });
      
      if (!response.ok) {
        throw new Error('Failed to update photo order');
      }
      
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/display/images'] });
      toast({
        title: "Display order updated",
        description: "The display rotation order has been updated successfully.",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Failed to update display order",
        description: error.message || "There was an error updating the display rotation order.",
        variant: "destructive",
      });
    },
  });

  // Handle drag and drop to reorder photos
  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    
    if (!over || !displayImages || active.id === over.id) {
      return;
    }
    
    const oldIndex = displayImages.findIndex(item => item.id === active.id);
    const newIndex = displayImages.findIndex(item => item.id === over.id);
    
    if (oldIndex !== newIndex) {
      const newItems = arrayMove(displayImages, oldIndex, newIndex);
      
      // Update display order values based on new positions
      const photoOrders = newItems.map((photo, index) => ({
        photoId: photo.id,
        displayOrder: index,
      }));
      
      // Submit the reordering to the server
      reorderMutation.mutate({ photoOrders });
    }
  };

  // Render loading state
  if (isLoading) {
    return (
      <div className="flex justify-center items-center p-8">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <span className="ml-2">Loading display rotation...</span>
      </div>
    );
  }

  // Get display settings to find out the current display configuration
  const { data: displaySettings } = useQuery<{
    autoRotate: boolean;
    slideInterval: number;
    showInfo: boolean;
    transitionEffect: string;
    blacklistWords: string | null;
    borderStyle: string;
    borderWidth: number;
    borderColor: string;
    fontFamily: string;
    fontColor: string;
    fontSize: number;
    imagePosition: string;
    backgroundPath: string | null;
  }>({
    queryKey: ['/api/display-settings'],
    refetchInterval: 30000 // Refetch every 30 seconds
  });

  // If no images are found
  if (!displayImages || displayImages.length === 0) {
    return (
      <Card className="mt-6">
        <CardContent className="pt-6">
          <div className="text-center p-6">
            <p className="text-muted-foreground">There are no approved photos in the display rotation.</p>
            <p className="text-sm mt-2">Approve photos in the moderation section to add them to the rotation.</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  // Find the currently displayed image
  const currentlyDisplayedImage = displayImages && displayImages.length > 0 
    ? displayImages.slice().sort((a, b) => {
        const orderA = a.displayOrder !== undefined ? a.displayOrder : Number.MAX_SAFE_INTEGER;
        const orderB = b.displayOrder !== undefined ? b.displayOrder : Number.MAX_SAFE_INTEGER;
        return orderA - orderB;
      })[0]
    : null;

  return (
    <div className="space-y-6 mt-6">
      {/* Current live display preview */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-col md:flex-row gap-6">
            <div className="w-full md:w-2/3 lg:w-1/2">
              <h3 className="text-lg font-medium mb-2">Currently Live on Display</h3>
              {currentlyDisplayedImage ? (
                <div className="relative bg-slate-50 rounded-lg overflow-hidden border border-gray-200 aspect-video flex items-center justify-center">
                  <img 
                    src={currentlyDisplayedImage.originalPath} 
                    alt="Currently displayed" 
                    className="object-contain max-h-[300px] max-w-full"
                  />
                  {currentlyDisplayedImage.caption && (
                    <div className="absolute bottom-0 left-0 right-0 bg-black bg-opacity-60 text-white p-2 text-sm">
                      <p className="truncate">{currentlyDisplayedImage.caption}</p>
                    </div>
                  )}
                </div>
              ) : (
                <div className="bg-slate-50 rounded-lg border border-gray-200 aspect-video flex items-center justify-center text-gray-400">
                  No image currently displayed
                </div>
              )}
              <p className="text-sm text-muted-foreground mt-2">
                This shows what is currently appearing first on the display. 
                {displaySettings?.autoRotate 
                  ? " Display is rotating through all approved photos automatically."
                  : " Display rotation is currently paused."
                }
              </p>
            </div>
            <div className="w-full md:w-1/3 lg:w-1/2 flex flex-col justify-center space-y-4">
              <div className="flex items-center space-x-2">
                <Switch
                  id="auto-rotate"
                  checked={!isPaused} 
                  onCheckedChange={(checked) => setIsPaused(!checked)}
                />
                <Label htmlFor="auto-rotate">
                  {isPaused ? "Rotation Paused" : "Auto Rotate"}
                </Label>
              </div>
              
              <div className="text-sm">
                <p>Total photos in rotation: <span className="font-semibold">{displayImages.length}</span></p>
                <p>Rotation interval: <span className="font-semibold">{displaySettings?.slideInterval || 8} seconds</span></p>
              </div>
              
              <a 
                href="/display" 
                target="_blank" 
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1 text-blue-600 hover:text-blue-800 transition-colors text-sm mt-2"
              >
                <span>Open display page in new tab</span>
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"></path>
                  <polyline points="15 3 21 3 21 9"></polyline>
                  <line x1="10" y1="14" x2="21" y2="3"></line>
                </svg>
              </a>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="flex justify-between items-center">
        <h2 className="text-xl font-semibold">Images in Display Rotation</h2>
      </div>
      
      <p className="text-sm text-muted-foreground">
        Drag and drop to reorder the images in the display rotation. The display will show images in the order listed here.
      </p>
      
      <DndContext 
        sensors={sensors}
        collisionDetection={closestCenter}
        onDragEnd={handleDragEnd}
      >
        <SortableContext 
          items={displayImages.map(img => img.id)}
          strategy={verticalListSortingStrategy}
        >
          <div className="space-y-3">
            {displayImages.map((image, index) => (
              <SortableItem 
                key={image.id}
                image={image}
                index={index}
                currentIndex={currentIndex}
                setCurrentIndex={setCurrentIndex}
                isPaused={isPaused}
              />
            ))}
          </div>
        </SortableContext>
      </DndContext>
    </div>
  );
}