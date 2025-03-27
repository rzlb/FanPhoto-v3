import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import DisplayCarousel from "@/components/display/DisplayCarousel";
import DisplayControls from "@/components/display/DisplayControls";

interface DisplayImage {
  id: number;
  originalPath: string;
  transformedPath: string;
  stylePreset: string;
  submitterName: string;
  createdAt: string;
}

export default function DisplayPage() {
  const [isControlsVisible, setIsControlsVisible] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [interval, setInterval] = useState(8); // seconds

  const { data: images, isLoading, error } = useQuery<DisplayImage[]>({
    queryKey: ["/api/display/images"],
    refetchInterval: isPaused ? false : interval * 1000, // Refetch based on slideshow interval
  });

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

  return (
    <div className="fixed inset-0 bg-black flex items-center justify-center">
      {isLoading ? (
        <div className="text-white text-xl">Loading presentation...</div>
      ) : error ? (
        <div className="text-red-500 text-xl">
          Error loading images: {error instanceof Error ? error.message : "Unknown error"}
        </div>
      ) : !images || images.length === 0 ? (
        <div className="text-white text-xl">No approved images available for display</div>
      ) : (
        <>
          <DisplayCarousel 
            images={images} 
            currentIndex={currentIndex} 
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
