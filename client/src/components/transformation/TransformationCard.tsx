import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { formatDistanceToNow } from "date-fns";
import { useState } from "react";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Maximize } from "lucide-react";

interface TransformationCardProps {
  id: number;
  originalImageUrl: string;
  transformedImageUrl: string;
  stylePreset: string;
  createdAt: string;
  status: string;
}

export default function TransformationCard({
  id,
  originalImageUrl,
  transformedImageUrl,
  stylePreset,
  createdAt,
  status
}: TransformationCardProps) {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const [originalImageModalOpen, setOriginalImageModalOpen] = useState(false);
  const [transformedImageModalOpen, setTransformedImageModalOpen] = useState(false);
  
  const moderate = useMutation({
    mutationFn: async ({ transformationId, action }: { transformationId: number; action: "approve" | "reject" }) => {
      const response = await apiRequest("POST", "/api/transformations/moderate", { transformationId, action });
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/transformations"] });
      queryClient.invalidateQueries({ queryKey: ["/api/stats"] });
      toast({
        title: "Transformation moderated",
        description: "The transformation has been successfully moderated.",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Moderation failed",
        description: error.message || "Failed to moderate the transformation. Please try again.",
        variant: "destructive",
      });
    },
  });

  const handleModerate = (action: "approve" | "reject") => {
    moderate.mutate({ transformationId: id, action });
  };

  const statusClasses = {
    pending: "bg-yellow-100 text-yellow-800",
    approved: "bg-green-100 text-green-800",
    rejected: "bg-red-100 text-red-800",
  };

  return (
    <>
      <Card className="col-span-1 bg-white rounded-lg shadow divide-y divide-gray-200 border border-gray-200">
        <div className="w-full p-4">
          <div className="flex items-center justify-between mb-4">
            <h4 className="text-sm font-medium text-gray-900">Transformation #{id}</h4>
            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${statusClasses[status as keyof typeof statusClasses] || statusClasses.pending}`}>
              {status.charAt(0).toUpperCase() + status.slice(1)} {status === "pending" ? "Review" : ""}
            </span>
          </div>
          <div className="grid grid-cols-2 gap-3">
            {/* Original image */}
            <div>
              <p className="text-xs text-gray-500 mb-1">Original</p>
              <div className="relative h-40 w-full rounded-md overflow-hidden bg-gray-100 flex items-center justify-center group cursor-pointer" onClick={() => setOriginalImageModalOpen(true)}>
                <img className="max-h-full max-w-full object-contain" src={originalImageUrl} alt="Original photo" />
                <div className="absolute inset-0 flex items-center justify-center bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity">
                  <Maximize className="h-6 w-6 text-white" />
                </div>
              </div>
            </div>
            {/* Transformed image */}
            <div>
              <p className="text-xs text-gray-500 mb-1">Transformed</p>
              <div className="relative h-40 w-full rounded-md overflow-hidden bg-gray-100 flex items-center justify-center group cursor-pointer" onClick={() => setTransformedImageModalOpen(true)}>
                <img className="max-h-full max-w-full object-contain" src={transformedImageUrl} alt="AI transformed photo" />
                <div className="absolute inset-0 flex items-center justify-center bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity">
                  <Maximize className="h-6 w-6 text-white" />
                </div>
              </div>
            </div>
          </div>
          <div className="mt-3">
            <p className="text-xs text-gray-500">
              Transformed using: <span className="font-medium">{stylePreset}</span>
            </p>
            <p className="text-xs text-gray-500">
              {createdAt && formatDistanceToNow(new Date(createdAt), { addSuffix: true })}
            </p>
          </div>
        </div>
        <div className="p-4">
          <div className="flex space-x-3">
            {status === "pending" ? (
              <>
                <Button
                  onClick={() => handleModerate("approve")}
                  disabled={moderate.isPending}
                  className="inline-flex items-center px-3 py-2 border border-transparent shadow-sm text-sm leading-4 font-medium rounded-md text-white bg-primary hover:bg-primary/90 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary flex-grow justify-center"
                >
                  <svg className="-ml-0.5 mr-2 h-4 w-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
                  </svg>
                  Approve
                </Button>
                <Button
                  onClick={() => handleModerate("reject")}
                  disabled={moderate.isPending}
                  variant="secondary"
                  className="inline-flex items-center px-3 py-2 border border-transparent shadow-sm text-sm leading-4 font-medium rounded-md text-white bg-gray-400 hover:bg-gray-500 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-400 flex-grow justify-center"
                >
                  <svg className="-ml-0.5 mr-2 h-4 w-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                  </svg>
                  Reject
                </Button>
                <Button
                  variant="outline"
                  className="inline-flex items-center px-3 py-2 border border-gray-300 shadow-sm text-sm leading-4 font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary"
                >
                  <svg className="h-4 w-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                  </svg>
                </Button>
              </>
            ) : (
              <>
                <Button
                  disabled={status !== "approved"}
                  className={`inline-flex items-center px-3 py-2 border border-transparent shadow-sm text-sm leading-4 font-medium rounded-md text-white ${status === "approved" ? "bg-green-500" : "bg-gray-400"} flex-grow justify-center`}
                >
                  <svg className="-ml-0.5 mr-2 h-4 w-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
                  </svg>
                  {status === "approved" ? "Approved" : "Approve"}
                </Button>
                <Button
                  variant="outline"
                  className="inline-flex items-center px-3 py-2 border border-gray-300 shadow-sm text-sm leading-4 font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary"
                >
                  <svg className="h-4 w-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                  </svg>
                </Button>
              </>
            )}
          </div>
        </div>
      </Card>

      {/* Original Image Preview Modal */}
      <Dialog open={originalImageModalOpen} onOpenChange={setOriginalImageModalOpen}>
        <DialogContent className="max-w-screen-xl w-[95vw] p-0 overflow-hidden bg-black/95 border-none">
          <div className="flex flex-col h-[95vh]">
            <div className="flex-1 flex items-center justify-center p-4 overflow-auto">
              <img 
                src={originalImageUrl} 
                alt="Original photo" 
                className="max-h-[85vh] max-w-[95%] object-contain"
              />
            </div>
            <div className="p-4 bg-black/80 text-white">
              <p className="text-sm">Original Photo</p>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Transformed Image Preview Modal */}
      <Dialog open={transformedImageModalOpen} onOpenChange={setTransformedImageModalOpen}>
        <DialogContent className="max-w-screen-xl w-[95vw] p-0 overflow-hidden bg-black/95 border-none">
          <div className="flex flex-col h-[95vh]">
            <div className="flex-1 flex items-center justify-center p-4 overflow-auto">
              <img 
                src={transformedImageUrl} 
                alt="AI transformed photo" 
                className="max-h-[85vh] max-w-[95%] object-contain"
              />
            </div>
            <div className="p-4 bg-black/80 text-white">
              <p className="text-sm">Transformed with: <span className="font-medium">{stylePreset}</span></p>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
