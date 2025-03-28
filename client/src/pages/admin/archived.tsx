import { useQuery } from "@tanstack/react-query";
import { Alert, AlertTitle, AlertDescription } from "@/components/ui/alert";
import { Skeleton } from "@/components/ui/skeleton";
import AdminLayout from "@/components/shared/AdminLayout";
import PhotoModerationCard from "@/components/moderation/PhotoModerationCard";
import { Photo } from "@shared/schema";

export default function ArchivedPage() {
  const { data: photos, isLoading, error } = useQuery<Photo[]>({
    queryKey: ["/api/photos", { status: "archived" }],
  });

  const renderContent = () => {
    if (isLoading) {
      return (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {Array(6).fill(null).map((_, i) => (
            <div key={i} className="col-span-1 bg-white rounded-lg shadow divide-y divide-gray-200">
              <div className="p-4">
                <Skeleton className="h-60 w-full rounded-md mb-4" />
                <div className="flex justify-between">
                  <div>
                    <Skeleton className="h-4 w-24 mb-2" />
                    <Skeleton className="h-3 w-16" />
                  </div>
                  <Skeleton className="h-6 w-16 rounded-full" />
                </div>
              </div>
              <div className="p-4">
                <div className="flex space-x-2 mb-2">
                  <Skeleton className="h-9 w-full rounded-md" />
                  <Skeleton className="h-9 w-full rounded-md" />
                </div>
              </div>
            </div>
          ))}
        </div>
      );
    }

    if (error) {
      return (
        <Alert variant="destructive" className="my-6">
          <AlertTitle>Error</AlertTitle>
          <AlertDescription>
            {error instanceof Error ? error.message : "Failed to load archived photos"}
          </AlertDescription>
        </Alert>
      );
    }

    if (!photos || photos.length === 0) {
      return (
        <Alert className="my-6 bg-blue-50 border-blue-200">
          <AlertTitle>No archived photos</AlertTitle>
          <AlertDescription>
            There are no archived photos to display. Archived photos will appear here.
          </AlertDescription>
        </Alert>
      );
    }

    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {photos.map(photo => (
          <PhotoModerationCard key={photo.id} photo={photo} />
        ))}
      </div>
    );
  };

  return (
    <AdminLayout>
      <div className="py-6">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 md:px-8">
          <h1 className="text-2xl font-semibold text-gray-900">Archived Photos</h1>
          <p className="mt-1 text-sm text-gray-500">
            View and manage archived photos. You can restore archived photos by approving them again.
          </p>
        </div>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 md:px-8 mt-6">
          {renderContent()}
        </div>
      </div>
    </AdminLayout>
  );
}