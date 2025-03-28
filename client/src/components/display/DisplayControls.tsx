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
    <div className={`absolute inset-x-0 bottom-0 bg-gradient-to-t from-black via-black/80 to-transparent h-28 ${isVisible ? 'opacity-100' : 'opacity-0'} transition-opacity duration-300 flex items-end font-[Arial]`}>
      <div className="w-full px-8 py-5 flex justify-between items-center">
        <div className="flex items-center space-x-6">
          <button
            type="button"
            className="p-3 rounded-full bg-zinc-800/70 text-white hover:bg-zinc-700/80 hover:scale-105 transition-all duration-200"
            onClick={onPrevious}
            title="Previous"
          >
            <svg className="h-6 w-6" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 19l-7-7 7-7" />
            </svg>
          </button>
          <button
            type="button"
            className="p-3 rounded-full bg-zinc-800/70 text-white hover:bg-zinc-700/80 hover:scale-105 transition-all duration-200"
            onClick={onPauseToggle}
            title={isPaused ? "Play" : "Pause"}
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
            className="p-3 rounded-full bg-zinc-800/70 text-white hover:bg-zinc-700/80 hover:scale-105 transition-all duration-200"
            onClick={onNext}
            title="Next"
          >
            <svg className="h-6 w-6" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7" />
            </svg>
          </button>
        </div>
        
        <div className="flex items-center space-x-6">
          <span className="text-white text-sm bg-zinc-800/70 px-3 py-2 rounded-md">
            <span className="text-blue-400 font-semibold">{currentIndex + 1}</span>
            <span className="mx-1">/</span>
            <span>{totalImages}</span>
          </span>
          
          <Select
            value={interval.toString()}
            onValueChange={(value) => onIntervalChange(parseInt(value))}
          >
            <SelectTrigger className="bg-zinc-800/70 text-white border-0 text-sm py-2 px-3 rounded hover:bg-zinc-700/80 focus:ring-2 focus:ring-blue-400 w-48">
              <SelectValue placeholder="Slideshow timing" />
            </SelectTrigger>
            <SelectContent className="bg-zinc-800 border-zinc-700">
              <SelectItem value="5">Quick Slideshow (5s)</SelectItem>
              <SelectItem value="8">Default Slideshow (8s)</SelectItem>
              <SelectItem value="10">Slow Slideshow (10s)</SelectItem>
              <SelectItem value="15">Very Slow (15s)</SelectItem>
              <SelectItem value="30">Extended View (30s)</SelectItem>
              <SelectItem value="0">Manual Control</SelectItem>
            </SelectContent>
          </Select>
          
          <button
            type="button"
            className="p-3 rounded-full bg-zinc-800/70 text-white hover:bg-zinc-700/80 hover:scale-105 transition-all duration-200"
            onClick={() => {
              if (document.fullscreenElement) {
                document.exitFullscreen();
              } else {
                document.documentElement.requestFullscreen();
              }
            }}
            title="Toggle Fullscreen"
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
