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

  return (
    <div className="space-y-4 mt-6">
      <div className="flex justify-between items-center">
        <h2 className="text-xl font-semibold">Images in Display Rotation</h2>
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