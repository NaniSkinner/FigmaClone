"use client";

import { BirthdayEnhanceRequest, BirthdayEnhanceResponse } from "@/types/ai";
import { uploadAIGeneratedImage } from "@/lib/firebase/storage";
import { ImageObject } from "@/types/canvas";
import { v4 as uuidv4 } from "uuid";

export interface EnhanceBirthdayTextOptions {
  textContent: string;
  style: "3d_bubble" | "cartoon_inflated";
  colors?: string[];
  addDecorations?: boolean;
  userId: string;
  projectId: string | null;
  onProgress?: (message: string) => void;
}

export interface EnhanceBirthdayTextResult {
  success: boolean;
  imageObject?: ImageObject;
  firebaseUrl?: string;
  cost?: number;
  duration?: number;
  error?: string;
}

/**
 * Enhance birthday text with DALL-E artistic effects
 *
 * Flow:
 * 1. Call API to generate image with DALL-E 3
 * 2. Upload image to Firebase Storage
 * 3. Create Image object on canvas
 * 4. Show success toast with cost/time
 */
export async function enhanceBirthdayText(
  options: EnhanceBirthdayTextOptions
): Promise<EnhanceBirthdayTextResult> {
  const {
    textContent,
    style,
    colors = [],
    addDecorations = false,
    userId,
    projectId,
    onProgress,
  } = options;

  try {
    // Step 1: Validate
    if (!textContent || textContent.trim().length === 0) {
      return {
        success: false,
        error: "Text content is required",
      };
    }

    if (!projectId) {
      return {
        success: false,
        error: "Project ID is required for image upload",
      };
    }

    // Step 2: Call API to generate image
    onProgress?.("🎨 Generating artistic enhancement with DALL-E 3...");
    console.log("[BirthdayEnhancer] Starting enhancement:", {
      textContent,
      style,
      colors,
      addDecorations,
    });

    const requestBody: BirthdayEnhanceRequest = {
      textContent,
      style,
      colors,
      addDecorations,
    };

    const response = await fetch("/api/ai/birthday-enhance", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(requestBody),
    });

    if (!response.ok) {
      const errorData = await response.json();
      return {
        success: false,
        error: errorData.error || "Failed to generate enhancement",
      };
    }

    const data: BirthdayEnhanceResponse = await response.json();

    if (!data.success || !data.imageDataUrl) {
      return {
        success: false,
        error: data.error || "No image generated",
      };
    }

    console.log("[BirthdayEnhancer] Image generated successfully");

    // Step 3: Upload to Firebase Storage
    onProgress?.("☁️ Uploading to cloud storage...");

    const firebaseUrl = await uploadAIGeneratedImage(
      data.imageDataUrl,
      projectId,
      userId
    );

    console.log("[BirthdayEnhancer] Image uploaded to Firebase:", firebaseUrl);

    // Step 4: Create Image object for canvas
    const imageObject: ImageObject = {
      id: uuidv4(),
      type: "image",
      x: 2000, // Position in center area (8000px canvas)
      y: 2000,
      width: 4000, // Scale from 1024x1024 to fit canvas better
      height: 4000,
      src: firebaseUrl,
      naturalWidth: 1024,
      naturalHeight: 1024,
      subType: "ai-generated",
      userId,
      zIndex: 1, // Behind text objects (which typically start at z-index 1000+)
      createdAt: new Date(),
      updatedAt: new Date(),
      // Enhancement metadata
      aiGenerated: true,
      birthdayEnhancement: true,
      enhancementStyle: style,
      sourceText: textContent,
      aiCost: data.cost,
      aiGeneratedAt: new Date(),
    };

    console.log("[BirthdayEnhancer] Enhancement complete:", {
      cost: data.cost,
      duration: data.duration,
      firebaseUrl,
    });

    return {
      success: true,
      imageObject,
      firebaseUrl,
      cost: data.cost,
      duration: data.duration,
    };
  } catch (error: any) {
    console.error("[BirthdayEnhancer] Error:", error);
    return {
      success: false,
      error: error.message || "An unexpected error occurred",
    };
  }
}

/**
 * Format cost for display
 */
export function formatCost(cost: number): string {
  return `$${cost.toFixed(3)}`;
}

/**
 * Format duration for display
 */
export function formatDuration(durationMs: number): string {
  if (durationMs < 1000) {
    return `${durationMs}ms`;
  }
  return `${(durationMs / 1000).toFixed(1)}s`;
}
