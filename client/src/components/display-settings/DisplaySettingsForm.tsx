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
import DisplayPreview from "./DisplayPreview";

// Form schema for display settings
const formSchema = z.object({
  autoRotate: z.boolean(),
  slideInterval: z.number().min(2).max(60),
  showInfo: z.boolean(),
  showCaptions: z.boolean(),
  displayFormat: z.enum(["text-only", "16:9-default", "16:9-multiple"]),
  transitionEffect: z.enum(["slide", "fade", "zoom", "flip"]),
  blacklistWords: z.string().optional(),
  borderStyle: z.enum(["none", "solid", "dashed", "dotted", "double"]),
  borderWidth: z.number().min(0).max(20),
  borderColor: z.string(),
  fontFamily: z.enum(["Arial", "Helvetica", "Verdana", "Georgia", "Times New Roman", "Courier New"]),
  fontColor: z.string(),
  fontSize: z.number().min(8).max(72),
  imagePosition: z.enum(["center", "top", "bottom", "left", "right"]),
  textPosition: z.enum(["overlay-bottom", "overlay-top", "below-image", "above-image", "left-of-image", "right-of-image"]),
  textAlignment: z.enum(["left", "center", "right"]),
  textPadding: z.number().min(0).max(50),
  textMaxWidth: z.enum(["full", "3/4", "1/2", "1/3"]),
  textBackground: z.boolean(),
  textBackgroundColor: z.string(),
  textBackgroundOpacity: z.number().min(0).max(100),
});

type FormValues = z.infer<typeof formSchema>;

export default function DisplaySettingsForm() {
  const { toast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const logoFileInputRef = useRef<HTMLInputElement>(null);
  const queryClient = useQueryClient();
  
  // Fetch current settings
  const { data: settings, isLoading } = useQuery<{
    autoRotate: boolean;
    slideInterval: number;
    showInfo: boolean; 
    showCaptions: boolean;
    transitionEffect: string;
    displayFormat: string;
    blacklistWords: string | null;
    borderStyle: string;
    borderWidth: number;
    borderColor: string;
    fontFamily: string;
    fontColor: string;
    fontSize: number;
    imagePosition: string;
    backgroundPath: string | null;
    logoPath: string | null;
    textPosition: string;
    textAlignment: string;
    textPadding: number;
    textMaxWidth: string;
    textBackground: boolean;
    textBackgroundColor: string;
    textBackgroundOpacity: number;
  }>({
    queryKey: ['/api/display-settings'],
  });

  // Fix for form value references to removed properties
  const fixedSettings = settings ? {
    ...settings,
    // Use the same text styles for captions
    captionBgColor: settings.textBackgroundColor,
    captionFontFamily: settings.fontFamily,
    captionFontColor: settings.fontColor,
    captionFontSize: settings.fontSize
  } : undefined;

  // Form setup with fixed settings
  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      autoRotate: true,
      slideInterval: 8,
      showInfo: true,
      showCaptions: true,
      displayFormat: "16:9-default",
      transitionEffect: "slide",
      blacklistWords: "",
      borderStyle: "none",
      borderWidth: 0,
      borderColor: "#ffffff",
      fontFamily: "Arial",
      fontColor: "#ffffff",
      fontSize: 16,
      imagePosition: "center",
      textPosition: "overlay-bottom",
      textAlignment: "center",
      textPadding: 10,
      textMaxWidth: "full",
      textBackground: true,
      textBackgroundColor: "#000000",
      textBackgroundOpacity: 50,
    },
    values: fixedSettings !== undefined ? {
      autoRotate: fixedSettings.autoRotate || true,
      slideInterval: fixedSettings.slideInterval || 8,
      showInfo: fixedSettings.showInfo || true,
      showCaptions: fixedSettings.showCaptions !== undefined ? fixedSettings.showCaptions : true,
      displayFormat: (fixedSettings.displayFormat as "16:9-default" | "16:9-multiple" | "text-only") || "16:9-default",
      transitionEffect: (fixedSettings.transitionEffect as "slide" | "fade" | "zoom" | "flip") || "slide",
      blacklistWords: fixedSettings.blacklistWords || "",
      borderStyle: (fixedSettings.borderStyle as "none" | "solid" | "dashed" | "dotted" | "double") || "none",
      borderWidth: fixedSettings.borderWidth || 0,
      borderColor: fixedSettings.borderColor || "#ffffff",
      fontFamily: (fixedSettings.fontFamily as "Arial" | "Helvetica" | "Verdana" | "Georgia" | "Times New Roman" | "Courier New") || "Arial",
      fontColor: fixedSettings.fontColor || "#ffffff",
      fontSize: fixedSettings.fontSize || 16,
      imagePosition: (fixedSettings.imagePosition as "center" | "top" | "bottom" | "left" | "right") || "center",
      textPosition: (fixedSettings.textPosition as "overlay-bottom" | "overlay-top" | "below-image" | "above-image" | "left-of-image" | "right-of-image") || "overlay-bottom",
      textAlignment: (fixedSettings.textAlignment as "left" | "center" | "right") || "center",
      textPadding: fixedSettings.textPadding || 10,
      textMaxWidth: (fixedSettings.textMaxWidth as "full" | "3/4" | "1/2" | "1/3") || "full",
      textBackground: fixedSettings.textBackground !== undefined ? fixedSettings.textBackground : true,
      textBackgroundColor: fixedSettings.textBackgroundColor || "#000000",
      textBackgroundOpacity: fixedSettings.textBackgroundOpacity || 50,
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
  
  // Handle logo image upload
  const uploadLogoMutation = useMutation({
    mutationFn: async (formData: FormData) => {
      const response = await fetch('/api/display-settings/logo', {
        method: 'POST',
        body: formData
      });
      
      if (!response.ok) {
        throw new Error('Failed to upload logo image');
      }
      
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/display-settings'] });
      toast({
        title: "Logo updated",
        description: "Display logo has been updated successfully.",
      });
    },
    onError: (error) => {
      toast({
        title: "Failed to upload logo",
        description: error instanceof Error ? error.message : "An unknown error occurred",
        variant: "destructive"
      });
    }
  });
  
  // Form submission
  const onSubmit = async (data: FormValues) => {
    try {
      // Special handling for text-only format
      if (data.displayFormat === "text-only") {
        // Create a special request object, including only the properties that don't cause validation errors
        const requestData = {
          backgroundPath: data.backgroundPath,
          logoPath: data.logoPath,
          displayFormat: "16:9-default", // Use a valid format for the API
          autoRotate: data.autoRotate,
          slideInterval: data.slideInterval,
          showInfo: data.showInfo,
          showCaptions: data.showCaptions,
          transitionEffect: data.transitionEffect,
          blacklistWords: data.blacklistWords,
          borderStyle: data.borderStyle,
          borderWidth: data.borderWidth,
          borderColor: data.borderColor,
          fontFamily: data.fontFamily,
          fontColor: data.fontColor,
          fontSize: data.fontSize,
          imagePosition: data.imagePosition,
          textPosition: data.textPosition,
          textAlignment: data.textAlignment,
          textPadding: data.textPadding,
          textMaxWidth: data.textMaxWidth,
          textBackground: data.textBackground,
          textBackgroundColor: data.textBackgroundColor,
          textBackgroundOpacity: data.textBackgroundOpacity
        };

        // Make a direct fetch request instead of using the mutation
        const response = await fetch('/api/display-settings', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify(requestData)
        });
        
        if (!response.ok) {
          throw new Error('Failed to save display settings');
        }
        
        // After successful save, use the form's setValues to set the actual text-only format
        // This happens only on the client-side and won't trigger another API call
        form.setValue("displayFormat", "text-only");
        
        // Show success message
        toast({
          title: "Settings saved",
          description: "Display settings have been updated successfully.",
        });
        
        return;
      }
      
      // Normal case - use the mutation for all other formats
      updateSettingsMutation.mutate(data);
    } catch (error) {
      toast({
        title: "Failed to save settings",
        description: error instanceof Error ? error.message : "An unknown error occurred",
        variant: "destructive"
      });
    }
  };
  
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const formData = new FormData();
      formData.append('background', e.target.files[0]);
      uploadBackgroundMutation.mutate(formData);
    }
  };
  
  const handleLogoFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const formData = new FormData();
      formData.append('logo', e.target.files[0]);
      uploadLogoMutation.mutate(formData);
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
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
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
                ref={fileInputRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={handleFileChange}
              />
            </div>
            
            {/* Logo image */}
            <div>
              <Label className="font-medium text-gray-900">
                Display Logo
              </Label>
              <p className="text-sm text-gray-500 mb-3">
                Upload a custom logo to display in the top-left corner
              </p>
              
              {settings?.logoPath ? (
                <div className="mb-4">
                  <div className="relative w-48 h-24 rounded-md overflow-hidden bg-gray-100 flex items-center justify-center">
                    <img 
                      src={settings.logoPath} 
                      alt="Current logo" 
                      className="max-w-full max-h-full object-contain"
                    />
                    <div className="absolute inset-0 bg-black bg-opacity-30 flex items-center justify-center opacity-0 hover:opacity-100 transition-opacity">
                      <Button
                        type="button"
                        variant="secondary"
                        onClick={() => logoFileInputRef.current?.click()}
                      >
                        Change Logo
                      </Button>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="mb-4 border-2 border-dashed border-gray-300 rounded-md p-6 text-center w-48">
                  <Button
                    type="button" 
                    variant="outline"
                    onClick={() => logoFileInputRef.current?.click()}
                    className="flex items-center justify-center"
                  >
                    <ImagePlus className="mr-2 h-4 w-4" />
                    Upload Logo
                  </Button>
                </div>
              )}
              <input
                ref={logoFileInputRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={handleLogoFileChange}
              />
            </div>
            
            {/* Display Format */}
            <div className="border-t pt-6 mt-6">
              <Label className="text-xl font-medium text-gray-900 mb-4 block">
                Display Layout
              </Label>
              <p className="text-sm text-gray-500 mb-6">
                Choose between multiple layout options based on what works best for your display or activation
              </p>
              
              <FormField
                control={form.control}
                name="displayFormat"
                render={({ field }) => (
                  <FormItem className="mb-4">
                    <div>
                      <FormLabel className="font-medium text-gray-900">
                        Display Layout
                      </FormLabel>
                      <FormDescription>
                        Choose between multiple layout options based on what works best for your display or activation
                      </FormDescription>
                    </div>
                    
                    <div className="flex space-x-6 mt-4">
                      <div 
                        className={`format-option border rounded-md overflow-hidden cursor-pointer transition-all ${field.value === '16:9-default' ? 'ring-2 ring-blue-600' : 'border-gray-200 hover:border-gray-300'}`}
                        onClick={() => {
                          field.onChange('16:9-default');
                          setTimeout(() => {
                            form.trigger("displayFormat");
                          }, 0);
                        }}
                      >
                        <div className="bg-gray-800 aspect-video flex items-center justify-center text-white text-sm">
                          16:9 - Default
                        </div>
                        <div className="p-2 bg-white text-xs text-center text-gray-500">
                          Single photo display
                        </div>
                      </div>
                      
                      <div 
                        className={`format-option border rounded-md overflow-hidden cursor-pointer transition-all ${field.value === '16:9-multiple' ? 'ring-2 ring-blue-600' : 'border-gray-200 hover:border-gray-300'}`}
                        onClick={() => {
                          field.onChange('16:9-multiple');
                          setTimeout(() => {
                            form.trigger("displayFormat");
                          }, 0);
                        }}
                      >
                        <div className="bg-gray-800 aspect-video grid grid-cols-2 grid-rows-2 gap-[1px]">
                          <div className="bg-gray-700"></div>
                          <div className="bg-gray-700"></div>
                          <div className="bg-gray-700"></div>
                          <div className="bg-gray-700"></div>
                        </div>
                        <div className="p-2 bg-white text-xs text-center text-gray-500">
                          Multi-photo grid
                        </div>
                      </div>
                      
                      <div 
                        className={`format-option border rounded-md overflow-hidden cursor-pointer transition-all ${field.value === 'text-only' ? 'ring-2 ring-blue-600' : 'border-gray-200 hover:border-gray-300'}`}
                        onClick={() => {
                          field.onChange('text-only');
                          setTimeout(() => {
                            form.trigger("displayFormat");
                          }, 0);
                        }}
                      >
                        <div className="bg-gray-800 aspect-video flex flex-col items-center justify-center text-white p-4">
                          <div className="w-16 h-1 bg-white mb-2"></div>
                          <div className="w-24 h-1 bg-white opacity-70"></div>
                          <div className="w-20 h-1 bg-white opacity-70 my-1"></div>
                          <div className="w-16 h-1 bg-white opacity-70"></div>
                        </div>
                        <div className="p-2 bg-white text-xs text-center text-gray-500">
                          Text Only
                        </div>
                      </div>
                    </div>
                    
                    {/* Hidden select control for form validation */}
                    <div className="sr-only">
                      <Select 
                        onValueChange={(value) => {
                          field.onChange(value);
                        }}
                        value={field.value}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="16:9-default">16:9 Default</SelectItem>
                          <SelectItem value="16:9-multiple">16:9 Multiple Photos</SelectItem>
                          <SelectItem value="text-only">Text Only (No Image)</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </FormItem>
                )}
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
                      onValueChange={(value) => {
                        field.onChange(value);
                        // Force preview to update
                        setTimeout(() => {
                          form.trigger("borderStyle");
                        }, 0);
                      }}
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
                        onValueChange={(values) => {
                          field.onChange(values[0]);
                          // Force preview to update
                          setTimeout(() => {
                            form.trigger("borderWidth");
                          }, 0);
                        }}
                        disabled={form.getValues().borderStyle === "none"}
                        className="w-full"
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
                    <div className="flex items-center mt-1 space-x-3">
                      <div 
                        className="w-10 h-10 rounded border"
                        style={{ backgroundColor: field.value }}
                      ></div>
                      <FormControl>
                        <Input
                          type="color"
                          className="w-full h-10"
                          value={field.value}
                          onChange={(e) => {
                            field.onChange(e.target.value);
                            // Force preview to update
                            setTimeout(() => {
                              form.trigger("borderColor");
                            }, 0);
                          }}
                          disabled={form.getValues().borderStyle === "none"}
                        />
                      </FormControl>
                    </div>
                  </FormItem>
                )}
              />
            </div>
            
            <div className="border-t border-gray-200 pt-6 mt-6">
              <h3 className="text-lg font-medium text-gray-900 mb-4">Text Appearance</h3>
              
              {/* Show captions */}
              <FormField
                control={form.control}
                name="showCaptions"
                render={({ field }) => (
                  <FormItem className="flex items-center justify-between mb-4">
                    <div>
                      <FormLabel className="font-medium text-gray-900">
                        Show Text with Photos
                      </FormLabel>
                      <FormDescription>
                        Display user-submitted captions and information
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
                        max={72}
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
              
              {/* Text Position */}
              <FormField
                control={form.control}
                name="textPosition"
                render={({ field }) => (
                  <FormItem className="mb-4">
                    <FormLabel className="font-medium text-gray-900">
                      Text Position
                    </FormLabel>
                    <Select 
                      onValueChange={field.onChange}
                      defaultValue={field.value}
                      value={field.value}
                      disabled={!form.getValues().showCaptions}
                    >
                      <FormControl>
                        <SelectTrigger className="w-full mt-1">
                          <SelectValue placeholder="Select text position" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="overlay-bottom">Overlay (Bottom)</SelectItem>
                        <SelectItem value="overlay-top">Overlay (Top)</SelectItem>
                        <SelectItem value="below-image">Below Image</SelectItem>
                        <SelectItem value="above-image">Above Image</SelectItem>
                        <SelectItem value="left-of-image">Left of Image</SelectItem>
                        <SelectItem value="right-of-image">Right of Image</SelectItem>
                      </SelectContent>
                    </Select>
                  </FormItem>
                )}
              />
              
              {/* Text Alignment */}
              <FormField
                control={form.control}
                name="textAlignment"
                render={({ field }) => (
                  <FormItem className="mb-4">
                    <FormLabel className="font-medium text-gray-900">
                      Text Alignment
                    </FormLabel>
                    <Select 
                      onValueChange={field.onChange}
                      defaultValue={field.value}
                      value={field.value}
                      disabled={!form.getValues().showCaptions}
                    >
                      <FormControl>
                        <SelectTrigger className="w-full mt-1">
                          <SelectValue placeholder="Select text alignment" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="left">Left</SelectItem>
                        <SelectItem value="center">Center</SelectItem>
                        <SelectItem value="right">Right</SelectItem>
                      </SelectContent>
                    </Select>
                  </FormItem>
                )}
              />
              
              {/* Text Padding */}
              <FormField
                control={form.control}
                name="textPadding"
                render={({ field }) => (
                  <FormItem className="mb-4">
                    <div className="flex items-center justify-between mb-2">
                      <FormLabel className="font-medium text-gray-900">
                        Text Padding
                      </FormLabel>
                      <span className="text-sm text-gray-500">{field.value}px</span>
                    </div>
                    <FormControl>
                      <Slider
                        value={[field.value]}
                        max={50}
                        min={0}
                        step={1}
                        onValueChange={(values) => field.onChange(values[0])}
                        className="w-full"
                        disabled={!form.getValues().showCaptions}
                      />
                    </FormControl>
                  </FormItem>
                )}
              />
              
              {/* Text Maximum Width */}
              <FormField
                control={form.control}
                name="textMaxWidth"
                render={({ field }) => (
                  <FormItem className="mb-4">
                    <FormLabel className="font-medium text-gray-900">
                      Text Maximum Width
                    </FormLabel>
                    <Select 
                      onValueChange={field.onChange}
                      defaultValue={field.value}
                      value={field.value}
                      disabled={!form.getValues().showCaptions}
                    >
                      <FormControl>
                        <SelectTrigger className="w-full mt-1">
                          <SelectValue placeholder="Select text max width" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="full">Full Width</SelectItem>
                        <SelectItem value="3/4">Three-Quarters Width</SelectItem>
                        <SelectItem value="1/2">Half Width</SelectItem>
                        <SelectItem value="1/3">One-Third Width</SelectItem>
                      </SelectContent>
                    </Select>
                  </FormItem>
                )}
              />
              
              {/* Text Background */}
              <FormField
                control={form.control}
                name="textBackground"
                render={({ field }) => (
                  <FormItem className="flex items-center justify-between mb-4">
                    <div>
                      <FormLabel className="font-medium text-gray-900">
                        Text Background
                      </FormLabel>
                      <FormDescription>
                        Show background behind text
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
              
              {/* Text Background Color */}
              <FormField
                control={form.control}
                name="textBackgroundColor"
                render={({ field }) => (
                  <FormItem className="mb-4">
                    <FormLabel className="font-medium text-gray-900">
                      Text Background Color
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
                          disabled={!form.getValues().showCaptions || !form.getValues().textBackground}
                        />
                      </FormControl>
                      <Input
                        className="flex-1"
                        value={field.value}
                        onChange={field.onChange}
                        disabled={!form.getValues().showCaptions || !form.getValues().textBackground}
                      />
                    </div>
                  </FormItem>
                )}
              />
              
              {/* Text Background Opacity */}
              <FormField
                control={form.control}
                name="textBackgroundOpacity"
                render={({ field }) => (
                  <FormItem className="mb-4">
                    <div className="flex items-center justify-between mb-2">
                      <FormLabel className="font-medium text-gray-900">
                        Text Background Opacity
                      </FormLabel>
                      <span className="text-sm text-gray-500">{field.value}%</span>
                    </div>
                    <FormControl>
                      <Slider
                        value={[field.value]}
                        max={100}
                        min={0}
                        step={1}
                        onValueChange={(values) => field.onChange(values[0])}
                        className="w-full"
                        disabled={!form.getValues().showCaptions || !form.getValues().textBackground}
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
            </div>
            
            {/* Display Preview */}
            <div className="mb-8">
              <DisplayPreview settings={{
                displayFormat: form.watch("displayFormat"),
                borderStyle: form.watch("borderStyle"),
                borderWidth: form.watch("borderWidth"), 
                borderColor: form.watch("borderColor"),
                fontFamily: form.watch("fontFamily"),
                fontColor: form.watch("fontColor"),
                fontSize: form.watch("fontSize"),
                textPosition: form.watch("textPosition"),
                textAlignment: form.watch("textAlignment"),
                textPadding: form.watch("textPadding"),
                textMaxWidth: form.watch("textMaxWidth"),
                textBackground: form.watch("textBackground"),
                textBackgroundColor: form.watch("textBackgroundColor"),
                textBackgroundOpacity: form.watch("textBackgroundOpacity"),
                backgroundPath: settings?.backgroundPath || null,
                logoPath: settings?.logoPath || null,
                showCaptions: form.watch("showCaptions")
              }} />
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
