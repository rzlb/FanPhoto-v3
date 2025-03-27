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
      throw new Error("OPENAI_API_KEY environment variable is not set");
    }

    // Read the image file
    const imageBuffer = await fs.readFile(imagePath);
    const base64Image = imageBuffer.toString('base64');

    // Adjust prompt based on intensity
    const adjustedPrompt = `With an effect intensity of ${intensity}/10, ${prompt}`;

    // Call OpenAI API for image variation
    const response = await openai.images.edit({
      image: new Blob([imageBuffer], { type: 'image/jpeg' }),
      prompt: adjustedPrompt,
      n: 1,
      size: "1024x1024",
      response_format: "b64_json"
    });

    if (response.data && response.data.length > 0 && response.data[0].b64_json) {
      return response.data[0].b64_json;
    } else {
      throw new Error("No image data returned from OpenAI");
    }
  } catch (error) {
    console.error("OpenAI transformation error:", error);
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
