import { useState, useRef, DragEvent, ChangeEvent } from "react";
import { apiRequest } from "@/lib/queryClient";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { Form, FormControl, FormField, FormItem, FormLabel } from "@/components/ui/form";
import CameraCapture from "./CameraCapture";
import { Camera } from "lucide-react";

// Define form schema
const formSchema = z.object({
  submitterName: z.string().optional(),
  caption: z.string().max(200, "Caption must be 200 characters or less").optional(),
});

type FormValues = z.infer<typeof formSchema>;

export default function PhotoUploader() {
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  const [captionLength, setCaptionLength] = useState(0);
  const [showCameraCapture, setShowCameraCapture] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();

  // Initialize form
  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      submitterName: "",
      caption: "",
    },
  });

  const handleDragOver = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.currentTarget.classList.add("border-primary");
  };

  const handleDragLeave = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.currentTarget.classList.remove("border-primary");
  };

  const handleDrop = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.currentTarget.classList.remove("border-primary");
    
    if (e.dataTransfer.files) {
      handleFiles(e.dataTransfer.files);
    }
  };

  const handleFileInput = (e: ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      handleFiles(e.target.files);
    }
  };

  const handleFiles = (fileList: FileList) => {
    const files = Array.from(fileList).filter(file => file.type.startsWith('image/'));
    
    // Limit to 1 file
    const newFile = files.slice(0, 1);
    
    if (newFile.length === 0) {
      toast({
        title: "Invalid file",
        description: "Please select an image file only (JPG, PNG, etc).",
        variant: "destructive",
      });
      return;
    }
    
    setSelectedFiles(newFile);
  };
  
  const handleCameraCapture = (file: File) => {
    setSelectedFiles([file]);
    setShowCameraCapture(false);
  };

  const removeFile = (index: number) => {
    setSelectedFiles(selectedFiles.filter((_, i) => i !== index));
  };

  const clearSelection = () => {
    setSelectedFiles([]);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const onSubmit = async (data: FormValues) => {
    if (selectedFiles.length === 0) {
      toast({
        title: "No file selected",
        description: "Please select a photo to upload.",
        variant: "destructive",
      });
      return;
    }

    setIsUploading(true);

    try {
      const formData = new FormData();
      
      selectedFiles.forEach(file => {
        formData.append("photos", file);
      });
      
      if (data.submitterName) {
        formData.append("submitterName", data.submitterName);
      }
      
      if (data.caption) {
        formData.append("caption", data.caption);
      }

      const response = await fetch("/api/photos/upload", {
        method: "POST",
        body: formData,
        credentials: "include",
      });

      if (!response.ok) {
        throw new Error(`Upload failed: ${response.status} ${response.statusText}`);
      }

      toast({
        title: "Upload successful!",
        description: "Your photo has been submitted for moderation.",
      });

      // Reset form
      clearSelection();
      form.reset();
    } catch (error) {
      console.error("Upload error:", error);
      toast({
        title: "Upload failed",
        description: "There was an error uploading your photo. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="w-full max-w-md">
        {showCameraCapture && (
          <CameraCapture 
            onCapture={handleCameraCapture}
            onClose={() => setShowCameraCapture(false)}
          />
        )}
        <div className="space-y-5">
          <FormField
            control={form.control}
            name="submitterName"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="text-gray-800 font-medium">Your Name (Optional)</FormLabel>
                <FormControl>
                  <Input
                    placeholder="Enter your name"
                    className="mt-1 block w-full rounded-md bg-white border-gray-300 text-gray-800 shadow-sm p-2 border focus:border-blue-500 focus:ring-blue-500"
                    {...field}
                  />
                </FormControl>
              </FormItem>
            )}
          />
          
          <FormField
            control={form.control}
            name="caption"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="text-gray-800 font-medium">Caption (Optional)</FormLabel>
                <FormControl>
                  <div className="relative">
                    <textarea
                      placeholder="Add a caption to your photo (max 200 characters)"
                      className="mt-1 block w-full rounded-md bg-white border-gray-300 text-gray-800 shadow-sm p-2 border focus:border-blue-500 focus:ring-blue-500 min-h-[80px]"
                      maxLength={200}
                      onChange={(e) => {
                        field.onChange(e);
                        setCaptionLength(e.target.value.length);
                      }}
                      value={field.value || ""}
                    />
                    <div className="absolute bottom-2 right-2 text-xs text-gray-500">
                      {captionLength}/200
                    </div>
                  </div>
                </FormControl>
              </FormItem>
            )}
          />

          <div
            className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center hover:border-blue-500 transition-colors cursor-pointer bg-gray-50"
            onClick={() => fileInputRef.current?.click()}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
          >
            <div className="mx-auto flex flex-col items-center">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12 text-blue-500 mb-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6.996 6 6 6H4a2 2 0 00-2 2v2a2 2 0 002 2h16a2 2 0 002-2V8a2 2 0 00-2-2h-3.5V6a1 1 0 10-2 0v.5h-3.5V6a1 1 0 10-2 0v.5h-1.996l-1-1z" />
              </svg>
              <p className="text-sm text-gray-600 mb-1">Drag & drop your photo here</p>
              <p className="text-xs text-gray-500">or</p>
              <div className="flex gap-2 mt-3">
                <Button
                  type="button"
                  className="px-5 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-all duration-200 text-sm font-medium hover:scale-105"
                >
                  Browse Files
                </Button>
                <Button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    setShowCameraCapture(true);
                  }}
                  className="px-5 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 transition-all duration-200 text-sm font-medium hover:scale-105"
                >
                  <Camera className="h-4 w-4 mr-1" />
                  Take Photo
                </Button>
              </div>
              <input
                type="file"
                id="file-upload"
                ref={fileInputRef}
                className="hidden"
                accept="image/*"
                onChange={handleFileInput}
              />
              <p className="text-xs text-gray-500 mt-3">Upload 1 photo at a time (JPG, PNG)</p>
            </div>
          </div>

          {/* Preview area for selected photos */}
          {selectedFiles.length > 0 && (
            <div className="mt-5 bg-gray-50 rounded-lg p-4 border border-gray-200">
              <h3 className="font-medium text-gray-800 mb-3">Selected Photo</h3>
              <div className="grid grid-cols-3 gap-3">
                {selectedFiles.map((file, index) => (
                  <div key={index} className="relative aspect-square bg-white rounded-md overflow-hidden shadow-sm border border-gray-200">
                    <img
                      src={URL.createObjectURL(file)}
                      className="w-full h-full object-cover"
                      alt={`Preview ${index + 1}`}
                    />
                    <button
                      type="button"
                      className="absolute top-1 right-1 bg-white bg-opacity-80 rounded-full p-1.5 text-gray-700 hover:bg-opacity-100 transition-all duration-200 shadow-sm"
                      onClick={(e) => {
                        e.stopPropagation();
                        removeFile(index);
                      }}
                    >
                      <svg className="h-4 w-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </button>
                  </div>
                ))}
              </div>
              <div className="flex justify-between items-center mt-4">
                <button
                  type="button"
                  className="text-sm text-gray-500 hover:text-gray-700 transition-colors"
                  onClick={clearSelection}
                >
                  Clear selection
                </button>
                <span className="text-xs text-blue-600 bg-blue-50 px-2 py-1 rounded-md border border-blue-100">
                  <span className="font-bold">{selectedFiles.length}</span>/1 photo
                </span>
              </div>
            </div>
          )}
        </div>

        <div className="mt-6">
          <Button
            type="submit"
            className="w-full bg-blue-600 text-white py-3 px-4 rounded-md hover:bg-blue-700 transition-all duration-200 font-medium hover:scale-105"
            disabled={isUploading}
          >
            {isUploading ? (
              <div className="flex items-center justify-center">
                <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                Uploading...
              </div>
            ) : (
              "Submit Photo"
            )}
          </Button>
        </div>
      </form>
    </Form>
  );
}
