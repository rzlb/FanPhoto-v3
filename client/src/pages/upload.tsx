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
    <div className="min-h-screen w-full flex flex-col items-center bg-app-gradient font-[Arial]">
      <div className="w-full max-w-lg mx-auto px-4 py-8 flex flex-col items-center">
        {/* Header with logo */}
        <div className="flex items-center justify-center mb-6">
          <img src="/assets/rws-logo.png" alt="RWS Logo" className="h-10 mr-4" />
          <h1 className="text-2xl font-bold text-white glow-text">RWS FanPhoto</h1>
        </div>
        
        <div className="text-center mb-8">
          <h2 className="text-2xl font-semibold text-white mb-3">Share Your {eventName} Photos</h2>
          <p className="text-gray-300">Upload your photos and see them displayed on the big screen!</p>
        </div>
        
        {/* Card container with sleek styling */}
        <div className="w-full bg-zinc-900/80 rounded-xl shadow-2xl p-6 border border-zinc-800">
          <PhotoUploader />
        </div>
        
        <p className="text-sm text-gray-400 text-center max-w-md mt-6">
          By uploading, you agree that your photos may be displayed publicly at this event.
        </p>
      </div>
    </div>
  );
}
