import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Slider } from "@/components/ui/slider";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";

export default function DisplaySettingsForm() {
  const { toast } = useToast();
  
  // Display settings
  const [autoRotate, setAutoRotate] = useState(true);
  const [slideInterval, setSlideInterval] = useState<number[]>([8]);
  const [showInfo, setShowInfo] = useState(true);
  const [transitionEffect, setTransitionEffect] = useState("slide");
  const [blacklistWords, setBlacklistWords] = useState("");
  
  // Handle save settings
  const handleSaveSettings = () => {
    // This would typically call an API endpoint to save settings
    console.log("Saving settings:", {
      autoRotate,
      slideInterval: slideInterval[0],
      showInfo,
      transitionEffect,
      blacklistWords: blacklistWords.split(",").map(w => w.trim()).filter(Boolean)
    });
    
    toast({
      title: "Settings saved",
      description: "Display settings have been updated successfully.",
    });
  };
  
  return (
    <Card className="bg-white shadow rounded-lg mb-6">
      <CardContent className="px-4 py-5 sm:p-6">
        <h3 className="text-lg leading-6 font-medium text-gray-900 mb-6">
          Public Display Configuration
        </h3>
        
        <div className="space-y-6">
          {/* Auto-rotation settings */}
          <div className="flex items-center justify-between">
            <div>
              <Label htmlFor="auto-rotate" className="font-medium text-gray-900">
                Auto-rotate images
              </Label>
              <p className="text-sm text-gray-500">Automatically cycle through approved images</p>
            </div>
            <Switch
              id="auto-rotate"
              checked={autoRotate}
              onCheckedChange={setAutoRotate}
            />
          </div>
          
          {/* Slide interval */}
          {autoRotate && (
            <div>
              <div className="flex items-center justify-between mb-2">
                <Label htmlFor="slide-interval" className="font-medium text-gray-900">
                  Slide interval
                </Label>
                <span className="text-sm text-gray-500">{slideInterval[0]} seconds</span>
              </div>
              <Slider
                id="slide-interval"
                value={slideInterval}
                onValueChange={setSlideInterval}
                min={3}
                max={30}
                step={1}
                className="w-full"
              />
            </div>
          )}
          
          {/* Show image info */}
          <div className="flex items-center justify-between">
            <div>
              <Label htmlFor="show-info" className="font-medium text-gray-900">
                Show image info
              </Label>
              <p className="text-sm text-gray-500">Display style and submitter information</p>
            </div>
            <Switch
              id="show-info"
              checked={showInfo}
              onCheckedChange={setShowInfo}
            />
          </div>
          
          {/* Transition effect */}
          <div>
            <Label htmlFor="transition-effect" className="font-medium text-gray-900">
              Transition effect
            </Label>
            <Select
              value={transitionEffect}
              onValueChange={setTransitionEffect}
            >
              <SelectTrigger id="transition-effect" className="w-full mt-1">
                <SelectValue placeholder="Select transition effect" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="slide">Slide</SelectItem>
                <SelectItem value="fade">Fade</SelectItem>
                <SelectItem value="zoom">Zoom</SelectItem>
                <SelectItem value="flip">Flip</SelectItem>
              </SelectContent>
            </Select>
          </div>
          
          {/* Blacklist words */}
          <div>
            <Label htmlFor="blacklist-words" className="font-medium text-gray-900">
              Blacklist words
            </Label>
            <Input
              id="blacklist-words"
              value={blacklistWords}
              onChange={e => setBlacklistWords(e.target.value)}
              placeholder="Enter comma-separated words to filter out"
              className="mt-1"
            />
            <p className="text-sm text-gray-500 mt-1">
              Images with these words in submitter names or comments will be skipped
            </p>
          </div>
          
          {/* Save button */}
          <div className="flex justify-end">
            <Button
              type="button"
              onClick={handleSaveSettings}
            >
              Save Settings
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
