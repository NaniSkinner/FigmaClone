/**
 * Ghibli Image Transformation Generator
 *
 * Client-side module for transforming images into Studio Ghibli style.
 * Handles API calls, Firebase upload, and canvas object creation.
 */

import { GhibliStyle, GhibliGenerationResponse } from "@/types/ai";
import { ImageObject } from "@/types/canvas";
import { useCanvasStore } from "@/store/canvasStore";
import { uploadAIGeneratedImage } from "@/lib/firebase/storage";

export interface GenerateGhibliOptions {
  imageId: string;
  style: GhibliStyle;
  keepOriginal: boolean;
  userId: string;
  projectId: string;
  onProgress?: (stage: string) => void;
}

export interface GenerateGhibliResult {
  success: boolean;
  newImageId?: string;
  cost?: number;
  duration?: number;
  error?: string;
}

/**
 * Main function: Generate Ghibli-style variant of an image
 */
export async function generateGhibliVariant(
  options: GenerateGhibliOptions
): Promise<GenerateGhibliResult> {
  const { imageId, style, keepOriginal, userId, projectId, onProgress } =
    options;

  try {
    // Get the canvas store
    const canvasStore = useCanvasStore.getState();

    // Find the source image
    const sourceImage = canvasStore.objects.get(imageId);
    if (!sourceImage || sourceImage.type !== "image") {
      return {
        success: false,
        error: "Source image not found or invalid",
      };
    }

    const sourceImageObj = sourceImage as ImageObject;

    // Stage 1: Analyze image with GPT-4 Vision
    onProgress?.("Analyzing image with AI...");

    // Stage 2: Generate Ghibli artwork with DALL-E 3
    onProgress?.("Creating Ghibli artwork...");

    // Call the API
    const response = await fetch("/api/ai/ghibli", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        imageUrl: sourceImageObj.src,
        style,
        userId,
        projectId,
        provider: "replicate", // Use Replicate for better identity preservation (fallback to OpenAI if fails)
      }),
    });

    const data: GhibliGenerationResponse = await response.json();

    if (!data.success || !data.imageDataUrl) {
      return {
        success: false,
        error: data.error || "Generation failed",
      };
    }

    // Stage 3: Upload to Firebase Storage
    onProgress?.("Uploading to storage...");

    const { url: firebaseUrl, thumbnailBase64 } = await uploadAIGeneratedImage(
      data.imageDataUrl,
      userId,
      projectId,
      {
        aiStyle: style,
      }
    );

    // Stage 4: Create or update canvas object
    onProgress?.("Adding to canvas...");

    if (keepOriginal) {
      // Create new image object next to original
      const newId = crypto.randomUUID();
      const newImage: ImageObject = {
        id: newId,
        type: "image",
        userId,
        createdAt: new Date(),
        updatedAt: new Date(),
        zIndex: canvasStore.getNextZIndex(),

        // Position with offset
        x: sourceImageObj.x + 50,
        y: sourceImageObj.y + 50,
        width: 1024,
        height: 1024,

        // Image data
        src: firebaseUrl,
        thumbnailSrc: thumbnailBase64,
        naturalWidth: 1024,
        naturalHeight: 1024,
        mimeType: "image/png",

        // AI metadata
        aiGenerated: true,
        aiSourceImageId: imageId,
        aiStyle: style,
        aiGeneratedAt: new Date(),
        aiCost: data.cost,
        aiDescription: data.description,
      };

      canvasStore.addObject(newImage);

      return {
        success: true,
        newImageId: newId,
        cost: data.cost,
        duration: data.duration,
      };
    } else {
      // Replace original image
      canvasStore.updateObject(imageId, {
        src: firebaseUrl,
        thumbnailSrc: thumbnailBase64,
        width: 1024,
        height: 1024,
        naturalWidth: 1024,
        naturalHeight: 1024,
        aiGenerated: true,
        aiStyle: style,
        aiGeneratedAt: new Date(),
        aiCost: data.cost,
        aiDescription: data.description,
      } as Partial<ImageObject>);

      return {
        success: true,
        newImageId: imageId,
        cost: data.cost,
        duration: data.duration,
      };
    }
  } catch (error) {
    console.error("Ghibli generation error:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error occurred",
    };
  }
}

/**
 * Helper to get friendly style names
 */
export function getStyleDisplayName(style: GhibliStyle): string {
  const names: Record<GhibliStyle, string> = {
    anime: "Japanese Anime",
    ghibli: "Classic Ghibli",
    spirited_away: "Spirited Away",
    totoro: "My Neighbor Totoro",
  };
  return names[style];
}

/**
 * Helper to get style descriptions
 */
export function getStyleDescription(style: GhibliStyle): string {
  const descriptions: Record<GhibliStyle, string> = {
    anime:
      "Simple Japanese anime style with expressive eyes and hand-drawn look",
    ghibli:
      "Soft watercolor aesthetics with dreamy lighting and whimsical details",
    spirited_away:
      "Rich saturated colors with mystical backgrounds and ethereal lighting",
    totoro: "Soft muted pastels with lush nature and peaceful countryside mood",
  };
  return descriptions[style];
}
