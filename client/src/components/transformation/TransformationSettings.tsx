import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { TransformationSettings } from "@shared/schema";
import { Slider } from "@/components/ui/slider";

export default function TransformationSettingsForm() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  const [selectedPreset, setSelectedPreset] = useState<string>("");
  const [customName, setCustomName] = useState("");
  const [promptTemplate, setPromptTemplate] = useState("");
  const [intensity, setIntensity] = useState<number[]>([7]);
  
  const { data: presets, isLoading: presetsLoading } = useQuery<TransformationSettings[]>({
    queryKey: ["/api/transformation-settings"],
  });
  
  const { data: defaultSettings } = useQuery<TransformationSettings>({
    queryKey: ["/api/transformation-settings/default"],
    onSuccess: (data) => {
      if (data && !selectedPreset) {
        setSelectedPreset(data.stylePreset);
        setPromptTemplate(data.promptTemplate);
        setIntensity([data.effectIntensity]);
      }
    },
  });
  
  const savePresetMutation = useMutation({
    mutationFn: async (data: { name: string; promptTemplate: string; effectIntensity: number; isDefault: boolean }) => {
      const response = await apiRequest("POST", "/api/transformation-settings", data);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/transformation-settings"] });
      toast({
        title: "Preset saved",
        description: "Your transformation preset has been saved.",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Failed to save preset",
        description: error.message || "There was an error saving your preset.",
        variant: "destructive",
      });
    },
  });
  
  const applyToPendingMutation = useMutation({
    mutationFn: async (settingsId: number) => {
      const response = await apiRequest("POST", "/api/transformations/apply-to-pending", { settingsId });
      return response.json();
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["/api/transformations"] });
      toast({
        title: "Applied to pending photos",
        description: `Successfully applied to ${data.transformations?.length || 0} photos.`,
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Failed to apply to pending photos",
        description: error.message || "There was an error applying the transformations.",
        variant: "destructive",
      });
    },
  });
  
  const handlePresetChange = (value: string) => {
    setSelectedPreset(value);
    
    if (value === "custom") {
      setPromptTemplate("");
      setIntensity([7]);
    } else {
      const preset = presets?.find(p => p.stylePreset === value);
      if (preset) {
        setPromptTemplate(preset.promptTemplate);
        setIntensity([preset.effectIntensity]);
      }
    }
  };
  
  const handleSavePreset = () => {
    if (selectedPreset === "custom" && !customName) {
      toast({
        title: "Name required",
        description: "Please provide a name for your custom preset.",
        variant: "destructive",
      });
      return;
    }
    
    const name = selectedPreset === "custom" ? customName : selectedPreset;
    
    savePresetMutation.mutate({
      name,
      promptTemplate,
      effectIntensity: intensity[0],
      isDefault: false,
    });
    
    if (selectedPreset === "custom") {
      setCustomName("");
    }
  };
  
  const handleApplyToPending = () => {
    const preset = presets?.find(p => p.stylePreset === selectedPreset);
    
    if (!preset) {
      toast({
        title: "Preset not found",
        description: "Please select a valid preset first.",
        variant: "destructive",
      });
      return;
    }
    
    applyToPendingMutation.mutate(preset.id);
  };
  
  return (
    <Card className="bg-white shadow rounded-lg mb-6">
      <CardContent className="px-4 py-5 sm:p-6">
        <h3 className="text-lg leading-6 font-medium text-gray-900 mb-4">
          AI Transformation Settings
        </h3>
        <div className="grid grid-cols-1 gap-y-6 gap-x-4 sm:grid-cols-6">
          <div className="sm:col-span-3">
            <Label htmlFor="transformation-style" className="block text-sm font-medium text-gray-700">Style Preset</Label>
            <Select
              value={selectedPreset}
              onValueChange={handlePresetChange}
              disabled={presetsLoading}
            >
              <SelectTrigger className="mt-1 block w-full">
                <SelectValue placeholder="Select a style preset" />
              </SelectTrigger>
              <SelectContent>
                {presetsLoading ? (
                  <SelectItem value="loading">Loading presets...</SelectItem>
                ) : presets?.map(preset => (
                  <SelectItem key={preset.id} value={preset.stylePreset}>
                    {preset.stylePreset}
                  </SelectItem>
                ))}
                <SelectItem value="custom">Custom...</SelectItem>
              </SelectContent>
            </Select>
          </div>
          
          {selectedPreset === "custom" && (
            <div className="sm:col-span-3">
              <Label htmlFor="custom-preset-name" className="block text-sm font-medium text-gray-700">Custom Preset Name</Label>
              <Input
                id="custom-preset-name"
                value={customName}
                onChange={(e) => setCustomName(e.target.value)}
                className="mt-1 block w-full"
                placeholder="Enter preset name"
              />
            </div>
          )}
          
          <div className="sm:col-span-3">
            <Label htmlFor="transformation-intensity" className="block text-sm font-medium text-gray-700">Effect Intensity</Label>
            <div className="mt-1 flex items-center">
              <Slider
                value={intensity}
                onValueChange={setIntensity}
                max={10}
                min={1}
                step={1}
                className="flex-grow"
              />
              <span className="ml-3 text-sm text-gray-500">{intensity[0]}/10</span>
            </div>
          </div>
          
          <div className="sm:col-span-6">
            <Label htmlFor="custom-prompt" className="block text-sm font-medium text-gray-700">Custom Prompt</Label>
            <div className="mt-1">
              <Textarea
                id="custom-prompt"
                rows={3}
                className="shadow-sm focus:ring-primary focus:border-primary block w-full sm:text-sm border-gray-300 rounded-md"
                placeholder="Transform this image into an abstract watercolor with vibrant colors and flowing shapes..."
                value={promptTemplate}
                onChange={(e) => setPromptTemplate(e.target.value)}
              />
            </div>
            <p className="mt-2 text-sm text-gray-500">Describe how you want the AI to transform your approved photos.</p>
          </div>
          
          <div className="sm:col-span-6">
            <div className="flex justify-end">
              <Button
                type="button"
                variant="outline"
                className="text-sm text-gray-700 mr-3"
                onClick={handleSavePreset}
                disabled={savePresetMutation.isPending}
              >
                Save as Preset
              </Button>
              <Button
                type="button"
                className="text-sm text-white"
                onClick={handleApplyToPending}
                disabled={applyToPendingMutation.isPending}
              >
                Apply to All Pending
              </Button>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
