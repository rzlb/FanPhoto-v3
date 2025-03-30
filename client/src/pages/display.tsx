import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import DisplayCarousel from "@/components/display/DisplayCarousel";
import DisplayControls from "@/components/display/DisplayControls";
import "../styles/display.css"; // Import the custom display CSS

interface DisplayImage {
  id: number;
  originalPath: string;
  submitterName: string;
  caption?: string;
  displayOrder?: number;
  createdAt: string;
}

interface DisplaySettings {
  id: number;
  backgroundPath: string | null;
  logoPath: string | null;
  displayFormat: string;
  autoRotate: boolean;
  slideInterval: number;
  showInfo: boolean;
  showCaptions: boolean;
  separateCaptions: boolean;
  transitionEffect: string;
  blacklistWords: string | null;
  borderStyle: string;
  borderWidth: number;
  borderColor: string;
  fontFamily: string;
  fontColor: string;
  fontSize: number;
  imagePosition: string;
  captionBgColor: string;
  captionFontFamily: string;
  captionFontColor: string;
  captionFontSize: number;
  textPosition: string;
  textAlignment: string;
  textPadding: number;
  textMaxWidth: string;
  textBackground: boolean;
  textBackgroundColor: string;
  textBackgroundOpacity: number;
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
  const { data: rawImages, isLoading: isLoadingImages, error } = useQuery<DisplayImage[]>({
    queryKey: ["/api/display/images"],
    refetchInterval: isPaused ? false : interval * 1000, // Refetch based on slideshow interval
  });
  
  // Sort images by displayOrder
  const images = rawImages ? [...rawImages].sort((a, b) => {
    const orderA = a.displayOrder !== undefined ? a.displayOrder : Number.MAX_SAFE_INTEGER;
    const orderB = b.displayOrder !== undefined ? b.displayOrder : Number.MAX_SAFE_INTEGER;
    return orderA - orderB;
  }) : undefined;

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
    ? { 
        backgroundImage: `url(${settings.backgroundPath})`, 
        backgroundSize: 'cover', 
        backgroundPosition: 'center',
        backgroundRepeat: 'no-repeat'
      }
    : { backgroundColor: 'white' };

  const isLoading = isLoadingSettings || isLoadingImages;

  // Function to render the appropriate display layout based on the selected format
  const renderDisplayLayout = () => {
    const format = settings?.displayFormat || "16:9-default";
    
    // Special handling for text-only format
    if (format === "text-only") {
      return (
        <div className="text-only-layout flex items-center justify-center h-full">
          <div 
            className={`text-only-content p-8 rounded-lg max-w-2xl text-${settings?.textAlignment || 'center'}`}
            style={{
              backgroundColor: settings?.textBackground 
                ? `rgba(${parseInt(settings?.textBackgroundColor?.slice(1, 3) || '00', 16)}, 
                   ${parseInt(settings?.textBackgroundColor?.slice(3, 5) || '00', 16)}, 
                   ${parseInt(settings?.textBackgroundColor?.slice(5, 7) || '00', 16)}, 
                   ${(settings?.textBackgroundOpacity || 50) / 100})` 
                : 'transparent',
              fontFamily: settings?.fontFamily || 'Arial',
              color: settings?.fontColor || '#ffffff',
              fontSize: `${settings?.fontSize || 24}px`,
              padding: `${settings?.textPadding || 20}px`,
              maxWidth: settings?.textMaxWidth === 'full' ? '100%' : 
                        settings?.textMaxWidth === '3/4' ? '75%' : 
                        settings?.textMaxWidth === '1/2' ? '50%' : '33.333%',
            }}
          >
            <h2 className="text-2xl font-bold mb-4">Welcome to the Event</h2>
            <p className="text-xl">This is a text-only display format. You can customize this text in the display settings.</p>
          </div>
        </div>
      );
    }
    
    // Exit early if there are no images for the other formats
    if (!images || images.length === 0) return null;
    
    switch (format) {
      case "16:9-default":
        return (
          <DisplayCarousel 
            images={images} 
            currentIndex={currentIndex}
            showInfo={settings?.showInfo ?? true}
            showCaptions={settings?.showCaptions ?? true}
            separateCaptions={settings?.separateCaptions ?? false}
            transitionEffect={settings?.transitionEffect ?? "slide"}
            borderStyle={settings?.borderStyle ?? "none"}
            borderWidth={settings?.borderWidth ?? 0}
            borderColor={settings?.borderColor ?? "#cccccc"}
            fontFamily={settings?.fontFamily ?? "Arial"}
            fontColor={settings?.fontColor ?? "#333333"}
            fontSize={settings?.fontSize ?? 16}
            imagePosition={settings?.imagePosition ?? "center"}
            captionBgColor={settings?.captionBgColor ?? "rgba(0,0,0,0.5)"}
            captionFontFamily={settings?.captionFontFamily ?? "Arial"}
            captionFontColor={settings?.captionFontColor ?? "#ffffff"}
            captionFontSize={settings?.captionFontSize ?? 14}
            textPosition={settings?.textPosition ?? "overlay-bottom"}
            textAlignment={settings?.textAlignment ?? "center"}
            textPadding={settings?.textPadding ?? 10}
            textMaxWidth={settings?.textMaxWidth ?? "full"}
            textBackground={settings?.textBackground ?? true}
            textBackgroundColor={settings?.textBackgroundColor ?? "#000000"}
            textBackgroundOpacity={settings?.textBackgroundOpacity ?? 50}
          />
        );
        
      case "16:9-multiple":
        return (
          <div className="grid-layout-multiple">
            {images.slice(0, 4).map((image, index) => (
              <div key={image.id} className="grid-item">
                <img src={image.originalPath} alt={`Photo by ${image.submitterName}`} className="grid-image" />
                {settings?.showCaptions && image.caption && (
                  <div className="grid-caption" style={{
                    backgroundColor: settings?.captionBgColor,
                    color: settings?.captionFontColor,
                    fontFamily: settings?.captionFontFamily
                  }}>
                    {image.caption}
                  </div>
                )}
              </div>
            ))}
          </div>
        );
        
      default:
        return (
          <DisplayCarousel 
            images={images} 
            currentIndex={currentIndex}
            showInfo={settings?.showInfo ?? true}
            showCaptions={settings?.showCaptions ?? true}
            separateCaptions={settings?.separateCaptions ?? false}
            transitionEffect={settings?.transitionEffect ?? "slide"}
            borderStyle={settings?.borderStyle ?? "none"}
            borderWidth={settings?.borderWidth ?? 0}
            borderColor={settings?.borderColor ?? "#cccccc"}
            fontFamily={settings?.fontFamily ?? "Arial"}
            fontColor={settings?.fontColor ?? "#333333"}
            fontSize={settings?.fontSize ?? 16}
            imagePosition={settings?.imagePosition ?? "center"}
            captionBgColor={settings?.captionBgColor ?? "rgba(0,0,0,0.5)"}
            captionFontFamily={settings?.captionFontFamily ?? "Arial"}
            captionFontColor={settings?.captionFontColor ?? "#ffffff"}
            captionFontSize={settings?.captionFontSize ?? 14}
            textPosition={settings?.textPosition ?? "overlay-bottom"}
            textAlignment={settings?.textAlignment ?? "center"}
            textPadding={settings?.textPadding ?? 10}
            textMaxWidth={settings?.textMaxWidth ?? "full"}
            textBackground={settings?.textBackground ?? true}
            textBackgroundColor={settings?.textBackgroundColor ?? "#000000"}
            textBackgroundOpacity={settings?.textBackgroundOpacity ?? 50}
          />
        );
    }
  }

  return (
    <div 
      className="display-container"
      style={backgroundStyle}
    >
      {/* Semi-transparent overlay - only show when there's no background image */}
      {!settings?.backgroundPath && (
        <div className="display-overlay"></div>
      )}
      
      {/* Logo - use custom logo if available, otherwise use default */}
      <div className="display-logo">
        {settings?.logoPath ? (
          <img src={settings.logoPath} alt="Logo" className="h-16 md:h-20" />
        ) : (
          <img src="/assets/rws-logo-dark.png" alt="Default Logo" className="h-16 md:h-20" />
        )}
      </div>
      
      {isLoading ? (
        <div className="display-loading">Loading presentation...</div>
      ) : error ? (
        <div className="display-error">
          Error loading images: {error instanceof Error ? error.message : "Unknown error"}
        </div>
      ) : !images || images.length === 0 ? (
        <div className="display-empty">
          <div className="display-empty-title">No approved posts available</div>
          <div className="display-empty-subtitle">Upload photos or messages by scanning the QR code</div>
        </div>
      ) : (
        <>
          {renderDisplayLayout()}
          
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
