import { useState } from "react";
import AdminLayout from "@/components/shared/AdminLayout";
import TransformationSettingsForm from "@/components/transformation/TransformationSettings";
import TransformationCard from "@/components/transformation/TransformationCard";
import { useQuery } from "@tanstack/react-query";
import { Transformation } from "@shared/schema";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Pagination, PaginationContent, PaginationItem, PaginationLink, PaginationNext, PaginationPrevious } from "@/components/ui/pagination";
import { Skeleton } from "@/components/ui/skeleton";

interface TransformationWithPhoto extends Transformation {
  originalPhoto: {
    id: number;
    originalPath: string;
    submitterName?: string;
  };
}

export default function TransformationsPage() {
  const [status, setStatus] = useState<string>("pending");
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 6; // 3x2 grid
  
  const { data: transformations, isLoading, error } = useQuery<TransformationWithPhoto[]>({
    queryKey: ["/api/transformations", status],
    queryFn: async ({ queryKey }) => {
      const response = await fetch(`/api/transformations?status=${queryKey[1]}`);
      if (!response.ok) {
        throw new Error("Failed to fetch transformations");
      }
      return response.json();
    },
  });
  
  // Calculate pagination
  const totalPages = Math.ceil((transformations?.length || 0) / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const paginatedTransformations = transformations?.slice(startIndex, startIndex + itemsPerPage) || [];
  
  // Handle page change
  const handlePageChange = (page: number) => {
    setCurrentPage(page);
    window.scrollTo(0, 0);
  };
  
  return (
    <AdminLayout>
      <div className="py-6">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 md:px-8">
          <h1 className="text-2xl font-semibold text-gray-900">AI Transformations</h1>
          <p className="mt-1 text-sm text-gray-500">Apply AI styles and review transformed images</p>
        </div>
        
        <div className="max-w-7xl mx-auto px-4 sm:px-6 md:px-8 mt-6">
          {/* AI Style Configuration */}
          <TransformationSettingsForm />
          
          {/* Transformed Images */}
          <div className="bg-white shadow rounded-lg">
            <div className="px-4 py-5 border-b border-gray-200 sm:px-6">
              <div className="-ml-4 -mt-2 flex items-center justify-between flex-wrap sm:flex-nowrap">
                <div className="ml-4 mt-2">
                  <h3 className="text-lg leading-6 font-medium text-gray-900">
                    Transformed Images 
                    {!isLoading && transformations && <span className="text-sm text-gray-500 ml-2">({transformations.length})</span>}
                  </h3>
                </div>
                <div className="ml-4 mt-2 flex-shrink-0">
                  <Select value={status} onValueChange={setStatus}>
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder="Filter by status" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Transformations</SelectItem>
                      <SelectItem value="pending">Pending Review</SelectItem>
                      <SelectItem value="approved">Approved</SelectItem>
                      <SelectItem value="rejected">Rejected</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>
            
            <div className="px-4 py-5 sm:p-6">
              {isLoading ? (
                <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
                  {Array(6).fill(null).map((_, i) => (
                    <div key={i} className="col-span-1 bg-white rounded-lg shadow divide-y divide-gray-200 border border-gray-200">
                      <div className="w-full p-4">
                        <div className="flex items-center justify-between mb-4">
                          <Skeleton className="h-5 w-32" />
                          <Skeleton className="h-5 w-20 rounded-full" />
                        </div>
                        <div className="grid grid-cols-2 gap-3">
                          <Skeleton className="h-40 w-full rounded-md" />
                          <Skeleton className="h-40 w-full rounded-md" />
                        </div>
                        <div className="mt-3">
                          <Skeleton className="h-4 w-48 mt-2" />
                        </div>
                      </div>
                      <div className="p-4">
                        <div className="flex space-x-3">
                          <Skeleton className="h-10 flex-grow rounded-md" />
                          <Skeleton className="h-10 flex-grow rounded-md" />
                          <Skeleton className="h-10 w-10 rounded-md" />
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : error ? (
                <div className="text-center text-red-500 p-6">
                  <p>Error loading transformations: {error instanceof Error ? error.message : "Unknown error"}</p>
                </div>
              ) : paginatedTransformations.length === 0 ? (
                <div className="text-center text-gray-500 p-12">
                  <p>No {status} transformations found.</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
                  {paginatedTransformations.map(transformation => (
                    <TransformationCard
                      key={transformation.id}
                      id={transformation.id}
                      originalImageUrl={transformation.originalPhoto.originalPath}
                      transformedImageUrl={transformation.transformedPath}
                      stylePreset={transformation.stylePreset}
                      createdAt={transformation.createdAt}
                      status={transformation.status}
                    />
                  ))}
                </div>
              )}
            </div>
            
            {/* Pagination */}
            {!isLoading && !error && totalPages > 1 && (
              <div className="bg-gray-50 px-4 py-4 sm:px-6 border-t border-gray-200">
                <div className="flex items-center justify-between">
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
                        <span className="font-medium">{Math.min(startIndex + itemsPerPage, transformations?.length || 0)}</span> of{" "}
                        <span className="font-medium">{transformations?.length || 0}</span> transformations
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
              </div>
            )}
          </div>
        </div>
      </div>
    </AdminLayout>
  );
}
