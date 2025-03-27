import { useEffect, useState } from "react";
import PhotoUploader from "@/components/upload/PhotoUploader";

export default function UploadPage() {
  const [eventName, setEventName] = useState("Event");
  
  // Get event name from query param if available
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const name = params.get("event");
    if (name) {
      setEventName(name);
    }
  }, []);

  return (
    <div className="min-h-screen w-full flex flex-col items-center bg-gray-50">
      <div className="w-full max-w-lg mx-auto px-4 py-8 flex flex-col items-center">
        <div className="text-center mb-8">
          <h1 className="text-2xl font-semibold text-gray-900 mb-2">Share Your {eventName} Photos</h1>
          <p className="text-gray-500">Upload your photos and see them transformed on the big screen!</p>
        </div>
        
        <PhotoUploader />
        
        <p className="text-sm text-gray-500 text-center max-w-md mt-4">
          By uploading, you agree that your photos may be displayed publicly at this event and used for AI transformations.
        </p>
      </div>
    </div>
  );
}
