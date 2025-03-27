import { useQuery } from "@tanstack/react-query";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Link } from "wouter";
import { formatDistanceToNow } from "date-fns";
import { Photo } from "@shared/schema";

export default function RecentUploads() {
  const { data, isLoading, error } = useQuery<Photo[]>({
    queryKey: ["/api/photos/recent"],
  });
  
  function getStatusBadgeClasses(status: string) {
    switch (status) {
      case "approved":
        return "bg-green-100 text-green-800";
      case "pending":
        return "bg-yellow-100 text-yellow-800";
      case "rejected":
        return "bg-red-100 text-red-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  }

  return (
    <div className="mt-8">
      <h2 className="text-lg leading-6 font-medium text-gray-900 mb-4">Recent Uploads</h2>
      {isLoading ? (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {Array(3).fill(null).map((_, i) => (
            <Card key={i}>
              <div className="h-48 w-full bg-gray-200">
                <Skeleton className="h-full w-full" />
              </div>
              <CardContent className="px-4 py-4">
                <div className="flex justify-between items-center">
                  <div>
                    <Skeleton className="h-4 w-20 mb-2" />
                    <Skeleton className="h-3 w-24" />
                  </div>
                  <Skeleton className="h-8 w-16" />
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : error ? (
        <div className="bg-red-50 p-4 rounded-md text-red-800">
          Error loading recent uploads: {error instanceof Error ? error.message : "Unknown error"}
        </div>
      ) : !data || data.length === 0 ? (
        <div className="bg-gray-50 p-8 text-center rounded-md">
          <p className="text-gray-500">No photos have been uploaded yet.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {data.map((photo) => (
            <Card key={photo.id} className="bg-white overflow-hidden shadow rounded-lg">
              <div className="relative h-48 w-full overflow-hidden bg-gray-200">
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
              <CardContent className="px-4 py-4">
                <div className="flex justify-between items-center">
                  <div>
                    <p className="text-sm font-medium text-gray-900">{photo.submitterName || "Anonymous"}</p>
                    <p className="text-xs text-gray-500">
                      {photo.createdAt ? formatDistanceToNow(new Date(photo.createdAt), { addSuffix: true }) : "Recently"}
                    </p>
                  </div>
                  <div className="flex space-x-2">
                    <button type="button" className="p-1 rounded-full text-gray-400 hover:text-gray-500 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary">
                      <svg className="h-5 w-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                      </svg>
                    </button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
      
      <div className="mt-4 text-center">
        <Link href="/admin/moderation">
          <Button className="inline-flex items-center px-4 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary">
            View All Uploads
          </Button>
        </Link>
      </div>
    </div>
  );
}
