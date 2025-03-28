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
  transitionEffect: string;
  borderStyle?: string;
  borderWidth?: number;
  borderColor?: string;
  fontFamily?: string;
  fontColor?: string;
  fontSize?: number;
  imagePosition?: string;
}

export default function DisplayCarousel({ 
  images, 
  currentIndex, 
  showInfo = true,
  transitionEffect = "slide",
  borderStyle = "none",
  borderWidth = 0,
  borderColor = "#ffffff",
  fontFamily = "Arial",
  fontColor = "#ffffff",
  fontSize = 16,
  imagePosition = "center"
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
              className="max-w-full max-h-full object-contain rounded-t-md shadow-2xl"
              style={{ 
                boxShadow: '0 4px 30px rgba(0, 0, 0, 0.5)',
                maxHeight: currentImage.caption ? "calc(80vh - 70px)" : "80vh"
              }}
            />
            
            {/* Caption display - only show if caption exists */}
            {currentImage.caption && (
              <div 
                className="w-full bg-black/80 p-4 text-center rounded-b-md"
                style={{
                  fontFamily: fontFamily,
                  color: fontColor,
                }}
              >
                <p style={{ fontSize: `${fontSize}px` }}>{currentImage.caption}</p>
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
