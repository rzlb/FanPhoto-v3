import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

interface DisplayControlsProps {
  isVisible: boolean;
  isPaused: boolean;
  onPauseToggle: () => void;
  onPrevious: () => void;
  onNext: () => void;
  currentIndex: number;
  totalImages: number;
  interval: number;
  onIntervalChange: (interval: number) => void;
}

export default function DisplayControls({
  isVisible,
  isPaused,
  onPauseToggle,
  onPrevious,
  onNext,
  currentIndex,
  totalImages,
  interval,
  onIntervalChange
}: DisplayControlsProps) {
  return (
    <div className={`absolute inset-x-0 bottom-0 bg-gradient-to-t from-black to-transparent h-24 ${isVisible ? 'opacity-100' : 'opacity-0'} transition-opacity duration-300 flex items-end`}>
      <div className="w-full px-6 py-4 flex justify-between items-center">
        <div className="flex items-center space-x-4">
          <button
            type="button"
            className="p-2 rounded-full bg-white/20 text-white hover:bg-white/30 transition-colors"
            onClick={onPrevious}
          >
            <svg className="h-6 w-6" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 19l-7-7 7-7" />
            </svg>
          </button>
          <button
            type="button"
            className="p-2 rounded-full bg-white/20 text-white hover:bg-white/30 transition-colors"
            onClick={onPauseToggle}
          >
            {isPaused ? (
              <svg className="h-6 w-6" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            ) : (
              <svg className="h-6 w-6" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 9v6m4-6v6m7-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            )}
          </button>
          <button
            type="button"
            className="p-2 rounded-full bg-white/20 text-white hover:bg-white/30 transition-colors"
            onClick={onNext}
          >
            <svg className="h-6 w-6" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7" />
            </svg>
          </button>
        </div>
        <div className="flex items-center space-x-4">
          <span className="text-white text-sm">
            {currentIndex + 1} / {totalImages}
          </span>
          <Select
            value={interval.toString()}
            onValueChange={(value) => onIntervalChange(parseInt(value))}
          >
            <SelectTrigger className="bg-white/20 text-white border-0 text-sm py-1 px-2 rounded focus:ring-2 focus:ring-white w-40">
              <SelectValue placeholder="Slideshow timing" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="5">Slideshow (5s)</SelectItem>
              <SelectItem value="8">Slideshow (8s)</SelectItem>
              <SelectItem value="10">Slideshow (10s)</SelectItem>
              <SelectItem value="15">Slideshow (15s)</SelectItem>
              <SelectItem value="30">Slideshow (30s)</SelectItem>
              <SelectItem value="0">Manual</SelectItem>
            </SelectContent>
          </Select>
          <button
            type="button"
            className="p-2 rounded-full bg-white/20 text-white hover:bg-white/30 transition-colors"
            onClick={() => {
              if (document.fullscreenElement) {
                document.exitFullscreen();
              } else {
                document.documentElement.requestFullscreen();
              }
            }}
          >
            <svg className="h-6 w-6" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 8V4m0 0h4M4 4l5 5m11-1V4m0 0h-4m4 0l-5 5M4 16v4m0 0h4m-4 0l5-5m11 5v-4m0 4h-4m4 0l-5-5" />
            </svg>
          </button>
        </div>
      </div>
    </div>
  );
}
