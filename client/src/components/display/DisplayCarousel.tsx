import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";

interface DisplayImage {
  id: number;
  originalPath: string;
  transformedPath: string;
  stylePreset: string;
  submitterName: string;
  createdAt: string;
}

interface DisplayCarouselProps {
  images: DisplayImage[];
  currentIndex: number;
}

export default function DisplayCarousel({ images, currentIndex }: DisplayCarouselProps) {
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

  // Animation variants
  const variants = {
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
          transition={{
            x: { type: "spring", stiffness: 300, damping: 30 },
            opacity: { duration: 0.2 }
          }}
          className="w-full h-full flex items-center justify-center"
        >
          <img
            src={currentImage.transformedPath}
            alt={`Transformed photo by ${currentImage.submitterName}`}
            className="max-w-full max-h-full object-contain"
          />
          
          <div className="absolute bottom-24 left-6 bg-black/30 text-white px-4 py-2 rounded-lg backdrop-blur-sm">
            <p className="text-lg font-medium">{currentImage.stylePreset}</p>
            <p className="text-sm">By: {currentImage.submitterName || "Anonymous"}</p>
          </div>
        </motion.div>
      </AnimatePresence>
    </div>
  );
}
