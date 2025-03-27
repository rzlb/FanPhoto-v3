import { useState } from "react";
import AdminLayout from "@/components/shared/AdminLayout";
import PhotoModerationCard from "@/components/moderation/PhotoModerationCard";
import { useQuery } from "@tanstack/react-query";
import { Photo } from "@shared/schema";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { Pagination, PaginationContent, PaginationItem, PaginationLink, PaginationNext, PaginationPrevious } from "@/components/ui/pagination";

export default function ModerationPage() {
  const [status, setStatus] = useState<string>("pending");
  const [sortOrder, setSortOrder] = useState<string>("newest");
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 9; // 3x3 grid
  
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
        <div className="max-w-7xl mx-auto px-4 sm:px-6 md:px-8">
          <h1 className="text-2xl font-semibold text-gray-900">Photo Moderation</h1>
          <p className="mt-1 text-sm text-gray-500">Review and approve uploaded photos before processing</p>
        </div>
        
        <div className="max-w-7xl mx-auto px-4 sm:px-6 md:px-8 mt-6">
          {/* Filtering and sorting controls */}
          <div className="bg-white px-4 py-5 border-b border-gray-200 sm:px-6 rounded-t-lg">
            <div className="-ml-4 -mt-2 flex items-center justify-between flex-wrap sm:flex-nowrap">
              <div className="ml-4 mt-2">
                <h3 className="text-lg leading-6 font-medium text-gray-900">
                  {status.charAt(0).toUpperCase() + status.slice(1)} Photos 
                  {!isLoading && photos && <span className="text-sm text-gray-500 ml-2">({photos.length})</span>}
                </h3>
              </div>
              <div className="ml-4 mt-2 flex-shrink-0">
                <div className="flex items-center space-x-3">
                  <Select value={status} onValueChange={setStatus}>
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder="Filter by status" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="pending">Pending</SelectItem>
                      <SelectItem value="approved">Approved</SelectItem>
                      <SelectItem value="rejected">Rejected</SelectItem>
                    </SelectContent>
                  </Select>
                  
                  <Select value={sortOrder} onValueChange={setSortOrder}>
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder="Sort order" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="newest">Newest First</SelectItem>
                      <SelectItem value="oldest">Oldest First</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>
          </div>
          
          {/* Photo grid for moderation */}
          <div className="bg-white shadow overflow-hidden sm:rounded-b-lg">
            {isLoading ? (
              <div className="p-6">
                <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
                  {Array(6).fill(null).map((_, i) => (
                    <div key={i} className="col-span-1 bg-white rounded-lg shadow divide-y divide-gray-200">
                      <div className="w-full flex flex-col p-4">
                        <Skeleton className="h-60 w-full mb-4 rounded-md" />
                        <div className="flex items-center justify-between">
                          <div>
                            <Skeleton className="h-4 w-20 mb-2" />
                            <Skeleton className="h-3 w-24" />
                          </div>
                          <Skeleton className="h-6 w-16 rounded-full" />
                        </div>
                      </div>
                      <div className="p-4">
                        <div className="flex space-x-2">
                          <Skeleton className="h-10 flex-1 rounded-md" />
                          <Skeleton className="h-10 flex-1 rounded-md" />
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ) : error ? (
              <div className="p-6 text-center text-red-500">
                <p>Error loading photos: {error instanceof Error ? error.message : "Unknown error"}</p>
              </div>
            ) : paginatedPhotos.length === 0 ? (
              <div className="p-12 text-center text-gray-500">
                <p>No {status} photos found.</p>
              </div>
            ) : (
              <div>
                <ul role="list" className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3 p-6">
                  {paginatedPhotos.map(photo => (
                    <PhotoModerationCard key={photo.id} photo={photo} />
                  ))}
                </ul>
                
                {/* Pagination */}
                {totalPages > 1 && (
                  <div className="bg-white px-4 py-3 border-t border-gray-200 sm:px-6 flex items-center justify-between">
                    <div className="flex-1 flex justify-between sm:hidden">
                      <button 
                        onClick={() => handlePageChange(Math.max(1, currentPage - 1))}
                        disabled={currentPage === 1}
                        className="relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50"
                      >
                        Previous
                      </button>
                      <button 
                        onClick={() => handlePageChange(Math.min(totalPages, currentPage + 1))}
                        disabled={currentPage === totalPages}
                        className="ml-3 relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50"
                      >
                        Next
                      </button>
                    </div>
                    <div className="hidden sm:flex-1 sm:flex sm:items-center sm:justify-between">
                      <div>
                        <p className="text-sm text-gray-700">
                          Showing <span className="font-medium">{startIndex + 1}</span> to{" "}
                          <span className="font-medium">{Math.min(startIndex + itemsPerPage, sortedPhotos.length)}</span> of{" "}
                          <span className="font-medium">{sortedPhotos.length}</span> photos
                        </p>
                      </div>
                      <Pagination>
                        <PaginationContent>
                          <PaginationItem>
                            <PaginationPrevious 
                              onClick={() => handlePageChange(currentPage - 1)}
                              className={currentPage === 1 ? "pointer-events-none opacity-50" : ""}
                            />
                          </PaginationItem>
                          
                          {Array.from({ length: totalPages }, (_, i) => i + 1).map(page => (
                            <PaginationItem key={page}>
                              <PaginationLink 
                                onClick={() => handlePageChange(page)}
                                isActive={currentPage === page}
                              >
                                {page}
                              </PaginationLink>
                            </PaginationItem>
                          ))}
                          
                          <PaginationItem>
                            <PaginationNext 
                              onClick={() => handlePageChange(currentPage + 1)}
                              className={currentPage === totalPages ? "pointer-events-none opacity-50" : ""}
                            />
                          </PaginationItem>
                        </PaginationContent>
                      </Pagination>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </AdminLayout>
  );
}
