import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Link } from "wouter";
import { formatDistanceToNow } from "date-fns";
import { Photo } from "@shared/schema";
import { StyledCard } from "@/components/ui/styled-card";
import { Eye } from "lucide-react";

export default function RecentUploads() {
  const { data, isLoading, error } = useQuery<Photo[]>({
    queryKey: ["/api/photos/recent"],
  });
  
  function getStatusBadgeClasses(status: string) {
    switch (status) {
      case "approved":
        return "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400";
      case "pending":
        return "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400";
      case "rejected":
        return "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400";
      case "archived":
        return "bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-400";
      default:
        return "bg-gray-100 text-gray-800 dark:bg-gray-800/50 dark:text-gray-300";
    }
  }

  return (
    <div className="mt-8">
      <h2 className="text-xl font-medium text-foreground mb-4">Recent Uploads</h2>
      {isLoading ? (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {Array(3).fill(null).map((_, i) => (
            <StyledCard key={i}>
              <div className="h-48 w-full bg-muted rounded-t-lg">
                <Skeleton className="h-full w-full rounded-none" />
              </div>
              <div className="px-4 py-4">
                <div className="flex justify-between items-center">
                  <div>
                    <Skeleton className="h-4 w-20 mb-2" />
                    <Skeleton className="h-3 w-24" />
                  </div>
                  <Skeleton className="h-8 w-10 rounded-full" />
                </div>
              </div>
            </StyledCard>
          ))}
        </div>
      ) : error ? (
        <div className="bg-destructive/10 p-4 rounded-md text-destructive">
          Error loading recent uploads: {error instanceof Error ? error.message : "Unknown error"}
        </div>
      ) : !data || data.length === 0 ? (
        <div className="bg-muted/50 p-8 text-center rounded-md">
          <p className="text-muted-foreground">No photos have been uploaded yet.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {data.map((photo) => (
            <StyledCard key={photo.id} className="overflow-hidden">
              <div className="relative h-48 w-full overflow-hidden bg-muted">
                <img 
                  src={photo.originalPath} 
                  alt="Event photo" 
                  className="w-full h-full object-cover" 
                />
                <div className="absolute top-0 right-0 p-2">
                  <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusBadgeClasses(photo.status)}`}>
                    {photo.status.charAt(0).toUpperCase() + photo.status.slice(1)}
                  </span>
                </div>
              </div>
              <div className="p-4">
                <div className="flex justify-between items-center">
                  <div>
                    <p className="text-sm font-medium text-foreground">{photo.submitterName || "Anonymous"}</p>
                    <p className="text-xs text-muted-foreground">
                      {photo.createdAt ? formatDistanceToNow(new Date(photo.createdAt), { addSuffix: true }) : "Recently"}
                    </p>
                  </div>
                  <div className="flex space-x-2">
                    <button 
                      type="button" 
                      className="p-1 rounded-full text-muted-foreground hover:text-foreground bg-secondary hover:bg-secondary/80 transition-colors"
                    >
                      <Eye className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              </div>
            </StyledCard>
          ))}
        </div>
      )}
      
      <div className="mt-6 text-center">
        <Link href="/admin/moderation">
          <Button variant="outline">
            View All Uploads
          </Button>
        </Link>
      </div>
    </div>
  );
}
