import { Button } from "@/components/ui/button";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { Photo } from "@shared/schema";
import { formatDistanceToNow } from "date-fns";
import { useToast } from "@/hooks/use-toast";
import { useState, useEffect } from "react";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { StyledCard } from "@/components/ui/styled-card";
import { Check, X, Archive, Eye, Image as ImageIcon } from "lucide-react";

interface PhotoModerationCardProps {
  photo: Photo;
}

export default function PhotoModerationCard({ photo }: PhotoModerationCardProps) {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const [confirmDialogOpen, setConfirmDialogOpen] = useState(false);
  const [confirmRejectDialogOpen, setConfirmRejectDialogOpen] = useState(false);
  const [previewModalOpen, setPreviewModalOpen] = useState(false);
  
  // Extract the filename from the path
  const getImageUrl = (path: string) => {
    if (!path) return '';
    
    // This extracts the filename from paths like "/uploads/original/12345.jpg"
    const filename = path.split('/').pop();
    
    // Form the direct URL to the file on the server
    return `http://localhost:3000/uploads/original/${filename}`;
  };

  // Handle confirmation to approve a rejected photo
  const handleConfirmApprove = () => {
    moderateMutation.mutate({ photoId: photo.id, action: "approve" });
    setConfirmDialogOpen(false);
  };

  // Handle confirmation to reject an approved photo
  const handleConfirmReject = () => {
    moderateMutation.mutate({ photoId: photo.id, action: "reject" });
    setConfirmRejectDialogOpen(false);
  };
  
  const moderateMutation = useMutation({
    mutationFn: async ({ photoId, action }: { photoId: number; action: "approve" | "reject" | "archive" }) => {
      const response = await apiRequest("POST", "/api/photos/moderate", { photoId, action });
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/photos"] });
      queryClient.invalidateQueries({ queryKey: ["/api/stats"] });
      queryClient.invalidateQueries({ queryKey: ["/api/photos/recent"] });
      queryClient.invalidateQueries({ queryKey: ["/api/display/images"] });
      
      toast({
        title: "Photo moderated",
        description: "The photo has been successfully moderated.",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Moderation failed",
        description: error.message || "Failed to moderate the photo. Please try again.",
        variant: "destructive",
      });
    },
  });

  const handleModerate = (action: "approve" | "reject" | "archive") => {
    // Show confirmation dialog for rejected photos being approved
    if (photo.status === "rejected" && action === "approve") {
      setConfirmDialogOpen(true);
    } 
    // Show confirmation dialog for approved photos being rejected
    else if (photo.status === "approved" && action === "reject") {
      setConfirmRejectDialogOpen(true);
    }
    else {
      moderateMutation.mutate({ photoId: photo.id, action });
    }
  };

  const openPhotoPreview = () => {
    setPreviewModalOpen(true);
  };

  return (
    <>
      <StyledCard className="overflow-hidden">
        {/* Image and user ID badge */}
        <div className="relative w-full">
          {/* User ID Badge */}
          <div className="absolute top-3 left-3 flex items-center space-x-2 z-10">
            <div className="h-6 w-6 rounded-full bg-card flex items-center justify-center p-1 shadow-sm">
              <img 
                src="/assets/user-icon.png" 
                alt="User" 
                className="h-4 w-4 object-cover"
                onError={(e) => {
                  e.currentTarget.src = "data:image/svg+xml;charset=utf-8,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='none' stroke='currentColor' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'%3E%3Cpath d='M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2'/%3E%3Ccircle cx='12' cy='7' r='4'/%3E%3C/svg%3E";
                }}
              />
            </div>
            <div className="bg-card bg-opacity-80 backdrop-blur-sm px-2 py-1 rounded-md text-xs font-medium shadow-sm">
              {`ID:${photo.id}`}
            </div>
          </div>
          
          {/* Status Badge */}
          <div className="absolute top-3 right-3 z-10">
            {photo.status === "pending" && (
              <span className="inline-flex items-center px-2.5 py-1 rounded-md text-xs font-medium bg-yellow-100 dark:bg-yellow-900/50 text-yellow-800 dark:text-yellow-300">
                Pending
              </span>
            )}
            {photo.status === "approved" && (
              <span className="inline-flex items-center px-2.5 py-1 rounded-md text-xs font-medium bg-green-100 dark:bg-green-900/50 text-green-800 dark:text-green-300">
                Approved
              </span>
            )}
            {photo.status === "rejected" && (
              <span className="inline-flex items-center px-2.5 py-1 rounded-md text-xs font-medium bg-red-100 dark:bg-red-900/50 text-red-800 dark:text-red-300">
                Rejected
              </span>
            )}
            {photo.status === "archived" && (
              <span className="inline-flex items-center px-2.5 py-1 rounded-md text-xs font-medium bg-purple-100 dark:bg-purple-900/50 text-purple-800 dark:text-purple-300">
                Archived
              </span>
            )}
          </div>
          
          {/* Photo - Full card area is clickable */}
          <div 
            className="h-56 w-full overflow-hidden flex items-center justify-center bg-muted cursor-pointer relative"
            onClick={openPhotoPreview}
          >
            <img 
              src={getImageUrl(photo.originalPath || '')}
              alt="User uploaded photo" 
              className="h-full w-full object-contain"
              onError={(e) => {
                console.error("Image failed to load:", e.currentTarget.src);
                e.currentTarget.style.display = 'none';
                // Show fallback
                const parent = e.currentTarget.parentNode as HTMLElement;
                if (parent) {
                  const fallback = document.createElement('div');
                  fallback.className = 'flex flex-col items-center justify-center h-full w-full';
                  fallback.innerHTML = `
                    <div class="text-muted-foreground">
                      <svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="mx-auto mb-2"><rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect><circle cx="8.5" cy="8.5" r="1.5"></circle><polyline points="21 15 16 10 5 21"></polyline></svg>
                      <p class="text-sm text-center mt-2">Image preview not available</p>
                    </div>
                  `;
                  parent.appendChild(fallback);
                }
              }}
            />
            <div className="absolute inset-0 bg-black opacity-0 hover:opacity-20 transition-opacity duration-200 flex items-center justify-center">
              <Eye className="h-10 w-10 text-white" />
            </div>
          </div>
        </div>
        
        {/* Photo Information */}
        <div className="p-3">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-sm font-medium text-foreground truncate">{photo.submitterName || "Anonymous"}</h3>
              <p className="text-xs text-muted-foreground mt-0.5">
                {photo.createdAt ? formatDistanceToNow(new Date(photo.createdAt), { addSuffix: true }) : "Recently"}
              </p>
            </div>
            
            {/* Preview button */}
            <div className="flex items-center">
              <Button 
                variant="ghost" 
                size="icon" 
                className="h-8 w-8"
                onClick={openPhotoPreview}
              >
                <Eye className="h-4 w-4" />
              </Button>
            </div>
          </div>
          
          {/* Caption */}
          {photo.caption && (
            <div className="mt-2">
              <p className="text-sm text-foreground line-clamp-2">{photo.caption}</p>
            </div>
          )}
        </div>
        
        {/* Moderation buttons */}
        <div className="px-3 pb-3 mt-1 flex space-x-2">
          {photo.status === "pending" && (
            <>
              <Button
                onClick={() => handleModerate("approve")}
                disabled={moderateMutation.isPending}
                variant="default"
                className="px-3 py-2 h-9 bg-green-600 hover:bg-green-700 text-white flex-1"
                size="sm"
              >
                <Check className="mr-1 h-4 w-4" /> Approve
              </Button>
              
              <Button
                onClick={() => handleModerate("reject")}
                disabled={moderateMutation.isPending}
                variant="default"
                className="px-3 py-2 h-9 bg-red-600 hover:bg-red-700 text-white flex-1"
                size="sm"
              >
                <X className="mr-1 h-4 w-4" /> Reject
              </Button>
            </>
          )}
          
          {photo.status === "rejected" && (
            <>
              <Button
                onClick={() => handleModerate("approve")}
                disabled={moderateMutation.isPending}
                variant="default"
                className="px-3 py-2 h-9 bg-green-600 hover:bg-green-700 text-white flex-1"
                size="sm"
              >
                <Check className="mr-1 h-4 w-4" /> Approve
              </Button>
              
              <Button
                onClick={() => handleModerate("archive")}
                disabled={moderateMutation.isPending}
                variant="outline"
                size="sm"
                className="flex-1"
              >
                <Archive className="mr-1 h-4 w-4" /> Archive
              </Button>
            </>
          )}
          
          {photo.status === "approved" && (
            <>
              <Button
                onClick={() => handleModerate("reject")}
                disabled={moderateMutation.isPending}
                variant="default"
                className="px-3 py-2 h-9 bg-red-600 hover:bg-red-700 text-white flex-1"
                size="sm"
              >
                <X className="mr-1 h-4 w-4" /> Reject
              </Button>
              
              <Button
                onClick={() => handleModerate("archive")}
                disabled={moderateMutation.isPending}
                variant="outline"
                size="sm"
                className="flex-1"
              >
                <Archive className="mr-1 h-4 w-4" /> Archive
              </Button>
            </>
          )}
          
          {photo.status === "archived" && (
            <>
              <Button
                onClick={() => handleModerate("approve")}
                disabled={moderateMutation.isPending}
                variant="default"
                className="px-3 py-2 h-9 bg-green-600 hover:bg-green-700 text-white flex-1"
                size="sm"
              >
                <Check className="mr-1 h-4 w-4" /> Approve
              </Button>
              
              <Button
                onClick={() => handleModerate("reject")}
                disabled={moderateMutation.isPending}
                variant="default"
                className="px-3 py-2 h-9 bg-red-600 hover:bg-red-700 text-white flex-1"
                size="sm"
              >
                <X className="mr-1 h-4 w-4" /> Reject
              </Button>
            </>
          )}
        </div>
      </StyledCard>
      
      {/* Confirm approve dialog */}
      <AlertDialog open={confirmDialogOpen} onOpenChange={setConfirmDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Approve Rejected Photo</AlertDialogTitle>
            <AlertDialogDescription>
              This photo was previously rejected. Are you sure you want to approve it and add it to the display rotation?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleConfirmApprove} className="bg-green-600 hover:bg-green-700">
              Approve
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
      
      {/* Confirm reject dialog */}
      <AlertDialog open={confirmRejectDialogOpen} onOpenChange={setConfirmRejectDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Reject Approved Photo</AlertDialogTitle>
            <AlertDialogDescription>
              This photo was previously approved. Rejecting it will remove it from the display rotation. Are you sure?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleConfirmReject} className="bg-red-600 hover:bg-red-700">
              Reject
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
      
      {/* Full-size image preview dialog */}
      <Dialog open={previewModalOpen} onOpenChange={setPreviewModalOpen}>
        <DialogContent className="max-w-screen-xl w-[95vw] p-0 overflow-hidden bg-black/95 border-none">
          <div className="flex flex-col h-[95vh]">
            <div className="flex-1 flex items-center justify-center p-4 overflow-auto">
              <img 
                src={getImageUrl(photo.originalPath || '')}
                alt="Full size photo preview" 
                className="max-h-[85vh] max-w-[95%] object-contain"
                onError={(e) => {
                  console.error("Failed to load image:", e.currentTarget.src);
                  e.currentTarget.style.display = 'none';
                  // Show fallback
                  const parent = e.currentTarget.parentNode as HTMLElement;
                  if (parent) {
                    const fallback = document.createElement('div');
                    fallback.className = 'flex flex-col items-center justify-center';
                    fallback.innerHTML = `
                      <div class="text-white">
                        <svg xmlns="http://www.w3.org/2000/svg" width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="mx-auto mb-4"><rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect><circle cx="8.5" cy="8.5" r="1.5"></circle><polyline points="21 15 16 10 5 21"></polyline></svg>
                        <p class="text-lg text-center mt-4">Image preview not available</p>
                        <p class="text-sm text-center mt-2 text-gray-400">Original path: ${photo.originalPath || 'Not specified'}</p>
                      </div>
                    `;
                    parent.appendChild(fallback);
                  }
                }}
              />
            </div>
            <div className="p-4 bg-black/80 text-white">
              <p className="text-sm">
                <span className="font-medium">{photo.submitterName || "Anonymous"}</span>
                {photo.caption && `: ${photo.caption}`}
              </p>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
} 