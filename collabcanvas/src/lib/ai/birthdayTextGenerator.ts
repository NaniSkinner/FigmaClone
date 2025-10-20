/**
 * Birthday Text Generator - Client Module
 *
 * Handles birthday text generation via AI chat integration.
 * Creates editable text objects on canvas with smart defaults.
 *
 * Features:
 * - Fast generation (2-5 seconds)
 * - Clarification system for ambiguous requests
 * - Smart color/font defaults
 * - Cost tracking and toast notifications
 *
 * Reference: AIhbPRD.md Section 3.4 - Phase 1 Text Generation
 */

import {
  BirthdayTextRequest,
  BirthdayTextResponse,
  TextElementData,
} from "@/types/ai";
import { Text as TextObject } from "@/types/canvas";
import { useCanvasStore } from "@/store/canvasStore";

export interface GenerateBirthdayTextOptions {
  userMessage: string;
  userId: string;
  projectId?: string;
  onProgress?: (message: string) => void;
}

export interface GenerateBirthdayTextResult {
  success: boolean;
  action: "generate" | "clarify";
  clarifyQuestion?: string;
  textObjectIds?: string[];
  cost?: number;
  duration?: number;
  error?: string;
}

/**
 * Main function: Generate birthday text from user message
 *
 * Flow:
 * 1. Call API to analyze request with GPT-4
 * 2. If "clarify" → return question to user
 * 3. If "generate" → create text objects on canvas
 * 4. Show success toast with cost/time
 */
export async function generateBirthdayText(
  options: GenerateBirthdayTextOptions
): Promise<GenerateBirthdayTextResult> {
  const { userMessage, userId, projectId, onProgress } = options;

  try {
    // Validation
    if (!userMessage || userMessage.trim().length === 0) {
      return {
        success: false,
        action: "clarify",
        error: "Please provide a message for the birthday text",
      };
    }

    if (!userId) {
      return {
        success: false,
        action: "clarify",
        error: "User ID is required",
      };
    }

    // Step 1: Show progress
    onProgress?.("Analyzing your request...");

    // Step 2: Call API
    const requestBody: BirthdayTextRequest = {
      userMessage,
      canvasWidth: 8000,
      canvasHeight: 8000,
    };

    const response = await fetch("/api/ai/birthday-text", {
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
        action: "clarify",
        error: errorData.error || "Failed to generate birthday text",
      };
    }

    const data: BirthdayTextResponse = await response.json();

    // Step 3: Handle clarification
    if (data.action === "clarify") {
      return {
        success: true,
        action: "clarify",
        clarifyQuestion:
          data.clarifyQuestion ||
          "I need more information. What name should I use?",
        cost: data.cost,
        duration: data.duration,
      };
    }

    // Step 4: Handle generation
    if (data.action === "generate" && data.textElements) {
      onProgress?.("Creating text objects...");

      const textObjectIds = await createTextObjectsFromElements(
        data.textElements,
        userId,
        data.cost || 0
      );

      return {
        success: true,
        action: "generate",
        textObjectIds,
        cost: data.cost,
        duration: data.duration,
      };
    }

    // Unexpected response
    return {
      success: false,
      action: "clarify",
      error: "Unexpected API response",
    };
  } catch (error) {
    console.error("[Birthday Text Generator] Error:", error);
    return {
      success: false,
      action: "clarify",
      error:
        error instanceof Error
          ? error.message
          : "Failed to generate birthday text",
    };
  }
}

/**
 * Create text objects on canvas from element data
 */
async function createTextObjectsFromElements(
  elements: TextElementData[],
  userId: string,
  totalCost: number
): Promise<string[]> {
  const canvasStore = useCanvasStore.getState();
  const objectIds: string[] = [];

  // Get next z-index for layering
  let zIndex = canvasStore.getNextZIndex();

  for (const element of elements) {
    // Create unique ID
    const id = crypto.randomUUID();

    // Build text object
    const textObject: TextObject = {
      id,
      type: "text",
      x: element.x,
      y: element.y,
      text: element.content,
      fontSize: element.fontSize,
      fontFamily: element.fontFamily,
      fill: element.color,
      fontStyle: "normal",
      width: undefined, // Auto-width
      rotation: 0,
      userId,
      zIndex,
      createdAt: new Date(),
      updatedAt: new Date(),
      // Birthday metadata
      birthdayText: true,
      aiGenerated: true,
      aiCost: totalCost / elements.length, // Distribute cost across elements
    };

    // Add to canvas store
    canvasStore.addObject(textObject);
    objectIds.push(id);

    // Increment z-index for next object
    zIndex++;
  }

  return objectIds;
}

/**
 * Helper: Format cost for display
 */
export function formatCost(cost: number): string {
  return `$${cost.toFixed(4)}`;
}

/**
 * Helper: Format duration for display
 */
export function formatDuration(durationMs: number): string {
  const seconds = (durationMs / 1000).toFixed(1);
  return `${seconds}s`;
}
