import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useQuery } from "@tanstack/react-query";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/hooks/use-toast";

interface QrCodeResponse {
  uploadUrl: string;
  qrCodeUrl: string;
}

export default function QrCodeCard() {
  const { toast } = useToast();
  const [qrSize, setQrSize] = useState(200);
  
  const { data, isLoading, error } = useQuery<QrCodeResponse>({
    queryKey: ["/api/qrcode"],
  });

  const downloadQrCode = async () => {
    if (!data?.qrCodeUrl) return;
    
    try {
      const response = await fetch(data.qrCodeUrl);
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      
      const a = document.createElement("a");
      a.style.display = "none";
      a.href = url;
      a.download = "event-qrcode.png";
      document.body.appendChild(a);
      a.click();
      
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (err) {
      toast({
        title: "Download failed",
        description: "Could not download the QR code. Please try again.",
        variant: "destructive",
      });
    }
  };

  const copyUrl = () => {
    if (!data?.uploadUrl) return;
    
    navigator.clipboard.writeText(data.uploadUrl)
      .then(() => {
        toast({
          title: "Copied to clipboard",
          description: "URL has been copied to clipboard",
        });
      })
      .catch(() => {
        toast({
          title: "Copy failed",
          description: "Could not copy URL to clipboard",
          variant: "destructive",
        });
      });
  };

  return (
    <div className="mt-8 bg-white shadow overflow-hidden sm:rounded-lg">
      <div className="px-4 py-5 sm:px-6 flex justify-between items-center">
        <div>
          <h2 className="text-lg leading-6 font-medium text-gray-900">Event QR Code</h2>
          <p className="mt-1 max-w-2xl text-sm text-gray-500">Share this QR code for attendees to upload photos.</p>
        </div>
        <Button
          onClick={downloadQrCode}
          disabled={isLoading || Boolean(error)}
          className="inline-flex items-center px-3 py-2 border border-transparent text-sm leading-4 font-medium rounded-md text-white bg-primary hover:bg-primary/90 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary"
        >
          <svg className="-ml-0.5 mr-2 h-4 w-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
          </svg>
          Download
        </Button>
      </div>
      <div className="border-t border-gray-200 px-4 py-5 sm:p-6 flex justify-center">
        <div className="w-64 h-64 bg-white p-4 shadow-sm border border-gray-200 rounded-lg flex items-center justify-center">
          {isLoading ? (
            <Skeleton className="w-full h-full" />
          ) : error ? (
            <div className="text-red-500 text-center">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12 mx-auto mb-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
              <p>Failed to load QR code</p>
            </div>
          ) : (
            <img 
              src={data?.qrCodeUrl} 
              alt="Event QR Code" 
              className="w-full h-full" 
            />
          )}
        </div>
      </div>
      <div className="bg-gray-50 px-4 py-4 sm:px-6">
        <div className="text-sm">
          <span className="font-medium text-gray-500">URL:</span>
          <span className="ml-1 text-gray-900">{data?.uploadUrl || "Loading..."}</span>
          <button 
            type="button" 
            className="ml-2 text-primary hover:text-primary/80 focus:outline-none" 
            onClick={copyUrl}
            disabled={isLoading || Boolean(error)}
          >
            <svg className="h-4 w-4 inline" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
            </svg>
          </button>
        </div>
      </div>
    </div>
  );
}
