import { useState } from "react";
import AdminLayout from "@/components/shared/AdminLayout";
import { Card, CardContent } from "@/components/ui/card";
import DisplaySettingsForm from "@/components/display-settings/DisplaySettingsForm";
import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { ExternalLink } from "lucide-react";
import { Link } from "wouter";

interface DisplayImage {
  id: number;
  originalPath: string;
  transformedPath: string;
  stylePreset: string;
  submitterName: string;
  createdAt: string;
}

export default function DisplaySettingsPage() {
  const { data: displayImages, isLoading } = useQuery<DisplayImage[]>({
    queryKey: ["/api/display/images"],
  });

  return (
    <AdminLayout>
      <div className="py-6">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 md:px-8">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-2xl font-semibold text-gray-900">Display Settings</h1>
              <p className="mt-1 text-sm text-gray-500">Configure how images are displayed on the public screen</p>
            </div>
            <Link href="/display" target="_blank">
              <Button className="flex items-center gap-2">
                Open Display <ExternalLink className="h-4 w-4" />
              </Button>
            </Link>
          </div>
        </div>
        
        <div className="max-w-7xl mx-auto px-4 sm:px-6 md:px-8 mt-6">
          <DisplaySettingsForm />

          <div className="mt-8">
            <h2 className="text-lg leading-6 font-medium text-gray-900 mb-4">Images in Display Rotation</h2>
            
            {isLoading ? (
              <div className="text-center py-8">Loading display images...</div>
            ) : !displayImages || displayImages.length === 0 ? (
              <Card>
                <CardContent className="py-8 text-center">
                  <p className="text-gray-500">No approved transformed images available for display.</p>
                  <p className="text-sm text-gray-400 mt-2">Moderate and approve transformations to see them here.</p>
                </CardContent>
              </Card>
            ) : (
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
                {displayImages.map((image) => (
                  <div key={image.id} className="relative group">
                    <div className="aspect-square rounded-md overflow-hidden bg-gray-100 border border-gray-200">
                      <img
                        src={image.transformedPath}
                        alt={`Transformed photo by ${image.submitterName}`}
                        className="w-full h-full object-cover"
                      />
                    </div>
                    <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-30 transition-all flex items-center justify-center opacity-0 group-hover:opacity-100">
                      <Button variant="outline" size="sm" className="bg-white text-xs">
                        Remove from rotation
                      </Button>
                    </div>
                    <div className="mt-1 px-1">
                      <p className="text-xs text-gray-900 truncate">{image.submitterName}</p>
                      <p className="text-xs text-gray-500 truncate">{image.stylePreset}</p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </AdminLayout>
  );
}
