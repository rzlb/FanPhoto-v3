import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import DisplayCarousel from "@/components/display/DisplayCarousel";
import DisplayControls from "@/components/display/DisplayControls";

interface DisplayImage {
  id: number;
  originalPath: string;
  submitterName: string;
  createdAt: string;
}

interface DisplaySettings {
  id: number;
  backgroundPath: string | null;
  autoRotate: boolean;
  slideInterval: number;
  showInfo: boolean;
  transitionEffect: string;
  blacklistWords: string | null;
  updatedAt: string;
}

export default function DisplayPage() {
  const [isControlsVisible, setIsControlsVisible] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [interval, setInterval] = useState(8); // seconds

  // Fetch display settings
  const { data: settings, isLoading: isLoadingSettings } = useQuery<DisplaySettings>({
    queryKey: ["/api/display-settings"],
  });

  // Fetch images
  const { data: images, isLoading: isLoadingImages, error } = useQuery<DisplayImage[]>({
    queryKey: ["/api/display/images"],
    refetchInterval: isPaused ? false : interval * 1000, // Refetch based on slideshow interval
  });

  // Update local settings from fetched settings
  useEffect(() => {
    if (settings) {
      setIsPaused(!settings.autoRotate);
      setInterval(settings.slideInterval);
    }
  }, [settings]);

  // Handle mouse movement to show controls
  useEffect(() => {
    let timeout: NodeJS.Timeout;
    
    const handleMouseMove = () => {
      setIsControlsVisible(true);
      
      clearTimeout(timeout);
      timeout = setTimeout(() => {
        setIsControlsVisible(false);
      }, 3000);
    };

    document.addEventListener("mousemove", handleMouseMove);
    
    return () => {
      document.removeEventListener("mousemove", handleMouseMove);
      clearTimeout(timeout);
    };
  }, []);

  // Auto-advance slides when not paused
  useEffect(() => {
    if (!images || images.length === 0 || isPaused) return;
    
    const timer = setTimeout(() => {
      setCurrentIndex((prevIndex) => (prevIndex + 1) % images.length);
    }, interval * 1000);
    
    return () => clearTimeout(timer);
  }, [currentIndex, interval, isPaused, images]);

  const handlePrevious = () => {
    if (!images || images.length === 0) return;
    setCurrentIndex((prevIndex) => (prevIndex - 1 + images.length) % images.length);
  };

  const handleNext = () => {
    if (!images || images.length === 0) return;
    setCurrentIndex((prevIndex) => (prevIndex + 1) % images.length);
  };

  // Create background style
  const backgroundStyle = settings?.backgroundPath 
    ? { backgroundImage: `url(${settings.backgroundPath})`, backgroundSize: 'cover', backgroundPosition: 'center' }
    : { backgroundColor: 'black' };

  const isLoading = isLoadingSettings || isLoadingImages;

  return (
    <div 
      className="fixed inset-0 flex items-center justify-center font-[Arial]"
      style={backgroundStyle}
    >
      {/* Semi-transparent overlay */}
      {settings?.backgroundPath && (
        <div className="absolute inset-0 bg-black bg-opacity-60"></div>
      )}
      
      {/* RWS Logo */}
      <div className="absolute top-6 left-6 z-10">
        <img src="/assets/rws-logo.png" alt="RWS Logo" className="h-10 md:h-14" />
      </div>
      
      {isLoading ? (
        <div className="text-white text-xl glow-text">Loading presentation...</div>
      ) : error ? (
        <div className="text-red-500 text-xl glow-text">
          Error loading images: {error instanceof Error ? error.message : "Unknown error"}
        </div>
      ) : !images || images.length === 0 ? (
        <div className="flex flex-col items-center justify-center h-full w-full">
          <div className="text-white text-2xl glow-text mb-4">No approved images available</div>
          <div className="text-gray-300 text-lg">Upload photos by scanning the QR code at the venue</div>
        </div>
      ) : (
        <>
          <DisplayCarousel 
            images={images} 
            currentIndex={currentIndex}
            showInfo={settings?.showInfo ?? true}
            transitionEffect={settings?.transitionEffect ?? "slide"}
          />
          
          <DisplayControls 
            isVisible={isControlsVisible}
            isPaused={isPaused}
            onPauseToggle={() => setIsPaused(!isPaused)}
            onPrevious={handlePrevious}
            onNext={handleNext}
            currentIndex={currentIndex}
            totalImages={images.length}
            interval={interval}
            onIntervalChange={setInterval}
          />
        </>
      )}
    </div>
  );
}
