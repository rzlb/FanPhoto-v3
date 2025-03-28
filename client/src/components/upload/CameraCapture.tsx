import React, { useRef, useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { X, Camera, RotateCcw } from "lucide-react";

interface CameraCaptureProps {
  onCapture: (file: File) => void;
  onClose: () => void;
}

export default function CameraCapture({ onCapture, onClose }: CameraCaptureProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [capturedImage, setCapturedImage] = useState<string | null>(null);
  const [isCameraAvailable, setIsCameraAvailable] = useState(true);
  const [facingMode, setFacingMode] = useState<"user" | "environment">("environment");

  // Start camera on component mount
  useEffect(() => {
    startCamera();
    
    // Clean up on unmount
    return () => {
      if (stream) {
        stream.getTracks().forEach(track => track.stop());
      }
    };
  }, [facingMode]);

  const startCamera = async () => {
    try {
      // Stop existing stream if any
      if (stream) {
        stream.getTracks().forEach(track => track.stop());
      }
      
      // Request camera access
      const mediaStream = await navigator.mediaDevices.getUserMedia({
        video: { 
          facingMode: facingMode,
          width: { ideal: 1280 },
          height: { ideal: 720 }
        },
        audio: false
      });
      
      setStream(mediaStream);
      
      if (videoRef.current) {
        videoRef.current.srcObject = mediaStream;
      }
      
      setCapturedImage(null);
      setIsCameraAvailable(true);
    } catch (err) {
      console.error("Error accessing camera:", err);
      setIsCameraAvailable(false);
    }
  };

  const switchCamera = () => {
    setFacingMode(prev => prev === "user" ? "environment" : "user");
  };

  const takePhoto = () => {
    if (videoRef.current && canvasRef.current) {
      const video = videoRef.current;
      const canvas = canvasRef.current;
      
      // Match canvas size to video dimensions
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      
      // Draw current video frame on canvas
      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
        
        // Convert canvas to image data URL
        const imageDataUrl = canvas.toDataURL('image/jpeg');
        setCapturedImage(imageDataUrl);
        
        // Stop video stream
        if (stream) {
          stream.getTracks().forEach(track => track.stop());
          setStream(null);
        }
      }
    }
  };

  const retakePhoto = () => {
    setCapturedImage(null);
    startCamera();
  };

  const usePhoto = () => {
    if (capturedImage) {
      // Convert data URL to File object
      fetch(capturedImage)
        .then(res => res.blob())
        .then(blob => {
          const file = new File([blob], `camera-capture-${Date.now()}.jpg`, { type: 'image/jpeg' });
          onCapture(file);
        });
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-75 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-lg shadow-lg overflow-hidden max-w-md w-full">
        <div className="flex justify-between items-center p-4 bg-gray-50 border-b">
          <h3 className="font-medium text-lg">Take a Photo</h3>
          <Button 
            variant="ghost" 
            size="icon" 
            onClick={onClose}
            className="h-8 w-8 rounded-full"
          >
            <X className="h-4 w-4" />
          </Button>
        </div>
        
        <div className="relative aspect-[4/3] bg-black w-full">
          {!capturedImage ? (
            <>
              {isCameraAvailable ? (
                <>
                  <video
                    ref={videoRef}
                    autoPlay
                    playsInline
                    muted
                    className="w-full h-full object-cover"
                  />
                  <div className="absolute bottom-3 left-0 right-0 flex justify-center">
                    <Button 
                      onClick={takePhoto}
                      size="lg"
                      className="rounded-full h-14 w-14 bg-white text-blue-600 shadow-lg hover:bg-gray-100"
                    >
                      <Camera className="h-6 w-6" />
                    </Button>
                  </div>
                  <Button
                    onClick={switchCamera}
                    size="sm"
                    className="absolute top-3 right-3 bg-white bg-opacity-80 text-gray-800 rounded-full"
                  >
                    <RotateCcw className="h-4 w-4 mr-1" />
                    Switch
                  </Button>
                </>
              ) : (
                <div className="w-full h-full flex items-center justify-center flex-col p-6 text-white">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12 text-gray-300 mb-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                  </svg>
                  <p className="text-center text-gray-300 mb-4">
                    Could not access camera. Please make sure you've granted camera permissions or try using file upload instead.
                  </p>
                  <Button onClick={onClose} className="bg-white text-gray-800">
                    Use File Upload
                  </Button>
                </div>
              )}
            </>
          ) : (
            <img 
              src={capturedImage} 
              alt="Captured" 
              className="w-full h-full object-cover"
            />
          )}
          <canvas ref={canvasRef} className="hidden" />
        </div>
        
        {capturedImage && (
          <div className="p-4 flex justify-between">
            <Button
              variant="outline"
              onClick={retakePhoto}
              className="border-blue-500 text-blue-500 hover:bg-blue-50"
            >
              Retake
            </Button>
            <Button
              onClick={usePhoto}
              className="bg-blue-600 hover:bg-blue-700 text-white"
            >
              Use This Photo
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}