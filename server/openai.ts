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
      // Call OpenAI vision API (GPT-4o) to understand the image content
      console.log("Calling OpenAI Vision API (GPT-4o) to analyze image...");
      const visionResponse = await openai.chat.completions.create({
        model: "gpt-4o",
        messages: [
          {
            role: "system",
            content: "You are an expert image analyst and artist. Analyze the image and provide a detailed description that can be used to generate a new version of it with the requested style."
          },
          {
            role: "user",
            content: [
              {
                type: "text",
                text: `I want to transform this image using this prompt: ${adjustedPrompt}. First, describe the image in detail to preserve its core elements.`
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
        max_tokens: 500,
      });
      
      console.log("OpenAI Vision API call succeeded");
      const imageDescription = visionResponse.choices[0].message.content;
      console.log("Image analysis:", imageDescription);
      
      // Now use DALL-E 3 to generate a new image based on the description and style
      console.log("Calling OpenAI DALL-E 3 to generate styled image...");
      const generationPrompt = `Based on this description: "${imageDescription}", create a new image with this style: ${adjustedPrompt}`;
      
      const response = await openai.images.generate({
        model: "dall-e-3",
        prompt: generationPrompt,
        n: 1,
        size: "1024x1024",
        quality: "standard",
        response_format: "b64_json"
      });
      
      console.log("OpenAI DALL-E 3 call succeeded");

      if (response.data && response.data.length > 0 && response.data[0].b64_json) {
        const b64Data = response.data[0].b64_json;
        console.log(`Received base64 image data (${b64Data.length} characters)`);
        return b64Data;
      } else {
        console.error("No image data in response:", response);
        throw new Error("No image data returned from OpenAI");
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
