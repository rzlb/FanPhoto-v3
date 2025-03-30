import { useState } from "react";
import AdminLayout from "@/components/shared/AdminLayout";
import PhotoModerationCard from "@/components/moderation/PhotoModerationCard";
import DisplayRotationManager from "@/components/moderation/DisplayRotationManager";
import { useQuery } from "@tanstack/react-query";
import { Photo } from "@shared/schema";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { Pagination, PaginationContent, PaginationItem, PaginationLink, PaginationNext, PaginationPrevious } from "@/components/ui/pagination";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { StyledCard, StatCard } from "@/components/ui/styled-card";
import { FileCheck, AlertCircle, Ban, Archive } from "lucide-react";

export default function ModerationPage() {
  const [status, setStatus] = useState<string>("pending");
  const [sortOrder, setSortOrder] = useState<string>("newest");
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 12; // Show more items per page
  
  // Get photos for the current status filter
  const { data: photos, isLoading, error } = useQuery<Photo[]>({
    queryKey: ["/api/photos", status],
    queryFn: async ({ queryKey }) => {
      const response = await fetch(`/api/photos?status=${queryKey[1]}`);
      if (!response.ok) {
        throw new Error("Failed to fetch photos");
      }
      return response.json();
    },
  });
  
  // Get counts for each status
  const { data: statusCounts } = useQuery<{
    pending: number;
    approved: number;
    rejected: number;
    archived: number;
  }>({
    queryKey: ["/api/stats"],
    queryFn: async () => {
      const response = await fetch("/api/stats");
      if (!response.ok) {
        throw new Error("Failed to fetch stats");
      }
      const data = await response.json();
      return {
        pending: data.pendingApproval,
        approved: data.approvedPhotos,
        rejected: data.totalUploads - (data.pendingApproval + data.approvedPhotos + data.archivedPhotos),
        archived: data.archivedPhotos
      };
    },
  });
  
  // Sort photos based on selected order
  const sortedPhotos = photos ? [...photos].sort((a, b) => {
    const dateA = new Date(a.createdAt || 0).getTime();
    const dateB = new Date(b.createdAt || 0).getTime();
    return sortOrder === "newest" ? dateB - dateA : dateA - dateB;
  }) : [];
  
  // Calculate pagination
  const totalPages = Math.ceil((sortedPhotos?.length || 0) / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const paginatedPhotos = sortedPhotos.slice(startIndex, startIndex + itemsPerPage);
  
  // Handle page change
  const handlePageChange = (page: number) => {
    setCurrentPage(page);
    window.scrollTo(0, 0);
  };
  
  return (
    <AdminLayout>
      <div className="py-6">
        <div className="content-container">
          <h1 className="text-2xl font-semibold text-foreground mb-2">Photo Management</h1>
          <p className="text-sm text-muted-foreground mb-6">Review, approve, and manage photos for the display wall</p>
          
          {/* Photo stats summary */}
          {statusCounts && (
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-6">
              <StatCard 
                title="Pending" 
                value={statusCounts.pending}
                icon={<AlertCircle className="h-6 w-6 text-yellow-500" />}
                className="h-24"
              />
              
              <StatCard 
                title="Approved" 
                value={statusCounts.approved}
                icon={<FileCheck className="h-6 w-6 text-green-500" />}
                className="h-24"
              />
              
              <StatCard 
                title="Rejected" 
                value={statusCounts.rejected}
                icon={<Ban className="h-6 w-6 text-red-500" />}
                className="h-24"
              />
              
              <StatCard 
                title="Archived" 
                value={statusCounts.archived}
                icon={<Archive className="h-6 w-6 text-gray-500" />}
                className="h-24"
              />
            </div>
          )}
        
          <Tabs defaultValue="moderation" className="w-full">
            <TabsList className="grid w-full grid-cols-2 mb-6">
              <TabsTrigger value="moderation">Photo Moderation</TabsTrigger>
              <TabsTrigger value="display-rotation">Display Rotation</TabsTrigger>
            </TabsList>
            
            <TabsContent value="moderation" className="mt-0">
              {/* Status filter buttons with counts */}
              <StyledCard className="mb-6">
                <div className="w-full">
                  <div className="flex flex-wrap gap-2 mb-4">
                    <button
                      onClick={() => {
                        setStatus("pending");
                        setCurrentPage(1);
                      }}
                      className={`inline-flex items-center px-4 py-2 rounded-md text-sm font-medium ${
                        status === "pending" 
                          ? "bg-yellow-100 dark:bg-yellow-900/50 text-yellow-800 dark:text-yellow-300 ring-2 ring-yellow-300 dark:ring-yellow-700" 
                          : "bg-yellow-50 dark:bg-yellow-900/20 text-yellow-700 dark:text-yellow-400 hover:bg-yellow-100 dark:hover:bg-yellow-900/30"
                      }`}
                    >
                      Pending
                      {statusCounts && (
                        <span className="ml-2 bg-yellow-200 dark:bg-yellow-800 text-yellow-800 dark:text-yellow-200 text-xs px-2 py-0.5 rounded-full">
                          {statusCounts.pending}
                        </span>
                      )}
                    </button>
                    
                    <button
                      onClick={() => {
                        setStatus("approved");
                        setCurrentPage(1);
                      }}
                      className={`inline-flex items-center px-4 py-2 rounded-md text-sm font-medium ${
                        status === "approved" 
                          ? "bg-green-100 dark:bg-green-900/50 text-green-800 dark:text-green-300 ring-2 ring-green-300 dark:ring-green-700" 
                          : "bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-400 hover:bg-green-100 dark:hover:bg-green-900/30"
                      }`}
                    >
                      Approved
                      {statusCounts && (
                        <span className="ml-2 bg-green-200 dark:bg-green-800 text-green-800 dark:text-green-200 text-xs px-2 py-0.5 rounded-full">
                          {statusCounts.approved}
                        </span>
                      )}
                    </button>
                    
                    <button
                      onClick={() => {
                        setStatus("rejected");
                        setCurrentPage(1);
                      }}
                      className={`inline-flex items-center px-4 py-2 rounded-md text-sm font-medium ${
                        status === "rejected" 
                          ? "bg-red-100 dark:bg-red-900/50 text-red-800 dark:text-red-300 ring-2 ring-red-300 dark:ring-red-700" 
                          : "bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-400 hover:bg-red-100 dark:hover:bg-red-900/30"
                      }`}
                    >
                      Rejected
                      {statusCounts && (
                        <span className="ml-2 bg-red-200 dark:bg-red-800 text-red-800 dark:text-red-200 text-xs px-2 py-0.5 rounded-full">
                          {statusCounts.rejected}
                        </span>
                      )}
                    </button>
                    
                    <button
                      onClick={() => {
                        setStatus("archived");
                        setCurrentPage(1);
                      }}
                      className={`inline-flex items-center px-4 py-2 rounded-md text-sm font-medium ${
                        status === "archived" 
                          ? "bg-gray-100 dark:bg-gray-800 text-gray-800 dark:text-gray-300 ring-2 ring-gray-300 dark:ring-gray-700" 
                          : "bg-gray-50 dark:bg-gray-800/50 text-gray-700 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800"
                      }`}
                    >
                      Archived
                      {statusCounts && (
                        <span className="ml-2 bg-gray-200 dark:bg-gray-700 text-gray-800 dark:text-gray-200 text-xs px-2 py-0.5 rounded-full">
                          {statusCounts.archived}
                        </span>
                      )}
                    </button>
                  </div>
                  
                  {/* Sort order dropdown */}
                  <div className="flex flex-wrap items-center justify-between mb-4">
                    <div className="text-sm text-muted-foreground">
                      {sortedPhotos.length} photos {status === "pending" ? "awaiting review" : 
                        status === "approved" ? "in the display rotation" : 
                        status === "rejected" ? "rejected" : "archived"}
                    </div>
                    
                    <div className="flex items-center">
                      <span className="text-sm text-muted-foreground mr-2">Sort by:</span>
                      <Select
                        value={sortOrder}
                        onValueChange={(value) => setSortOrder(value)}
                      >
                        <SelectTrigger className="w-[140px]">
                          <SelectValue placeholder="Sort by" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="newest">Newest first</SelectItem>
                          <SelectItem value="oldest">Oldest first</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                </div>
              </StyledCard>
              
              {/* Photo grid */}
              {isLoading ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                  {Array.from({ length: itemsPerPage }).map((_, index) => (
                    <Skeleton key={index} className="h-80 w-full rounded-md" />
                  ))}
                </div>
              ) : error ? (
                <StyledCard className="py-6">
                  <div className="w-full text-center">
                    <p className="text-red-600 dark:text-red-400">Error loading photos. Please try again later.</p>
                  </div>
                </StyledCard>
              ) : paginatedPhotos.length === 0 ? (
                <StyledCard className="py-12">
                  <div className="w-full text-center">
                    <p className="text-lg font-medium text-muted-foreground">No {status} photos found</p>
                    <p className="mt-1 text-muted-foreground">
                      {status === "pending" 
                        ? "All photos have been reviewed!" 
                        : status === "approved" 
                        ? "Photos that are approved will appear here and be added to the display rotation." 
                        : status === "rejected"
                        ? "Photos that are rejected will be stored here for your records."
                        : "Photos that are archived will appear here."}
                    </p>
                  </div>
                </StyledCard>
              ) : (
                <>
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                    {paginatedPhotos.map((photo) => (
                      <PhotoModerationCard key={photo.id} photo={photo} />
                    ))}
                  </div>
                  
                  {/* Pagination */}
                  {totalPages > 1 && (
                    <Pagination className="mt-6">
                      <PaginationContent>
                        <PaginationItem>
                          <PaginationPrevious
                            onClick={() => handlePageChange(Math.max(currentPage - 1, 1))}
                            className={currentPage === 1 ? "pointer-events-none opacity-50" : "cursor-pointer"}
                          />
                        </PaginationItem>
                        
                        {Array.from({ length: totalPages }).map((_, index) => {
                          const page = index + 1;
                          
                          // Show only a window of pages around the current page
                          if (
                            page === 1 ||
                            page === totalPages ||
                            (page >= currentPage - 2 && page <= currentPage + 2)
                          ) {
                            return (
                              <PaginationItem key={page}>
                                <PaginationLink
                                  onClick={() => handlePageChange(page)}
                                  isActive={page === currentPage}
                                  className="cursor-pointer"
                                >
                                  {page}
                                </PaginationLink>
                              </PaginationItem>
                            );
                          }
                          
                          // Add ellipsis
                          if (page === currentPage - 3 || page === currentPage + 3) {
                            return (
                              <PaginationItem key={page}>
                                <span className="px-4 py-2">...</span>
                              </PaginationItem>
                            );
                          }
                          
                          return null;
                        })}
                        
                        <PaginationItem>
                          <PaginationNext
                            onClick={() => handlePageChange(Math.min(currentPage + 1, totalPages))}
                            className={currentPage === totalPages ? "pointer-events-none opacity-50" : "cursor-pointer"}
                          />
                        </PaginationItem>
                      </PaginationContent>
                    </Pagination>
                  )}
                </>
              )}
            </TabsContent>
            
            <TabsContent value="display-rotation" className="mt-0">
              <DisplayRotationManager />
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </AdminLayout>
  );
}
