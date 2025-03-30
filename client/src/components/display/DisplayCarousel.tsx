import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";

interface DisplayImage {
  id: number;
  originalPath: string;
  submitterName: string;
  caption?: string;
  createdAt: string;
}

interface DisplayCarouselProps {
  images: DisplayImage[];
  currentIndex: number;
  showInfo: boolean;
  showCaptions?: boolean;
  separateCaptions?: boolean;
  transitionEffect: string;
  borderStyle?: string;
  borderWidth?: number;
  borderColor?: string;
  fontFamily?: string;
  fontColor?: string;
  fontSize?: number;
  imagePosition?: string;
  captionBgColor?: string;
  captionFontFamily?: string;
  captionFontColor?: string;
  captionFontSize?: number;
  textPosition?: string;
  textAlignment?: string;
  textPadding?: number;
  textMaxWidth?: string;
  textBackground?: boolean;
  textBackgroundColor?: string;
  textBackgroundOpacity?: number;
}

export default function DisplayCarousel({ 
  images, 
  currentIndex, 
  showInfo = true,
  showCaptions = true,
  separateCaptions = false,
  transitionEffect = "slide",
  borderStyle = "none",
  borderWidth = 0,
  borderColor = "#ffffff",
  fontFamily = "Arial",
  fontColor = "#ffffff",
  fontSize = 16,
  imagePosition = "center",
  captionBgColor = "rgba(0,0,0,0.5)",
  captionFontFamily = "Arial",
  captionFontColor = "#ffffff",
  captionFontSize = 14,
  textPosition = "overlay-bottom",
  textAlignment = "center",
  textPadding = 10,
  textMaxWidth = "full",
  textBackground = true,
  textBackgroundColor = "#000000",
  textBackgroundOpacity = 50
}: DisplayCarouselProps) {
  const [direction, setDirection] = useState(0);
  const [previousIndex, setPreviousIndex] = useState(0);
  
  useEffect(() => {
    // Determine the direction of transition
    if (currentIndex !== previousIndex) {
      if (
        (currentIndex > previousIndex && !(previousIndex === 0 && currentIndex === images.length - 1)) ||
        (previousIndex === images.length - 1 && currentIndex === 0)
      ) {
        setDirection(1); // forward
      } else {
        setDirection(-1); // backward
      }
      setPreviousIndex(currentIndex);
    }
  }, [currentIndex, previousIndex, images.length]);
  
  const currentImage = images[currentIndex];

  // Set CSS variables for text styling
  useEffect(() => {
    const root = document.documentElement;
    root.style.setProperty('--text-color', fontColor);
    root.style.setProperty('--text-font-family', fontFamily);
    root.style.setProperty('--text-font-size', `${fontSize}px`);
    root.style.setProperty('--text-padding', `${textPadding}px`);
    root.style.setProperty('--text-inner-padding', `${textPadding / 2}px`);
    
    // Calculate RGBA background color
    const hexToRgb = (hex: string) => {
      const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
      return result ? {
        r: parseInt(result[1], 16),
        g: parseInt(result[2], 16),
        b: parseInt(result[3], 16)
      } : null;
    };
    
    const rgbColor = hexToRgb(textBackgroundColor);
    if (rgbColor) {
      const rgba = `rgba(${rgbColor.r}, ${rgbColor.g}, ${rgbColor.b}, ${textBackgroundOpacity / 100})`;
      root.style.setProperty('--text-background-color', rgba);
    }
    
    // Set max width based on selected option
    const maxWidthValue = textMaxWidth === 'full' ? '100%' : 
                          textMaxWidth === '3/4' ? '75%' : 
                          textMaxWidth === '1/2' ? '50%' : '33.333%';
    root.style.setProperty('--text-max-width', maxWidthValue);
  }, [
    fontColor, 
    fontFamily, 
    fontSize, 
    textPadding, 
    textBackgroundColor, 
    textBackgroundOpacity, 
    textMaxWidth
  ]);

  // Define different animation variants based on transition effect
  const slideVariants = {
    enter: (direction: number) => ({
      x: direction > 0 ? 300 : -300,
      opacity: 0,
      scale: 1 // Keep scale constant for slide transitions
    }),
    center: {
      x: 0,
      opacity: 1,
      scale: 1
    },
    exit: (direction: number) => ({
      x: direction < 0 ? 300 : -300,
      opacity: 0,
      scale: 1
    })
  };

  const fadeVariants = {
    enter: {
      opacity: 0,
      scale: 1 // Keep scale constant for fade transitions
    },
    center: {
      opacity: 1,
      scale: 1
    },
    exit: {
      opacity: 0,
      scale: 1
    }
  };

  // Instead of scaling the entire component, just use opacity for zoom effect
  const zoomVariants = {
    enter: {
      opacity: 0,
      scale: 1 // Keep scale constant - no more zoom
    },
    center: {
      opacity: 1,
      scale: 1
    },
    exit: {
      opacity: 0,
      scale: 1
    }
  };

  // Remove rotation for flip effect - just use opacity
  const flipVariants = {
    enter: {
      opacity: 0,
      scale: 1 // Keep scale constant - no more flip
    },
    center: {
      opacity: 1,
      scale: 1
    },
    exit: {
      opacity: 0,
      scale: 1
    }
  };

  // Choose the right animation variant based on the effect
  const variants = 
    transitionEffect === "fade" ? fadeVariants :
    transitionEffect === "zoom" ? zoomVariants :
    transitionEffect === "flip" ? flipVariants :
    slideVariants; // Default to slide

  // For the transition properties - keep them simple and consistent
  const transition = 
    transitionEffect === "fade" ? {
      opacity: { duration: 0.5 },
      scale: { duration: 0 } // Instant scale transition
    } :
    transitionEffect === "zoom" ? {
      opacity: { duration: 0.5 },
      scale: { duration: 0 } // Instant scale transition
    } :
    transitionEffect === "flip" ? {
      opacity: { duration: 0.5 },
      scale: { duration: 0 } // Instant scale transition
    } : {
      x: { duration: 0.3, ease: "easeInOut" },
      opacity: { duration: 0.3 },
      scale: { duration: 0 } // Instant scale transition
    };

  return (
    <div className="display-carousel">
      {/* Fixed container to maintain consistent positioning */}
      <div className="fixed-position-container">
        <AnimatePresence initial={false} custom={direction} mode="wait">
          <motion.div
            key={currentIndex}
            custom={direction}
            variants={variants}
            initial="enter"
            animate="center"
            exit="exit"
            transition={transition}
            className="carousel-motion-container"
            layout={false} // Turn off layout animations
          >
            <div
              className="relative rounded-md carousel-image-container"
              style={{ 
                borderStyle: borderStyle === "none" ? undefined : borderStyle,
                borderWidth: borderStyle === "none" ? 0 : `${borderWidth}px`,
                borderColor: borderColor
              }}
            >
              {/* Text that goes above the image if position is above-image */}
              {showInfo && textPosition === "above-image" && (
                <div className={`text-position-above-image text-align-${textAlignment} text-width-${textMaxWidth.replace('/', '\\/')}`}>
                  <div className={`display-text ${textBackground ? 'with-text-background' : ''}`}>
                    <p className="font-bold">{currentImage.submitterName || "Anonymous"}</p>
                    {currentImage.caption && showCaptions && (
                      <p className="mt-1">{currentImage.caption}</p>
                    )}
                  </div>
                </div>
              )}

              <div className="carousel-image-wrapper">
                <img
                  src={currentImage.originalPath}
                  alt={`Photo by ${currentImage.submitterName}`}
                  className={`carousel-image rounded-md`}
                  style={{ 
                    boxShadow: '0 4px 30px rgba(0, 0, 0, 0.5)'
                  }}
                />
                
                {/* Text overlay on top of image */}
                {showInfo && textPosition === "overlay-bottom" && (
                  <div className={`text-position-overlay-bottom text-align-${textAlignment} text-width-${textMaxWidth.replace('/', '\\/')}`}>
                    <div className={`display-text ${textBackground ? 'with-text-background' : ''}`}>
                      <p className="font-bold">{currentImage.submitterName || "Anonymous"}</p>
                      {currentImage.caption && showCaptions && (
                        <p className="mt-1">{currentImage.caption}</p>
                      )}
                    </div>
                  </div>
                )}
                
                {/* Text overlay at the top of image */}
                {showInfo && textPosition === "overlay-top" && (
                  <div className={`text-position-overlay-top text-align-${textAlignment} text-width-${textMaxWidth.replace('/', '\\/')}`}>
                    <div className={`display-text ${textBackground ? 'with-text-background' : ''}`}>
                      <p className="font-bold">{currentImage.submitterName || "Anonymous"}</p>
                      {currentImage.caption && showCaptions && (
                        <p className="mt-1">{currentImage.caption}</p>
                      )}
                    </div>
                  </div>
                )}
                
                {/* Text positioned to the left of image */}
                {showInfo && textPosition === "left-of-image" && (
                  <div className={`text-position-left-of-image text-align-${textAlignment} text-width-${textMaxWidth.replace('/', '\\/')}`}>
                    <div className={`display-text ${textBackground ? 'with-text-background' : ''}`}>
                      <p className="font-bold">{currentImage.submitterName || "Anonymous"}</p>
                      {currentImage.caption && showCaptions && (
                        <p className="mt-1">{currentImage.caption}</p>
                      )}
                    </div>
                  </div>
                )}
                
                {/* Text positioned to the right of image */}
                {showInfo && textPosition === "right-of-image" && (
                  <div className={`text-position-right-of-image text-align-${textAlignment} text-width-${textMaxWidth.replace('/', '\\/')}`}>
                    <div className={`display-text ${textBackground ? 'with-text-background' : ''}`}>
                      <p className="font-bold">{currentImage.submitterName || "Anonymous"}</p>
                      {currentImage.caption && showCaptions && (
                        <p className="mt-1">{currentImage.caption}</p>
                      )}
                    </div>
                  </div>
                )}
              </div>
              
              {/* Text that goes below the image if position is below-image */}
              {showInfo && textPosition === "below-image" && (
                <div className={`text-position-below-image text-align-${textAlignment} text-width-${textMaxWidth.replace('/', '\\/')}`}>
                  <div className={`display-text ${textBackground ? 'with-text-background' : ''}`}>
                    <p className="font-bold">{currentImage.submitterName || "Anonymous"}</p>
                    {currentImage.caption && showCaptions && (
                      <p className="mt-1">{currentImage.caption}</p>
                    )}
                  </div>
                </div>
              )}
              
              {/* Legacy caption display - only show if using separateCaptions and not using new text positioning */}
              {showCaptions && currentImage.caption && separateCaptions && textPosition === "overlay-bottom" && (
                <div 
                  className="carousel-caption-separate absolute bottom-8 left-0 right-0 mx-auto p-4 text-center rounded-md max-w-2xl"
                  style={{
                    fontFamily: captionFontFamily,
                    color: captionFontColor,
                    backgroundColor: captionBgColor,
                    fontSize: `${captionFontSize}px`,
                  }}
                >
                  {currentImage.caption}
                </div>
              )}
            </div>
          </motion.div>
        </AnimatePresence>
      </div>
    </div>
  );
}
