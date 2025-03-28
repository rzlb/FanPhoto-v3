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
  captionFontSize = 14
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

  // Define different animation variants based on transition effect
  const slideVariants = {
    enter: (direction: number) => ({
      x: direction > 0 ? 1000 : -1000,
      opacity: 0
    }),
    center: {
      x: 0,
      opacity: 1
    },
    exit: (direction: number) => ({
      x: direction < 0 ? 1000 : -1000,
      opacity: 0
    })
  };

  const fadeVariants = {
    enter: {
      opacity: 0
    },
    center: {
      opacity: 1
    },
    exit: {
      opacity: 0
    }
  };

  const zoomVariants = {
    enter: {
      scale: 0.8,
      opacity: 0
    },
    center: {
      scale: 1,
      opacity: 1
    },
    exit: {
      scale: 0.8,
      opacity: 0
    }
  };

  const flipVariants = {
    enter: {
      rotateY: 90,
      opacity: 0
    },
    center: {
      rotateY: 0,
      opacity: 1
    },
    exit: {
      rotateY: -90,
      opacity: 0
    }
  };

  // Choose the right animation variant based on the effect
  const variants = 
    transitionEffect === "fade" ? fadeVariants :
    transitionEffect === "zoom" ? zoomVariants :
    transitionEffect === "flip" ? flipVariants :
    slideVariants; // Default to slide

  // For the transition properties
  const transition = 
    transitionEffect === "fade" ? {
      opacity: { duration: 0.5 }
    } :
    transitionEffect === "zoom" ? {
      scale: { type: "spring", stiffness: 300, damping: 30 },
      opacity: { duration: 0.3 }
    } :
    transitionEffect === "flip" ? {
      rotateY: { duration: 0.6 },
      opacity: { duration: 0.3 }
    } : {
      x: { type: "spring", stiffness: 300, damping: 30 },
      opacity: { duration: 0.2 }
    };

  return (
    <div className="absolute inset-0 flex items-center justify-center">
      <AnimatePresence initial={false} custom={direction}>
        <motion.div
          key={currentIndex}
          custom={direction}
          variants={variants}
          initial="enter"
          animate="center"
          exit="exit"
          transition={transition}
          className={`w-full h-full flex p-4 md:p-8 lg:p-12 ${
            imagePosition === 'center' ? 'items-center justify-center' :
            imagePosition === 'top' ? 'items-start justify-center' :
            imagePosition === 'bottom' ? 'items-end justify-center' :
            imagePosition === 'left' ? 'items-center justify-start' :
            imagePosition === 'right' ? 'items-center justify-end' :
            'items-center justify-center'
          }`}
        >
          <div
            className="relative rounded-md"
            style={{ 
              borderStyle: borderStyle === "none" ? undefined : borderStyle,
              borderWidth: borderStyle === "none" ? 0 : `${borderWidth}px`,
              borderColor: borderColor,
              maxHeight: "80vh",
              maxWidth: "80vw",
              display: "flex",
              flexDirection: "column",
              alignItems: "center"
            }}
          >
            <img
              src={currentImage.originalPath}
              alt={`Photo by ${currentImage.submitterName}`}
              className={`max-w-full max-h-full object-contain shadow-2xl ${
                showCaptions && currentImage.caption && !separateCaptions ? 'rounded-t-md' : 'rounded-md'
              }`}
              style={{ 
                boxShadow: '0 4px 30px rgba(0, 0, 0, 0.5)',
                maxHeight: (showCaptions && currentImage.caption && !separateCaptions) ? "calc(80vh - 70px)" : "80vh"
              }}
            />
            
            {/* Caption display - only show if caption exists and showCaptions is true */}
            {showCaptions && currentImage.caption && !separateCaptions && (
              <div 
                className="w-full p-4 text-center rounded-b-md"
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
            
            {/* Separate caption box if separateCaptions is true */}
            {showCaptions && currentImage.caption && separateCaptions && (
              <div 
                className="absolute bottom-8 left-0 right-0 mx-auto p-4 text-center rounded-md max-w-2xl"
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
          
          {showInfo && (
            <div 
              className="absolute bottom-28 left-8 bg-black/60 px-6 py-3 rounded-lg backdrop-blur-sm border border-zinc-700"
              style={{
                fontFamily: fontFamily,
                color: fontColor,
              }}
            >
              <p style={{ fontSize: `${fontSize - 2}px`, fontWeight: 'bold' }}>
                By: {currentImage.submitterName || "Anonymous"}
              </p>
              <p style={{ fontSize: `${fontSize - 4}px`, opacity: 0.8 }}>
                {new Date(currentImage.createdAt).toLocaleDateString(undefined, {
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric'
                })}
              </p>
            </div>
          )}
        </motion.div>
      </AnimatePresence>
    </div>
  );
}
