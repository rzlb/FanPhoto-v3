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
import { Loader2, X, Pause, Play, GripVertical, Maximize, Archive, AlertCircle, XCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { StyledCard } from "@/components/ui/styled-card";

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
function SortableItem({ 
  image, 
  index, 
  currentIndex, 
  setCurrentIndex, 
  isPaused, 
  setCurrentImage,
  onArchiveImage,
  onRejectImage
}: {
  image: DisplayImage;
  index: number;
  currentIndex: number | null;
  setCurrentIndex: (index: number | null) => void;
  isPaused: boolean;
  setCurrentImage: (image: DisplayImage) => void;
  onArchiveImage: (image: DisplayImage) => void;
  onRejectImage: (image: DisplayImage) => void;
}) {
  const [previewModalOpen, setPreviewModalOpen] = useState(false);
  
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

  const openPhotoPreview = (e: React.MouseEvent) => {
    e.stopPropagation(); // Prevent triggering drag events
    setPreviewModalOpen(true);
  };

  const handleSetCurrentImage = (e: React.MouseEvent) => {
    e.stopPropagation();
    setCurrentIndex(index);
    setCurrentImage(image);
  };

  const handleArchiveImage = (e: React.MouseEvent) => {
    e.stopPropagation();
    onArchiveImage(image);
  };

  const handleRejectImage = (e: React.MouseEvent) => {
    e.stopPropagation();
    onRejectImage(image);
  };

  return (
    <>
      <div
        ref={setNodeRef}
        style={style}
        className={`border rounded-md p-3 bg-card flex items-center space-x-3 ${
          currentIndex === index ? "ring-2 ring-primary" : ""
        }`}
        {...attributes}
      >
        <div className="flex-shrink-0 cursor-grab" {...listeners}>
          <GripVertical className="h-5 w-5 text-muted-foreground" />
        </div>
        <div className="flex-shrink-0 h-16 w-16 relative bg-background flex items-center justify-center overflow-hidden rounded-md group">
          <img
            src={image.originalPath}
            alt={`Photo by ${image.submitterName}`}
            className="max-h-full max-w-full object-contain"
          />
          <Badge className="absolute -top-2 -left-2 text-xs">
            {index + 1}
          </Badge>
          <button 
            className="absolute inset-0 flex items-center justify-center bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity"
            onClick={openPhotoPreview}
          >
            <Maximize className="h-5 w-5 text-white" />
          </button>
        </div>
        <div className="flex-grow overflow-hidden">
          <div className="font-medium truncate text-foreground">{image.submitterName}</div>
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
              onClick={handleSetCurrentImage}
              title="Set as current image"
            >
              <Play className="h-4 w-4" />
            </Button>
          )}
          <Button
            variant="outline"
            size="icon"
            onClick={handleArchiveImage}
            title="Archive this image"
            className="text-purple-500 hover:text-purple-700"
          >
            <Archive className="h-4 w-4" />
          </Button>
          <Button
            variant="outline"
            size="icon"
            onClick={handleRejectImage}
            title="Reject this image"
            className="text-destructive hover:text-destructive"
          >
            <XCircle className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Photo Preview Modal */}
      <Dialog open={previewModalOpen} onOpenChange={setPreviewModalOpen}>
        <DialogContent className="max-w-screen-xl w-[95vw] p-0 overflow-hidden bg-black/95 border-none">
          <div className="flex flex-col h-[95vh]">
            <div className="flex-1 flex items-center justify-center p-4 overflow-auto">
              <img 
                src={image.originalPath} 
                alt={`Photo by ${image.submitterName}`} 
                className="max-h-[85vh] max-w-[95%] object-contain"
              />
            </div>
            <div className="p-4 bg-black/80 text-white">
              <p className="text-sm">
                <span className="font-medium">{image.submitterName}</span>
                {image.caption && `: ${image.caption}`}
              </p>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}

export default function DisplayRotationManager() {
  const [currentIndex, setCurrentIndex] = useState<number | null>(null);
  const [isPaused, setIsPaused] = useState(false);
  const [currentImagePreviewOpen, setCurrentImagePreviewOpen] = useState(false);
  const [archiveDialogOpen, setArchiveDialogOpen] = useState(false);
  const [rejectDialogOpen, setRejectDialogOpen] = useState(false);
  const [imageToArchive, setImageToArchive] = useState<DisplayImage | null>(null);
  const [imageToReject, setImageToReject] = useState<DisplayImage | null>(null);
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
  
  // Get display settings to find out the current display configuration
  // IMPORTANT: This hook must be outside any conditional code
  const { data: displaySettings } = useQuery<{
    autoRotate: boolean;
    slideInterval: number;
    showInfo: boolean;
    showCaptions: boolean;
    displayFormat: string;
    transitionEffect: string;
    blacklistWords: string | null;
    borderStyle: string;
    borderWidth: number;
    borderColor: string;
    fontFamily: string;
    fontColor: string;
    fontSize: number;
    imagePosition: string;
    textPosition: string;
    textAlignment: string;
    textPadding: number;
    textMaxWidth: string;
    textBackground: boolean;
    textBackgroundColor: string;
    textBackgroundOpacity: number;
    backgroundPath: string | null;
    logoPath: string | null;
  }>({
    queryKey: ['/api/display-settings'],
    refetchInterval: 30000 // Refetch every 30 seconds
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

  // Mutation to set the current image in rotation
  const setCurrentImageMutation = useMutation({
    mutationFn: async (imageData: { imageId: number }) => {
      const response = await fetch('/api/display/set-current-image', {
        method: 'POST',
        body: JSON.stringify(imageData),
        headers: {
          'Content-Type': 'application/json',
        },
      });
      
      if (!response.ok) {
        throw new Error('Failed to set current image');
      }
      
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/display/images'] });
      toast({
        title: "Current image updated",
        description: "The display now shows your selected image.",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Failed to update current image",
        description: error.message || "There was an error setting the current image.",
        variant: "destructive",
      });
    },
  });

  // Mutation for auto-rotation control
  const toggleAutoRotateMutation = useMutation({
    mutationFn: async (settingsData: { autoRotate: boolean }) => {
      const response = await fetch('/api/display/settings', {
        method: 'PATCH',
        body: JSON.stringify(settingsData),
        headers: {
          'Content-Type': 'application/json',
        },
      });
      
      if (!response.ok) {
        throw new Error('Failed to update auto-rotation setting');
      }
      
      return response.json();
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['/api/display-settings'] });
      toast({
        title: data.autoRotate ? "Auto-rotation resumed" : "Auto-rotation paused",
        description: data.autoRotate 
          ? "Images will now rotate automatically." 
          : "The current image will remain on display until rotation is resumed.",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Failed to update auto-rotation",
        description: error.message || "There was an error updating the auto-rotation setting.",
        variant: "destructive",
      });
    },
  });

  // Mutation for archiving images
  const archiveImageMutation = useMutation({
    mutationFn: async (imageData: { photoId: number }) => {
      const response = await fetch('/api/photos/moderate', {
        method: 'POST',
        body: JSON.stringify({
          photoId: imageData.photoId,
          action: 'archive'
        }),
        headers: {
          'Content-Type': 'application/json',
        },
      });
      
      if (!response.ok) {
        throw new Error('Failed to archive image');
      }
      
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/display/images'] });
      toast({
        title: "Image archived",
        description: "The image has been removed from the display rotation.",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Failed to archive image",
        description: error.message || "There was an error archiving the image.",
        variant: "destructive",
      });
    },
  });

  // Mutation for rejecting images
  const rejectImageMutation = useMutation({
    mutationFn: async (imageData: { photoId: number }) => {
      const response = await fetch('/api/photos/moderate', {
        method: 'POST',
        body: JSON.stringify({
          photoId: imageData.photoId,
          action: 'reject'
        }),
        headers: {
          'Content-Type': 'application/json',
        },
      });
      
      if (!response.ok) {
        throw new Error('Failed to reject image');
      }
      
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/display/images'] });
      toast({
        title: "Image rejected",
        description: "The image has been removed from the display rotation and marked as rejected.",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Failed to reject image",
        description: error.message || "There was an error rejecting the image.",
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

  // Handle setting current image
  const handleSetCurrentImage = (image: DisplayImage) => {
    setCurrentImageMutation.mutate({ imageId: image.id });
    // Also update auto-rotation to paused if not already
    if (!isPaused) {
      setIsPaused(true);
      toggleAutoRotateMutation.mutate({ autoRotate: false });
    }
  };

  // Handle toggle auto-rotation
  const handleToggleAutoRotate = (checked: boolean) => {
    setIsPaused(!checked);
    toggleAutoRotateMutation.mutate({ autoRotate: checked });
  };

  // Handle archive image
  const handleArchiveImage = (image: DisplayImage) => {
    setImageToArchive(image);
    setArchiveDialogOpen(true);
  };

  const confirmArchiveImage = () => {
    if (imageToArchive) {
      archiveImageMutation.mutate({ photoId: imageToArchive.id });
      setArchiveDialogOpen(false);
      setImageToArchive(null);
    }
  };

  // Handle reject image
  const handleRejectImage = (image: DisplayImage) => {
    setImageToReject(image);
    setRejectDialogOpen(true);
  };

  const confirmRejectImage = () => {
    if (imageToReject) {
      rejectImageMutation.mutate({ photoId: imageToReject.id });
      setRejectDialogOpen(false);
      setImageToReject(null);
    }
  };

  // Render loading state
  if (isLoading) {
    return (
      <div className="flex justify-center items-center p-8">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <span className="ml-2 text-foreground">Loading display rotation...</span>
      </div>
    );
  }

  // If no images are found
  if (!displayImages || displayImages.length === 0) {
    return (
      <StyledCard className="mt-6">
        <CardContent className="pt-6">
          <div className="text-center p-6">
            <p className="text-muted-foreground">There are no approved photos in the display rotation.</p>
            <p className="text-sm mt-2 text-muted-foreground">Approve photos in the moderation section to add them to the rotation.</p>
          </div>
        </CardContent>
      </StyledCard>
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
      <StyledCard>
        <CardContent className="pt-6">
          <div className="flex flex-col md:flex-row gap-6">
            <div className="w-full md:w-2/3 lg:w-1/2">
              <h3 className="text-lg font-medium mb-2 text-foreground">Currently Live on Display</h3>
              {currentlyDisplayedImage ? (
                <div className="relative bg-background rounded-lg overflow-hidden border border-border aspect-video flex items-center justify-center group">
                  <img 
                    src={currentlyDisplayedImage.originalPath} 
                    alt="Currently displayed" 
                    className="max-h-[400px] max-w-full w-auto h-auto object-contain"
                  />
                  {currentlyDisplayedImage.caption && (
                    <div className="absolute bottom-0 left-0 right-0 bg-black bg-opacity-60 text-white p-2 text-sm">
                      <p className="truncate">{currentlyDisplayedImage.caption}</p>
                    </div>
                  )}
                  <button 
                    className="absolute inset-0 flex items-center justify-center bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity"
                    onClick={() => setCurrentImagePreviewOpen(true)}
                  >
                    <Maximize className="h-8 w-8 text-white" />
                  </button>
                </div>
              ) : (
                <div className="bg-background rounded-lg border border-border aspect-video flex items-center justify-center text-muted-foreground">
                  No image currently displayed
                </div>
              )}
              <p className="text-sm text-muted-foreground mt-2">
                This shows what is currently appearing first on the display. 
                {!isPaused
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
                  onCheckedChange={handleToggleAutoRotate}
                />
                <Label htmlFor="auto-rotate" className="text-foreground">
                  {isPaused ? "Rotation Paused" : "Auto Rotate"}
                </Label>
              </div>
              
              <div className="text-sm text-foreground">
                <p>Total photos in rotation: <span className="font-semibold">{displayImages.length}</span></p>
                <p>Rotation interval: <span className="font-semibold">{displaySettings?.slideInterval || 8} seconds</span></p>
              </div>
              
              <a 
                href="/display" 
                target="_blank" 
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1 text-blue-500 hover:text-blue-400 transition-colors text-sm mt-2"
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
      </StyledCard>

      <div className="flex justify-between items-center">
        <h2 className="text-xl font-semibold text-foreground">Images in Display Rotation</h2>
      </div>
      
      <p className="text-sm text-muted-foreground">
        Drag and drop to reorder the images in the display rotation. The display will show images in the order listed here.
        Use the play button to set an image as current. Use the archive button to remove an image from rotation, or the reject button to mark it as rejected.
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
                setCurrentImage={handleSetCurrentImage}
                onArchiveImage={handleArchiveImage}
                onRejectImage={handleRejectImage}
              />
            ))}
          </div>
        </SortableContext>
      </DndContext>

      {/* Current Image Preview Modal */}
      {currentlyDisplayedImage && (
        <Dialog open={currentImagePreviewOpen} onOpenChange={setCurrentImagePreviewOpen}>
          <DialogContent className="max-w-screen-xl w-[95vw] p-0 overflow-hidden bg-black/95 border-none">
            <div className="flex flex-col h-[95vh]">
              <div className="flex-1 flex items-center justify-center p-4 overflow-auto">
                <img 
                  src={currentlyDisplayedImage.originalPath} 
                  alt="Currently displayed" 
                  className="max-h-[85vh] max-w-[95%] object-contain"
                />
              </div>
              <div className="p-4 bg-black/80 text-white">
                <p className="text-sm">
                  <span className="font-medium">{currentlyDisplayedImage.submitterName}</span>
                  {currentlyDisplayedImage.caption && `: ${currentlyDisplayedImage.caption}`}
                </p>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      )}

      {/* Archive Confirmation Dialog */}
      <Dialog open={archiveDialogOpen} onOpenChange={setArchiveDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center text-foreground">
              <AlertCircle className="h-5 w-5 mr-2 text-purple-500" />
              Archive This Image?
            </DialogTitle>
            <DialogDescription>
              This will remove the image from the display rotation. The image will be archived and can be restored 
              from the moderation page if needed.
            </DialogDescription>
          </DialogHeader>
          
          {imageToArchive && (
            <div className="flex justify-center py-4">
              <div className="w-48 h-48 relative bg-background rounded-lg overflow-hidden border border-border flex items-center justify-center">
                <img 
                  src={imageToArchive.originalPath} 
                  alt="Image to archive" 
                  className="max-h-full max-w-full object-contain"
                />
              </div>
            </div>
          )}
          
          <DialogFooter>
            <Button variant="outline" onClick={() => setArchiveDialogOpen(false)}>
              Cancel
            </Button>
            <Button variant="secondary" className="bg-purple-500 hover:bg-purple-600 text-white" onClick={confirmArchiveImage}>
              Archive Image
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Reject Confirmation Dialog */}
      <Dialog open={rejectDialogOpen} onOpenChange={setRejectDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center text-foreground">
              <AlertCircle className="h-5 w-5 mr-2 text-destructive" />
              Reject This Image?
            </DialogTitle>
            <DialogDescription>
              This will remove the image from the display rotation and mark it as rejected. 
              It will no longer be shown to viewers.
            </DialogDescription>
          </DialogHeader>
          
          {imageToReject && (
            <div className="flex justify-center py-4">
              <div className="w-48 h-48 relative bg-background rounded-lg overflow-hidden border border-border flex items-center justify-center">
                <img 
                  src={imageToReject.originalPath} 
                  alt="Image to reject" 
                  className="max-h-full max-w-full object-contain"
                />
              </div>
            </div>
          )}
          
          <DialogFooter>
            <Button variant="outline" onClick={() => setRejectDialogOpen(false)}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={confirmRejectImage}>
              Reject Image
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}