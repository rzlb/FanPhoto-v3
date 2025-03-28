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

export default function ModerationPage() {
  const [status, setStatus] = useState<string>("pending");
  const [sortOrder, setSortOrder] = useState<string>("newest");
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 9; // 3x3 grid
  
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
        <div className="max-w-7xl mx-auto px-4 sm:px-6 md:px-8">
          <h1 className="text-2xl font-semibold text-gray-900">Photo Management</h1>
          <p className="mt-1 text-sm text-gray-500">Review, approve, and manage photos for the display wall</p>
          
          {/* Photo stats summary */}
          {statusCounts && (
            <div className="mt-4 grid grid-cols-2 sm:grid-cols-4 gap-4">
              <div className="bg-white overflow-hidden shadow rounded-lg">
                <div className="px-4 py-4 sm:px-6">
                  <div className="flex items-center">
                    <div className="flex-shrink-0 bg-yellow-100 rounded-md p-2">
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-yellow-600" viewBox="0 0 20 20" fill="currentColor">
                        <path d="M10 2a8 8 0 100 16 8 8 0 000-16zm0 14a6 6 0 110-12 6 6 0 010 12z" />
                        <path d="M10 9a1 1 0 011 1v2a1 1 0 11-2 0v-2a1 1 0 011-1z" />
                        <path d="M10 6a1 1 0 110 2 1 1 0 010-2z" />
                      </svg>
                    </div>
                    <div className="ml-5 w-0 flex-1">
                      <dl>
                        <dt className="text-sm font-medium text-gray-500 truncate">Pending</dt>
                        <dd>
                          <div className="text-lg font-medium text-gray-900">{statusCounts.pending}</div>
                        </dd>
                      </dl>
                    </div>
                  </div>
                </div>
              </div>
              
              <div className="bg-white overflow-hidden shadow rounded-lg">
                <div className="px-4 py-4 sm:px-6">
                  <div className="flex items-center">
                    <div className="flex-shrink-0 bg-green-100 rounded-md p-2">
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-green-600" viewBox="0 0 20 20" fill="currentColor">
                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                      </svg>
                    </div>
                    <div className="ml-5 w-0 flex-1">
                      <dl>
                        <dt className="text-sm font-medium text-gray-500 truncate">Approved</dt>
                        <dd>
                          <div className="text-lg font-medium text-gray-900">{statusCounts.approved}</div>
                        </dd>
                      </dl>
                    </div>
                  </div>
                </div>
              </div>
              
              <div className="bg-white overflow-hidden shadow rounded-lg">
                <div className="px-4 py-4 sm:px-6">
                  <div className="flex items-center">
                    <div className="flex-shrink-0 bg-red-100 rounded-md p-2">
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-red-600" viewBox="0 0 20 20" fill="currentColor">
                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                      </svg>
                    </div>
                    <div className="ml-5 w-0 flex-1">
                      <dl>
                        <dt className="text-sm font-medium text-gray-500 truncate">Rejected</dt>
                        <dd>
                          <div className="text-lg font-medium text-gray-900">{statusCounts.rejected}</div>
                        </dd>
                      </dl>
                    </div>
                  </div>
                </div>
              </div>
              
              <div className="bg-white overflow-hidden shadow rounded-lg">
                <div className="px-4 py-4 sm:px-6">
                  <div className="flex items-center">
                    <div className="flex-shrink-0 bg-gray-100 rounded-md p-2">
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-gray-600" viewBox="0 0 20 20" fill="currentColor">
                        <path d="M4 3a2 2 0 100 4h12a2 2 0 100-4H4z" />
                        <path fillRule="evenodd" d="M3 8h14v7a2 2 0 01-2 2H5a2 2 0 01-2-2V8zm5 3a1 1 0 011-1h2a1 1 0 110 2H9a1 1 0 01-1-1z" clipRule="evenodd" />
                      </svg>
                    </div>
                    <div className="ml-5 w-0 flex-1">
                      <dl>
                        <dt className="text-sm font-medium text-gray-500 truncate">Archived</dt>
                        <dd>
                          <div className="text-lg font-medium text-gray-900">{statusCounts.archived}</div>
                        </dd>
                      </dl>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
        
        <div className="max-w-7xl mx-auto px-4 sm:px-6 md:px-8 mt-6">
          <Tabs defaultValue="moderation" className="w-full">
            <TabsList className="grid w-full grid-cols-2 mb-6">
              <TabsTrigger value="moderation">Photo Moderation</TabsTrigger>
              <TabsTrigger value="display-rotation">Display Rotation</TabsTrigger>
            </TabsList>
            
            <TabsContent value="moderation" className="mt-0">
              {/* Status filter buttons with counts */}
              <div className="bg-white px-4 py-5 border-b border-gray-200 sm:px-6 rounded-t-lg">
                <div className="mb-4">
                  <div className="flex flex-wrap gap-2">
                    <button
                      onClick={() => {
                        setStatus("pending");
                        setCurrentPage(1);
                      }}
                      className={`inline-flex items-center px-3 py-1.5 rounded-full text-sm font-medium ${
                        status === "pending" 
                          ? "bg-yellow-100 text-yellow-800 ring-2 ring-yellow-300" 
                          : "bg-yellow-50 text-yellow-700 hover:bg-yellow-100"
                      }`}
                    >
                      Pending
                      {statusCounts && (
                        <span className="ml-1.5 bg-yellow-200 text-yellow-800 text-xs px-1.5 py-0.5 rounded-full">
                          {statusCounts.pending}
                        </span>
                      )}
                    </button>
                    
                    <button
                      onClick={() => {
                        setStatus("approved");
                        setCurrentPage(1);
                      }}
                      className={`inline-flex items-center px-3 py-1.5 rounded-full text-sm font-medium ${
                        status === "approved" 
                          ? "bg-green-100 text-green-800 ring-2 ring-green-300" 
                          : "bg-green-50 text-green-700 hover:bg-green-100"
                      }`}
                    >
                      Approved
                      {statusCounts && (
                        <span className="ml-1.5 bg-green-200 text-green-800 text-xs px-1.5 py-0.5 rounded-full">
                          {statusCounts.approved}
                        </span>
                      )}
                    </button>
                    
                    <button
                      onClick={() => {
                        setStatus("rejected");
                        setCurrentPage(1);
                      }}
                      className={`inline-flex items-center px-3 py-1.5 rounded-full text-sm font-medium ${
                        status === "rejected" 
                          ? "bg-red-100 text-red-800 ring-2 ring-red-300" 
                          : "bg-red-50 text-red-700 hover:bg-red-100"
                      }`}
                    >
                      Rejected
                      {statusCounts && (
                        <span className="ml-1.5 bg-red-200 text-red-800 text-xs px-1.5 py-0.5 rounded-full">
                          {statusCounts.rejected}
                        </span>
                      )}
                    </button>
                    
                    <button
                      onClick={() => {
                        setStatus("archived");
                        setCurrentPage(1);
                      }}
                      className={`inline-flex items-center px-3 py-1.5 rounded-full text-sm font-medium ${
                        status === "archived" 
                          ? "bg-gray-200 text-gray-800 ring-2 ring-gray-300" 
                          : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                      }`}
                    >
                      Archived
                      {statusCounts && (
                        <span className="ml-1.5 bg-gray-300 text-gray-800 text-xs px-1.5 py-0.5 rounded-full">
                          {statusCounts.archived}
                        </span>
                      )}
                    </button>
                  </div>
                </div>
                
                {/* Filtering and sorting controls */}
                <div className="-ml-4 -mt-2 flex items-center justify-between flex-wrap sm:flex-nowrap">
                  <div className="ml-4 mt-2">
                    <h3 className="text-lg leading-6 font-medium text-gray-900">
                      {status.charAt(0).toUpperCase() + status.slice(1)} Photos 
                      {!isLoading && photos && <span className="text-sm text-gray-500 ml-2">({photos.length})</span>}
                    </h3>
                  </div>
                  <div className="ml-4 mt-2 flex-shrink-0">
                    <div className="flex items-center space-x-3">                      
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
            </TabsContent>
            
            <TabsContent value="display-rotation" className="mt-0">
              <div className="bg-white shadow overflow-hidden sm:rounded-lg">
                <div className="px-4 py-5 sm:px-6">
                  <h3 className="text-lg leading-6 font-medium text-gray-900">
                    Display Rotation Management
                  </h3>
                  <p className="mt-1 text-sm text-gray-500">
                    Manage the order and settings of photos shown in the display rotation
                  </p>
                </div>
                <div className="border-t border-gray-200 px-4 py-5 sm:px-6">
                  <DisplayRotationManager />
                </div>
              </div>
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </AdminLayout>
  );
}
