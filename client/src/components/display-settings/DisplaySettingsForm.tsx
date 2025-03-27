import { useState, useRef } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Slider } from "@/components/ui/slider";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { ImagePlus } from "lucide-react";
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel } from "@/components/ui/form";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";

// Form schema for display settings
const formSchema = z.object({
  autoRotate: z.boolean(),
  slideInterval: z.number().min(2).max(60),
  showInfo: z.boolean(),
  transitionEffect: z.enum(["slide", "fade", "zoom", "flip"]),
  blacklistWords: z.string().optional(),
});

type FormValues = z.infer<typeof formSchema>;

export default function DisplaySettingsForm() {
  const { toast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const queryClient = useQueryClient();
  
  // Fetch current settings
  const { data: settings, isLoading } = useQuery({
    queryKey: ['/api/display-settings'],
  });

  // Form setup
  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      autoRotate: true,
      slideInterval: 8,
      showInfo: true, 
      transitionEffect: "slide",
      blacklistWords: "",
    },
    values: settings ? {
      autoRotate: settings.autoRotate,
      slideInterval: settings.slideInterval,
      showInfo: settings.showInfo,
      transitionEffect: settings.transitionEffect as "slide" | "fade" | "zoom" | "flip",
      blacklistWords: settings.blacklistWords || "",
    } : undefined,
  });
  
  // Handle settings update
  const updateSettingsMutation = useMutation({
    mutationFn: async (data: FormValues) => {
      return apiRequest('/api/display-settings', {
        method: 'POST',
        body: JSON.stringify(data)
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/display-settings'] });
      toast({
        title: "Settings saved",
        description: "Display settings have been updated successfully.",
      });
    },
    onError: (error) => {
      toast({
        title: "Failed to save settings",
        description: error instanceof Error ? error.message : "An unknown error occurred",
        variant: "destructive"
      });
    }
  });
  
  // Handle background image upload
  const uploadBackgroundMutation = useMutation({
    mutationFn: async (formData: FormData) => {
      return apiRequest('/api/display-settings/background', {
        method: 'POST',
        body: formData,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/display-settings'] });
      toast({
        title: "Background updated",
        description: "Display background image has been updated successfully.",
      });
    },
    onError: (error) => {
      toast({
        title: "Failed to upload background",
        description: error instanceof Error ? error.message : "An unknown error occurred",
        variant: "destructive"
      });
    }
  });
  
  const onSubmit = (data: FormValues) => {
    updateSettingsMutation.mutate(data);
  };
  
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const formData = new FormData();
      formData.append('background', e.target.files[0]);
      uploadBackgroundMutation.mutate(formData);
    }
  };

  if (isLoading) {
    return (
      <Card className="bg-white shadow rounded-lg mb-6">
        <CardContent className="px-4 py-5 sm:p-6">
          <div className="flex justify-center">
            <div className="animate-pulse h-4 w-48 bg-gray-200 rounded"></div>
          </div>
        </CardContent>
      </Card>
    );
  }
  
  return (
    <Card className="bg-white shadow rounded-lg mb-6">
      <CardContent className="px-4 py-5 sm:p-6">
        <h3 className="text-lg leading-6 font-medium text-gray-900 mb-6">
          Public Display Configuration
        </h3>
        
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            {/* Background image */}
            <div>
              <Label className="font-medium text-gray-900">
                Background Image
              </Label>
              <p className="text-sm text-gray-500 mb-3">
                Add a background image to display behind the photos
              </p>
              
              {settings?.backgroundPath ? (
                <div className="mb-4">
                  <div className="relative w-full h-40 rounded-md overflow-hidden">
                    <img 
                      src={settings.backgroundPath} 
                      alt="Current background" 
                      className="w-full h-full object-cover"
                    />
                    <div className="absolute inset-0 bg-black bg-opacity-30 flex items-center justify-center opacity-0 hover:opacity-100 transition-opacity">
                      <Button
                        type="button"
                        variant="secondary"
                        onClick={() => fileInputRef.current?.click()}
                      >
                        Change Background
                      </Button>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="mb-4 border-2 border-dashed border-gray-300 rounded-md p-6 text-center">
                  <Button
                    type="button" 
                    variant="outline"
                    onClick={() => fileInputRef.current?.click()}
                    className="flex items-center justify-center"
                  >
                    <ImagePlus className="mr-2 h-4 w-4" />
                    Upload Background
                  </Button>
                </div>
              )}
              
              <input
                type="file"
                ref={fileInputRef}
                onChange={handleFileChange}
                accept="image/*"
                className="hidden"
              />
            </div>
            
            {/* Auto-rotation settings */}
            <FormField
              control={form.control}
              name="autoRotate"
              render={({ field }) => (
                <FormItem className="flex items-center justify-between">
                  <div>
                    <FormLabel className="font-medium text-gray-900">
                      Auto-rotate images
                    </FormLabel>
                    <FormDescription>
                      Automatically cycle through approved images
                    </FormDescription>
                  </div>
                  <FormControl>
                    <Switch
                      checked={field.value}
                      onCheckedChange={field.onChange}
                    />
                  </FormControl>
                </FormItem>
              )}
            />
            
            {/* Slide interval */}
            <FormField
              control={form.control}
              name="slideInterval"
              render={({ field }) => (
                <FormItem>
                  <div className="flex items-center justify-between mb-2">
                    <FormLabel className="font-medium text-gray-900">
                      Slide interval
                    </FormLabel>
                    <span className="text-sm text-gray-500">{field.value} seconds</span>
                  </div>
                  <FormControl>
                    <Slider
                      value={[field.value]}
                      max={60}
                      min={2}
                      step={1}
                      onValueChange={(values) => field.onChange(values[0])}
                      className="w-full"
                      disabled={!form.getValues().autoRotate}
                    />
                  </FormControl>
                </FormItem>
              )}
            />
            
            {/* Show info */}
            <FormField
              control={form.control}
              name="showInfo"
              render={({ field }) => (
                <FormItem className="flex items-center justify-between">
                  <div>
                    <FormLabel className="font-medium text-gray-900">
                      Show image info
                    </FormLabel>
                    <FormDescription>
                      Display submitter name and other image details
                    </FormDescription>
                  </div>
                  <FormControl>
                    <Switch
                      checked={field.value}
                      onCheckedChange={field.onChange}
                    />
                  </FormControl>
                </FormItem>
              )}
            />
            
            {/* Transition effect */}
            <FormField
              control={form.control}
              name="transitionEffect"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="font-medium text-gray-900">
                    Transition effect
                  </FormLabel>
                  <Select 
                    onValueChange={field.onChange}
                    defaultValue={field.value}
                    value={field.value}
                  >
                    <FormControl>
                      <SelectTrigger className="w-full mt-1">
                        <SelectValue placeholder="Select transition effect" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="slide">Slide</SelectItem>
                      <SelectItem value="fade">Fade</SelectItem>
                      <SelectItem value="zoom">Zoom</SelectItem>
                      <SelectItem value="flip">Flip</SelectItem>
                    </SelectContent>
                  </Select>
                </FormItem>
              )}
            />
            
            {/* Blacklist words */}
            <FormField
              control={form.control}
              name="blacklistWords"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="font-medium text-gray-900">
                    Blacklist words
                  </FormLabel>
                  <FormDescription>
                    Comma-separated list of words to filter out from submissions
                  </FormDescription>
                  <FormControl>
                    <Input
                      placeholder="Enter comma-separated words to filter out"
                      className="mt-1"
                      {...field}
                    />
                  </FormControl>
                </FormItem>
              )}
            />
            
            {/* Save button */}
            <div className="flex justify-end">
              <Button
                type="submit"
                className="bg-blue-600 hover:bg-blue-700 text-white"
                disabled={updateSettingsMutation.isPending}
              >
                {updateSettingsMutation.isPending ? "Saving..." : "Save Settings"}
              </Button>
            </div>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
}
