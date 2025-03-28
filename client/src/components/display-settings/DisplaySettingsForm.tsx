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
  showCaptions: z.boolean(),
  separateCaptions: z.boolean(),
  transitionEffect: z.enum(["slide", "fade", "zoom", "flip"]),
  blacklistWords: z.string().optional(),
  borderStyle: z.enum(["none", "solid", "dashed", "dotted", "double"]),
  borderWidth: z.number().min(0).max(20),
  borderColor: z.string(),
  fontFamily: z.enum(["Arial", "Helvetica", "Verdana", "Georgia", "Times New Roman", "Courier New"]),
  fontColor: z.string(),
  fontSize: z.number().min(8).max(36),
  imagePosition: z.enum(["center", "top", "bottom", "left", "right"]),
  captionBgColor: z.string(),
  captionFontFamily: z.enum(["Arial", "Helvetica", "Verdana", "Georgia", "Times New Roman", "Courier New"]),
  captionFontColor: z.string(),
  captionFontSize: z.number().min(8).max(36),
});

type FormValues = z.infer<typeof formSchema>;

export default function DisplaySettingsForm() {
  const { toast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const queryClient = useQueryClient();
  
  // Fetch current settings
  const { data: settings, isLoading } = useQuery<{
    autoRotate: boolean;
    slideInterval: number;
    showInfo: boolean; 
    showCaptions: boolean;
    separateCaptions: boolean;
    transitionEffect: string;
    blacklistWords: string | null;
    borderStyle: string;
    borderWidth: number;
    borderColor: string;
    fontFamily: string;
    fontColor: string;
    fontSize: number;
    imagePosition: string;
    captionBgColor: string;
    captionFontFamily: string;
    captionFontColor: string;
    captionFontSize: number;
    backgroundPath: string | null;
  }>({
    queryKey: ['/api/display-settings'],
  });

  // Form setup
  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      autoRotate: true,
      slideInterval: 8,
      showInfo: true,
      showCaptions: true,
      separateCaptions: false,
      transitionEffect: "slide",
      blacklistWords: "",
      borderStyle: "none",
      borderWidth: 0,
      borderColor: "#ffffff",
      fontFamily: "Arial",
      fontColor: "#ffffff",
      fontSize: 16,
      imagePosition: "center",
      captionBgColor: "rgba(0,0,0,0.5)",
      captionFontFamily: "Arial",
      captionFontColor: "#ffffff",
      captionFontSize: 14,
    },
    values: settings !== undefined ? {
      autoRotate: settings.autoRotate || true,
      slideInterval: settings.slideInterval || 8,
      showInfo: settings.showInfo || true,
      showCaptions: settings.showCaptions !== undefined ? settings.showCaptions : true,
      separateCaptions: settings.separateCaptions !== undefined ? settings.separateCaptions : false,
      transitionEffect: (settings.transitionEffect as "slide" | "fade" | "zoom" | "flip") || "slide",
      blacklistWords: settings.blacklistWords || "",
      borderStyle: (settings.borderStyle as "none" | "solid" | "dashed" | "dotted" | "double") || "none",
      borderWidth: settings.borderWidth || 0,
      borderColor: settings.borderColor || "#ffffff",
      fontFamily: (settings.fontFamily as "Arial" | "Helvetica" | "Verdana" | "Georgia" | "Times New Roman" | "Courier New") || "Arial",
      fontColor: settings.fontColor || "#ffffff",
      fontSize: settings.fontSize || 16,
      imagePosition: (settings.imagePosition as "center" | "top" | "bottom" | "left" | "right") || "center",
      captionBgColor: settings.captionBgColor || "rgba(0,0,0,0.5)",
      captionFontFamily: (settings.captionFontFamily as "Arial" | "Helvetica" | "Verdana" | "Georgia" | "Times New Roman" | "Courier New") || "Arial",
      captionFontColor: settings.captionFontColor || "#ffffff",
      captionFontSize: settings.captionFontSize || 14,
    } : undefined,
  });
  
  // Handle settings update
  const updateSettingsMutation = useMutation({
    mutationFn: async (data: FormValues) => {
      const response = await fetch('/api/display-settings', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(data)
      });
      
      if (!response.ok) {
        throw new Error('Failed to save display settings');
      }
      
      return response.json();
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
      const response = await fetch('/api/display-settings/background', {
        method: 'POST',
        body: formData
      });
      
      if (!response.ok) {
        throw new Error('Failed to upload background image');
      }
      
      return response.json();
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
            
            <div className="border-t border-gray-200 pt-6 mt-6">
              <h3 className="text-lg font-medium text-gray-900 mb-4">Photo Appearance</h3>
              
              {/* Border style */}
              <FormField
                control={form.control}
                name="borderStyle"
                render={({ field }) => (
                  <FormItem className="mb-4">
                    <FormLabel className="font-medium text-gray-900">
                      Border Style
                    </FormLabel>
                    <Select 
                      onValueChange={field.onChange}
                      defaultValue={field.value}
                      value={field.value}
                    >
                      <FormControl>
                        <SelectTrigger className="w-full mt-1">
                          <SelectValue placeholder="Select border style" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="none">None</SelectItem>
                        <SelectItem value="solid">Solid</SelectItem>
                        <SelectItem value="dashed">Dashed</SelectItem>
                        <SelectItem value="dotted">Dotted</SelectItem>
                        <SelectItem value="double">Double</SelectItem>
                      </SelectContent>
                    </Select>
                  </FormItem>
                )}
              />
              
              {/* Border width */}
              <FormField
                control={form.control}
                name="borderWidth"
                render={({ field }) => (
                  <FormItem className="mb-4">
                    <div className="flex items-center justify-between mb-2">
                      <FormLabel className="font-medium text-gray-900">
                        Border Width
                      </FormLabel>
                      <span className="text-sm text-gray-500">{field.value}px</span>
                    </div>
                    <FormControl>
                      <Slider
                        value={[field.value]}
                        max={20}
                        min={0}
                        step={1}
                        onValueChange={(values) => field.onChange(values[0])}
                        className="w-full"
                        disabled={form.getValues().borderStyle === "none"}
                      />
                    </FormControl>
                  </FormItem>
                )}
              />
              
              {/* Border color */}
              <FormField
                control={form.control}
                name="borderColor"
                render={({ field }) => (
                  <FormItem className="mb-4">
                    <FormLabel className="font-medium text-gray-900">
                      Border Color
                    </FormLabel>
                    <div className="flex items-center gap-2 mt-1">
                      <div 
                        className="w-8 h-8 rounded-md border border-gray-300" 
                        style={{ backgroundColor: field.value }}
                      />
                      <FormControl>
                        <Input
                          type="color"
                          className="w-12 h-8 p-0 border-0"
                          value={field.value}
                          onChange={field.onChange}
                          disabled={form.getValues().borderStyle === "none"}
                        />
                      </FormControl>
                      <Input
                        className="flex-1"
                        value={field.value}
                        onChange={field.onChange}
                        disabled={form.getValues().borderStyle === "none"}
                      />
                    </div>
                  </FormItem>
                )}
              />
            </div>
            
            <div className="border-t border-gray-200 pt-6 mt-6">
              <h3 className="text-lg font-medium text-gray-900 mb-4">Caption Settings</h3>
              
              {/* Show captions */}
              <FormField
                control={form.control}
                name="showCaptions"
                render={({ field }) => (
                  <FormItem className="flex items-center justify-between mb-4">
                    <div>
                      <FormLabel className="font-medium text-gray-900">
                        Show Captions
                      </FormLabel>
                      <FormDescription>
                        Display user-submitted captions with photos
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
              
              {/* Separate captions */}
              <FormField
                control={form.control}
                name="separateCaptions"
                render={({ field }) => (
                  <FormItem className="flex items-center justify-between mb-4">
                    <div>
                      <FormLabel className="font-medium text-gray-900">
                        Use Separate Caption Box
                      </FormLabel>
                      <FormDescription>
                        Display captions in their own customizable box
                      </FormDescription>
                    </div>
                    <FormControl>
                      <Switch
                        checked={field.value}
                        onCheckedChange={field.onChange}
                        disabled={!form.getValues().showCaptions}
                      />
                    </FormControl>
                  </FormItem>
                )}
              />
              
              {/* Caption background color */}
              <FormField
                control={form.control}
                name="captionBgColor"
                render={({ field }) => (
                  <FormItem className="mb-4">
                    <FormLabel className="font-medium text-gray-900">
                      Caption Background Color
                    </FormLabel>
                    <div className="flex items-center gap-2 mt-1">
                      <div 
                        className="w-8 h-8 rounded-md border border-gray-300" 
                        style={{ backgroundColor: field.value }}
                      />
                      <FormControl>
                        <Input
                          type="color"
                          className="w-12 h-8 p-0 border-0"
                          value={field.value}
                          onChange={field.onChange}
                          disabled={!form.getValues().showCaptions}
                        />
                      </FormControl>
                      <Input
                        className="flex-1"
                        value={field.value}
                        onChange={field.onChange}
                        disabled={!form.getValues().showCaptions}
                      />
                    </div>
                  </FormItem>
                )}
              />
              
              {/* Caption font family */}
              <FormField
                control={form.control}
                name="captionFontFamily"
                render={({ field }) => (
                  <FormItem className="mb-4">
                    <FormLabel className="font-medium text-gray-900">
                      Caption Font Family
                    </FormLabel>
                    <Select 
                      onValueChange={field.onChange}
                      defaultValue={field.value}
                      value={field.value}
                      disabled={!form.getValues().showCaptions}
                    >
                      <FormControl>
                        <SelectTrigger className="w-full mt-1">
                          <SelectValue placeholder="Select font family" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="Arial">Arial</SelectItem>
                        <SelectItem value="Helvetica">Helvetica</SelectItem>
                        <SelectItem value="Verdana">Verdana</SelectItem>
                        <SelectItem value="Georgia">Georgia</SelectItem>
                        <SelectItem value="Times New Roman">Times New Roman</SelectItem>
                        <SelectItem value="Courier New">Courier New</SelectItem>
                      </SelectContent>
                    </Select>
                  </FormItem>
                )}
              />
              
              {/* Caption font color */}
              <FormField
                control={form.control}
                name="captionFontColor"
                render={({ field }) => (
                  <FormItem className="mb-4">
                    <FormLabel className="font-medium text-gray-900">
                      Caption Font Color
                    </FormLabel>
                    <div className="flex items-center gap-2 mt-1">
                      <div 
                        className="w-8 h-8 rounded-md border border-gray-300" 
                        style={{ backgroundColor: field.value }}
                      />
                      <FormControl>
                        <Input
                          type="color"
                          className="w-12 h-8 p-0 border-0"
                          value={field.value}
                          onChange={field.onChange}
                          disabled={!form.getValues().showCaptions}
                        />
                      </FormControl>
                      <Input
                        className="flex-1"
                        value={field.value}
                        onChange={field.onChange}
                        disabled={!form.getValues().showCaptions}
                      />
                    </div>
                  </FormItem>
                )}
              />
              
              {/* Caption font size */}
              <FormField
                control={form.control}
                name="captionFontSize"
                render={({ field }) => (
                  <FormItem className="mb-4">
                    <div className="flex items-center justify-between mb-2">
                      <FormLabel className="font-medium text-gray-900">
                        Caption Font Size
                      </FormLabel>
                      <span className="text-sm text-gray-500">{field.value}px</span>
                    </div>
                    <FormControl>
                      <Slider
                        value={[field.value]}
                        max={36}
                        min={8}
                        step={1}
                        onValueChange={(values) => field.onChange(values[0])}
                        className="w-full"
                        disabled={!form.getValues().showCaptions}
                      />
                    </FormControl>
                  </FormItem>
                )}
              />
            </div>
            
            <div className="border-t border-gray-200 pt-6 mt-6">
              <h3 className="text-lg font-medium text-gray-900 mb-4">Text Appearance</h3>
              
              {/* Font family */}
              <FormField
                control={form.control}
                name="fontFamily"
                render={({ field }) => (
                  <FormItem className="mb-4">
                    <FormLabel className="font-medium text-gray-900">
                      Font Family
                    </FormLabel>
                    <Select 
                      onValueChange={field.onChange}
                      defaultValue={field.value}
                      value={field.value}
                    >
                      <FormControl>
                        <SelectTrigger className="w-full mt-1">
                          <SelectValue placeholder="Select font family" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="Arial">Arial</SelectItem>
                        <SelectItem value="Helvetica">Helvetica</SelectItem>
                        <SelectItem value="Verdana">Verdana</SelectItem>
                        <SelectItem value="Georgia">Georgia</SelectItem>
                        <SelectItem value="Times New Roman">Times New Roman</SelectItem>
                        <SelectItem value="Courier New">Courier New</SelectItem>
                      </SelectContent>
                    </Select>
                  </FormItem>
                )}
              />
              
              {/* Font color */}
              <FormField
                control={form.control}
                name="fontColor"
                render={({ field }) => (
                  <FormItem className="mb-4">
                    <FormLabel className="font-medium text-gray-900">
                      Font Color
                    </FormLabel>
                    <div className="flex items-center gap-2 mt-1">
                      <div 
                        className="w-8 h-8 rounded-md border border-gray-300" 
                        style={{ backgroundColor: field.value }}
                      />
                      <FormControl>
                        <Input
                          type="color"
                          className="w-12 h-8 p-0 border-0"
                          value={field.value}
                          onChange={field.onChange}
                        />
                      </FormControl>
                      <Input
                        className="flex-1"
                        value={field.value}
                        onChange={field.onChange}
                      />
                    </div>
                  </FormItem>
                )}
              />
              
              {/* Font size */}
              <FormField
                control={form.control}
                name="fontSize"
                render={({ field }) => (
                  <FormItem className="mb-4">
                    <div className="flex items-center justify-between mb-2">
                      <FormLabel className="font-medium text-gray-900">
                        Font Size
                      </FormLabel>
                      <span className="text-sm text-gray-500">{field.value}px</span>
                    </div>
                    <FormControl>
                      <Slider
                        value={[field.value]}
                        max={36}
                        min={8}
                        step={1}
                        onValueChange={(values) => field.onChange(values[0])}
                        className="w-full"
                      />
                    </FormControl>
                  </FormItem>
                )}
              />
              
              {/* Image position */}
              <FormField
                control={form.control}
                name="imagePosition"
                render={({ field }) => (
                  <FormItem className="mb-4">
                    <FormLabel className="font-medium text-gray-900">
                      Image Position
                    </FormLabel>
                    <Select 
                      onValueChange={field.onChange}
                      defaultValue={field.value}
                      value={field.value}
                    >
                      <FormControl>
                        <SelectTrigger className="w-full mt-1">
                          <SelectValue placeholder="Select image position" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="center">Center</SelectItem>
                        <SelectItem value="top">Top</SelectItem>
                        <SelectItem value="bottom">Bottom</SelectItem>
                        <SelectItem value="left">Left</SelectItem>
                        <SelectItem value="right">Right</SelectItem>
                      </SelectContent>
                    </Select>
                  </FormItem>
                )}
              />
              
              {/* Preview */}
              <div className="mt-4 p-4 rounded-md bg-gray-100">
                <h4 className="text-sm font-medium text-gray-700 mb-2">Preview:</h4>
                <div 
                  className="p-4 bg-black rounded-md text-center"
                  style={{ 
                    borderStyle: form.getValues().borderStyle === "none" ? undefined : form.getValues().borderStyle,
                    borderWidth: form.getValues().borderStyle === "none" ? 0 : `${form.getValues().borderWidth}px`,
                    borderColor: form.getValues().borderColor
                  }}
                >
                  <div 
                    className="text-lg font-medium"
                    style={{ 
                      fontFamily: form.getValues().fontFamily,
                      color: form.getValues().fontColor 
                    }}
                  >
                    Sample Photo Caption
                  </div>
                </div>
              </div>
            </div>
            
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
