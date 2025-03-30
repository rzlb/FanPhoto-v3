import { useState } from "react";
import { Button } from "@/components/ui/button";
import { useQuery } from "@tanstack/react-query";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/hooks/use-toast";
import { StyledCard } from "@/components/ui/styled-card";
import { Download, Copy, AlertTriangle } from "lucide-react";

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
    <StyledCard className="mt-8" title="Event QR Code" description="Share this QR code for attendees to upload photos.">
      <div className="flex flex-col sm:flex-row items-center justify-center gap-8 py-4">
        <div className="w-64 h-64 bg-card p-4 shadow-sm border border-border rounded-lg flex items-center justify-center">
          {isLoading ? (
            <Skeleton className="w-full h-full" />
          ) : error ? (
            <div className="text-destructive text-center">
              <AlertTriangle className="h-12 w-12 mx-auto mb-2" />
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
        
        <div className="flex flex-col gap-4">
          <div className="flex flex-col gap-2">
            <span className="font-medium text-muted-foreground">URL:</span>
            <div className="flex items-center gap-2">
              <span className="text-foreground">{data?.uploadUrl || "Loading..."}</span>
              <Button
                size="icon"
                variant="outline"
                onClick={copyUrl}
                disabled={isLoading || Boolean(error)}
                className="rounded-full h-8 w-8"
              >
                <Copy className="h-4 w-4" />
                <span className="sr-only">Copy URL</span>
              </Button>
            </div>
          </div>
          
          <Button
            onClick={downloadQrCode}
            disabled={isLoading || Boolean(error)}
            className="mt-4"
          >
            <Download className="mr-2 h-4 w-4" />
            Download QR Code
          </Button>
        </div>
      </div>
    </StyledCard>
  );
}
