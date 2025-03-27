import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";

interface DisplayImage {
  id: number;
  originalPath: string;
  submitterName: string;
  createdAt: string;
}

interface DisplayCarouselProps {
  images: DisplayImage[];
  currentIndex: number;
  showInfo: boolean;
  transitionEffect: string;
}

export default function DisplayCarousel({ 
  images, 
  currentIndex, 
  showInfo = true,
  transitionEffect = "slide" 
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

  // Choose the right animation variant based on the effect
  const variants = 
    transitionEffect === "fade" ? fadeVariants :
    transitionEffect === "zoom" ? zoomVariants :
    slideVariants; // Default to slide

  // For the transition properties
  const transition = 
    transitionEffect === "fade" ? {
      opacity: { duration: 0.5 }
    } :
    transitionEffect === "zoom" ? {
      scale: { type: "spring", stiffness: 300, damping: 30 },
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
          className="w-full h-full flex items-center justify-center p-4 md:p-8 lg:p-12"
        >
          <img
            src={currentImage.originalPath}
            alt={`Photo by ${currentImage.submitterName}`}
            className="max-w-full max-h-full object-contain rounded-md shadow-xl"
          />
          
          {showInfo && (
            <div className="absolute bottom-24 left-6 bg-black/40 text-white px-4 py-2 rounded-lg backdrop-blur-sm">
              <p className="text-sm md:text-base">By: {currentImage.submitterName || "Anonymous"}</p>
              <p className="text-xs md:text-sm text-gray-300">
                {new Date(currentImage.createdAt).toLocaleDateString()}
              </p>
            </div>
          )}
        </motion.div>
      </AnimatePresence>
    </div>
  );
}
