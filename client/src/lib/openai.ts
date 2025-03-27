import { apiRequest } from "./queryClient";

// Interface for OpenAI image transformation response
interface TransformImageResponse {
  success: boolean;
  url?: string;
  error?: string;
}

/**
 * Request image transformation using OpenAI API (via backend)
 * 
 * @param imageId The ID of the image to transform
 * @param prompt The transformation prompt to use
 * @param stylePreset The style preset to apply
 * @returns Promise with the transformation result
 */
export async function requestImageTransformation(
  imageId: number,
  prompt: string,
  stylePreset: string
): Promise<TransformImageResponse> {
  try {
    console.log("Requesting transformation:", { imageId, prompt, stylePreset });
    
    const response = await apiRequest("POST", "/api/transformations", {
      imageId,
      prompt,
      stylePreset
    });
    
    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || "Failed to transform image");
    }
    
    const data = await response.json();
    console.log("Transformation result:", data);
    
    return {
      success: true,
      url: data.transformedPath
    };
  } catch (error) {
    console.error("Transformation error:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error occurred"
    };
  }
}
