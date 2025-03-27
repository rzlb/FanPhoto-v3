import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { Photo } from "@shared/schema";
import { formatDistanceToNow } from "date-fns";
import { useToast } from "@/hooks/use-toast";

interface PhotoModerationCardProps {
  photo: Photo;
}

export default function PhotoModerationCard({ photo }: PhotoModerationCardProps) {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  
  const moderateMutation = useMutation({
    mutationFn: async ({ photoId, action }: { photoId: number; action: "approve" | "reject" }) => {
      const response = await apiRequest("POST", "/api/photos/moderate", { photoId, action });
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/photos"] });
      queryClient.invalidateQueries({ queryKey: ["/api/stats"] });
      
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

  const handleModerate = (action: "approve" | "reject") => {
    moderateMutation.mutate({ photoId: photo.id, action });
  };

  return (
    <Card className="col-span-1 bg-white rounded-lg shadow divide-y divide-gray-200">
      <div className="w-full flex flex-col p-4">
        <div className="relative h-60 w-full mb-4 bg-gray-100 rounded-md overflow-hidden">
          <img 
            className="w-full h-full object-cover" 
            src={photo.originalPath} 
            alt="User uploaded photo" 
          />
          <div className="absolute inset-0 bg-black bg-opacity-0 hover:bg-opacity-10 transition-opacity flex items-center justify-center">
            <button type="button" className="p-2 bg-white rounded-full shadow opacity-0 hover:opacity-100 focus:opacity-100 transition-opacity">
              <svg className="h-6 w-6 text-gray-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </button>
          </div>
        </div>
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-gray-900">{photo.submitterName || "Anonymous"}</p>
            <p className="text-xs text-gray-500">
              {photo.createdAt ? formatDistanceToNow(new Date(photo.createdAt), { addSuffix: true }) : "Recently"}
            </p>
          </div>
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
            Pending
          </span>
        </div>
      </div>
      <div className="p-4">
        <div className="flex space-x-2">
          <Button
            onClick={() => handleModerate("approve")}
            disabled={moderateMutation.isPending}
            variant="default"
            className="inline-flex items-center px-3 py-2 border border-transparent shadow-sm text-sm leading-4 font-medium rounded-md text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 w-1/2 justify-center"
          >
            <svg className="-ml-0.5 mr-2 h-4 w-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
            </svg>
            Approve
          </Button>
          <Button
            onClick={() => handleModerate("reject")}
            disabled={moderateMutation.isPending}
            variant="outline"
            className="inline-flex items-center px-3 py-2 border border-gray-300 shadow-sm text-sm leading-4 font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary w-1/2 justify-center"
          >
            <svg className="-ml-0.5 mr-2 h-4 w-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
            </svg>
            Reject
          </Button>
        </div>
      </div>
    </Card>
  );
}
