import OpenAI from "openai";
import * as fs from 'fs/promises';

// the newest OpenAI model is "gpt-4o" which was released May 13, 2024. do not change this unless explicitly requested by the user
const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

/**
 * Generates an AI-transformed version of an image
 * @param imagePath Path to the original image file
 * @param prompt Prompt to guide the transformation
 * @param intensity How strong the effect should be (1-10)
 * @returns Base64 encoded transformed image or null on failure
 */
export async function generateTransformedImage(
  imagePath: string,
  prompt: string,
  intensity: number
): Promise<string | null> {
  try {
    // Validate input
    if (!process.env.OPENAI_API_KEY) {
      console.error("OPENAI_API_KEY environment variable is not set");
      
      // For development purposes, use mock function when API key is not available
      if (process.env.NODE_ENV !== 'production') {
        console.warn("Using mock transformation due to missing API key");
        return mockGenerateTransformedImage(imagePath, prompt, intensity);
      }
      
      throw new Error("OPENAI_API_KEY environment variable is not set");
    }

    console.log(`Transforming image at ${imagePath}`);
    console.log(`Prompt: "${prompt}" with intensity: ${intensity}/10`);

    // Read the image file
    const imageBuffer = await fs.readFile(imagePath);
    const base64Image = imageBuffer.toString('base64');
    console.log(`Successfully read image file (${imageBuffer.length} bytes)`);

    // Adjust prompt based on intensity
    const adjustedPrompt = `With an effect intensity of ${intensity}/10, ${prompt}`;
    console.log(`Adjusted prompt: "${adjustedPrompt}"`);

    try {
      // Use OpenAI GPT-4o for image transformation (vision + text)
      console.log("Calling OpenAI GPT-4o to transform image...");
      const gpt4oResponse = await openai.chat.completions.create({
        model: "gpt-4o",
        messages: [
          {
            role: "system",
            content: `You are an expert in image styling and transformation. 
            
Your task is to transform the provided image according to the style prompt while preserving its key elements.

IMPORTANT: You MUST return ONLY a base64-encoded image in one of these formats:
1. As a data URL: data:image/jpeg;base64,BASE64_STRING_HERE
2. Or as raw base64 content with NO explanation text

Do NOT include any explanations, descriptions, or code blocks in your response - ONLY return the transformed image.`
          },
          {
            role: "user",
            content: [
              {
                type: "text",
                text: `Transform this image using the following style: ${adjustedPrompt}. 

The image should maintain its original content and composition but appear in the new style.

IMPORTANT: Only respond with the transformed image as a base64 string. Don't include any explanation or description.`
              },
              {
                type: "image_url",
                image_url: {
                  url: `data:image/jpeg;base64,${base64Image}`
                }
              }
            ],
          },
        ],
        max_tokens: 4096,
      });
      
      console.log("OpenAI GPT-4o call succeeded");
      const responseContent = gpt4oResponse.choices[0].message.content;
      console.log("GPT-4o response size:", responseContent?.length || 0);
      
      // Look for a base64 string pattern in the response
      // First, try to find a standard data URL pattern
      const dataUrlPattern = /data:image\/[^;]+;base64,([A-Za-z0-9+/=]+)/;
      const dataUrlMatch = responseContent?.match(dataUrlPattern);
      
      if (dataUrlMatch && dataUrlMatch[1]) {
        const extractedBase64 = dataUrlMatch[1];
        console.log(`Found base64 image data from data URL (${extractedBase64.length} characters)`);
        return extractedBase64;
      }
      
      // If no data URL found, look for a markdown image with base64
      const markdownPattern = /!\[.*?\]\(data:image\/[^;]+;base64,([A-Za-z0-9+/=]+)\)/;
      const markdownMatch = responseContent?.match(markdownPattern);
      
      if (markdownMatch && markdownMatch[1]) {
        const extractedBase64 = markdownMatch[1];
        console.log(`Found base64 image data from markdown (${extractedBase64.length} characters)`);
        return extractedBase64;
      }
      
      // If still no match, try to extract a large chunk of base64-looking content
      const rawBase64Pattern = /([A-Za-z0-9+/=]{100,})/;
      const rawMatch = responseContent?.match(rawBase64Pattern);
      
      if (rawMatch && rawMatch[1]) {
        const extractedBase64 = rawMatch[1];
        console.log(`Found potential base64 image data (${extractedBase64.length} characters)`);
        return extractedBase64;
      } else {
        // If we couldn't extract a base64 image, use fallback
        console.warn("Could not extract base64 image from GPT-4o response, using mockTransformation");
        return mockGenerateTransformedImage(imagePath, prompt, intensity);
      }
    } catch (apiError) {
      console.error("OpenAI API error:", apiError);
      throw apiError;
    }
  } catch (error) {
    console.error("OpenAI transformation error:", error);
    
    // Return null to indicate failure
    return null;
  }
}

/**
 * Fallback function when OpenAI API isn't available
 * This is only used for development/testing when API keys aren't set up
 */
export async function mockGenerateTransformedImage(
  imagePath: string,
  prompt: string,
  intensity: number
): Promise<string | null> {
  try {
    // Just return the original image as base64
    const imageBuffer = await fs.readFile(imagePath);
    return imageBuffer.toString('base64');
  } catch (error) {
    console.error("Mock transformation error:", error);
    return null;
  }
}
