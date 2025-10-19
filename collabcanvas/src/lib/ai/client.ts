/**
 * AI Client Abstraction Layer
 *
 * This abstraction allows seamless switching between:
 * - DirectOpenAIClient: Client-side development (Phase 1-7)
 * - APIRouteClient: Production server-side API (Phase 8+)
 *
 * Strategy: Use client-side for rapid prototyping,
 * then migrate to server-side before external testing/production.
 *
 * Reference: aiTesting.md - Implementation Approach
 */

import OpenAI from "openai";
import { AIResponse, CanvasContext, AITool } from "@/types/ai";
import { allTools } from "./tools";

// ============================================================================
// Interface Definition
// ============================================================================

export interface AIClient {
  /**
   * Process a natural language command to manipulate the canvas
   * @param command - User's natural language input
   * @param context - Current canvas state context
   * @returns AI response with actions to execute
   */
  processCommand(command: string, context: CanvasContext): Promise<AIResponse>;
}

// ============================================================================
// Development Implementation (Client-Side)
// ============================================================================

/**
 * DirectOpenAIClient
 *
 * Uses OpenAI SDK directly from the browser.
 * ⚠️ WARNING: Only for development! API key exposed in browser.
 *
 * Benefits:
 * - Faster iteration
 * - Direct debugging
 * - No server setup needed
 *
 * TODO: Migrate to APIRouteClient before production (Task 19)
 */
class DirectOpenAIClient implements AIClient {
  private openai: OpenAI;
  private model: string;
  private temperature: number;
  private maxTokens: number;

  constructor() {
    const apiKey = process.env.NEXT_PUBLIC_OPENAI_API_KEY;

    if (!apiKey) {
      throw new Error(
        "NEXT_PUBLIC_OPENAI_API_KEY is not set. Please add it to .env.local"
      );
    }

    this.openai = new OpenAI({
      apiKey,
      dangerouslyAllowBrowser: true, // Required for client-side usage
    });

    // Configuration from PRD Section 4.4.1
    this.model = "gpt-4o"; // Using GPT-4o for better function calling and faster responses
    this.temperature = 0.7; // Creative flexibility
    this.maxTokens = 4000; // Response limit - increased for batch operations
  }

  /**
   * Execute operation with retry logic, timeout handling, and rate limit support
   */
  private async executeWithRetry<T>(
    operation: () => Promise<T>,
    maxRetries: number = 3
  ): Promise<T> {
    let lastError: Error | null = null;

    for (let attempt = 0; attempt < maxRetries; attempt++) {
      try {
        return await Promise.race([
          operation(),
          new Promise<never>((_, reject) =>
            setTimeout(
              () => reject(new Error("Request timeout after 60 seconds")),
              60000 // Increased to 60 seconds for batch operations
            )
          ),
        ]);
      } catch (error: any) {
        lastError = error;

        // Check for rate limit (429)
        if (error?.status === 429) {
          const retryAfter = error?.headers?.["retry-after"] || 5;
          console.warn(`[AI] Rate limited. Retrying after ${retryAfter}s...`);
          await new Promise((resolve) =>
            setTimeout(resolve, retryAfter * 1000)
          );
          continue;
        }

        // Check for server errors (5xx) - retry with exponential backoff
        if (error?.status >= 500 && error?.status < 600) {
          const delay = Math.min(1000 * Math.pow(2, attempt), 8000);
          console.warn(
            `[AI] Server error (${
              error.status
            }). Retrying in ${delay}ms... (attempt ${
              attempt + 1
            }/${maxRetries})`
          );
          await new Promise((resolve) => setTimeout(resolve, delay));
          continue;
        }

        // For client errors (4xx) or other errors, retry with linear backoff
        if (attempt < maxRetries - 1) {
          console.warn(
            `[AI] Error: ${error.message}. Retrying... (attempt ${
              attempt + 1
            }/${maxRetries})`
          );
          await new Promise((resolve) => setTimeout(resolve, 1000));
        } else {
          break;
        }
      }
    }

    throw new Error(
      `AI command failed after ${maxRetries} attempts: ${
        lastError?.message || "Unknown error"
      }`
    );
  }

  async processCommand(
    command: string,
    context: CanvasContext
  ): Promise<AIResponse> {
    try {
      const startTime = Date.now();

      // Build system prompt with canvas context
      const systemPrompt = this.buildSystemPrompt(context);

      // Get available tools/functions
      const tools = this.getTools();

      // Call OpenAI with function calling (with retry logic)
      const response = await this.executeWithRetry(() =>
        this.openai.chat.completions.create({
          model: this.model,
          temperature: this.temperature,
          max_tokens: this.maxTokens,
          messages: [
            {
              role: "system",
              content: systemPrompt,
            },
            {
              role: "user",
              content: command,
            },
          ],
          tools,
          tool_choice: "auto", // Let GPT decide when to use tools
        })
      );

      const executionTime = Date.now() - startTime;

      // Parse response
      const message = response.choices[0]?.message;

      if (!message) {
        return {
          success: false,
          message: "No response from AI",
          error: "Empty response from OpenAI",
        };
      }

      // Extract function calls if any
      const functionCalls = message.tool_calls
        ?.filter((call) => call.type === "function")
        .map((call) => ({
          id: call.id,
          type: call.type as "function",
          function: {
            name: call.function.name,
            arguments: call.function.arguments,
          },
        }));

      return {
        success: true,
        message: message.content || "Processing your request...",
        functionCalls,
      };
    } catch (error: any) {
      console.error("DirectOpenAIClient error:", error);

      // Detect error type for better user feedback
      let errorType: "timeout" | "rate_limit" | "server_error" | "generic" =
        "generic";
      let userMessage = "Failed to process command";

      if (error.message?.includes("timeout")) {
        errorType = "timeout";
        userMessage =
          "Request timed out. Please try again or check your connection.";
      } else if (
        error.status === 429 ||
        error.message?.includes("rate limit")
      ) {
        errorType = "rate_limit";
        userMessage =
          "Rate limit reached. Please wait a moment before trying again.";
      } else if (error.status >= 500) {
        errorType = "server_error";
        userMessage =
          "AI service is temporarily unavailable. Please try again.";
      }

      return {
        success: false,
        message: userMessage,
        error: error instanceof Error ? error.message : "Unknown error",
        errorType,
      };
    }
  }

  /**
   * Build system prompt with canvas context
   */
  private buildSystemPrompt(context: CanvasContext): string {
    return `You are Matchi, an AI assistant that helps manipulate a collaborative design canvas.

CURRENT CANVAS STATE:
${JSON.stringify(context, null, 2)}

CAPABILITIES:
- Create shapes (rectangles, circles) with ANY color
- Create text elements with ANY color
- Move objects to new positions (by description like "blue rectangle" or by ID)
- Resize and rotate objects
- Delete objects
- Arrange objects in layouts (horizontal, vertical, grid)
- Create complex UI components (login forms, navigation bars, cards, dashboards)
- Query canvas state

RULES:
1. Canvas boundaries: 8000x8000 pixels (coordinates from 0-8000 on both axes)
2. Center of canvas is at (4000, 4000)
3. **IMPORTANT: You can create up to 500 objects in a SINGLE command** - This is NOT limited to 20! You can handle large batch operations.
4. All measurements in pixels
5. Rotation in degrees (0-360)
6. Z-index range: 0-999

COLOR HANDLING:
- Default colors: Matcha Green (#D4E7C5) for fills, Lavender (#B4A7D6) for strokes
- Accept ANY color name or hex code that user specifies
- Color name to hex conversions: red=#FF0000, blue=#0000FF, black=#000000, white=#FFFFFF, green=#00FF00, yellow=#FFFF00, orange=#FFA500, purple=#800080, pink=#FFC0CB, brown=#8B4513, gray=#808080
- Never ask for color confirmation - use the user's requested color directly

POSITIONING:
- When position is NOT specified by user, use center (4000, 4000)
- Examples: "Add text Hello World" → place at (4000, 4000)
- When user says "top left", use approximately (500, 500)
- When user says "bottom right", use approximately (7500, 7500)

COMPLEX LAYOUTS:
- For UI components (login form, navigation bar, card, button group, dashboard), ALWAYS use the createComplexLayout function
- Examples: "create a login form" → use createComplexLayout with layoutType="loginForm"
- Examples: "make a nav bar" → use createComplexLayout with layoutType="navigationBar"

BATCH OPERATIONS:
- When users request many objects (e.g., "create 100 circles", "generate 500 rectangles"), you CAN do this
- **IMPORTANT: Use createBatchShapes for requests of 10+ objects** - it's much more efficient than multiple createShape calls
- Example: "create 100 red circles" → call createBatchShapes with an array of 100 circle specifications
- Do NOT refuse or limit requests to 20 objects - the system supports up to 500 objects per command

RESPONSE STYLE:
- Be concise and professional
- List each action taken with ✓ or ✗
- Ask for clarification ONLY when truly ambiguous (not for colors or missing positions)
- Suggest alternatives when commands fail
- Never use technical jargon in error messages

When the user asks you to do something, use the available function tools to manipulate the canvas.`;
  }

  /**
   * Get AI tool definitions
   * Returns all available tools for the AI to use
   */
  private getTools(): AITool[] {
    return allTools;
  }
}

// ============================================================================
// Production Implementation (Server-Side)
// ============================================================================

/**
 * APIRouteClient
 *
 * Calls Next.js API route that handles OpenAI on the server.
 * ✅ SECURE: API key never exposed to browser
 *
 * Benefits:
 * - API key security
 * - Rate limiting
 * - Usage tracking
 * - Request logging
 *
 * TODO: Implement in Task 19
 */
class APIRouteClient implements AIClient {
  private endpoint: string;

  constructor() {
    this.endpoint = "/api/ai";
  }

  async processCommand(
    command: string,
    context: CanvasContext
  ): Promise<AIResponse> {
    try {
      // Get user ID for authentication (set by auth system)
      const userId = (globalThis as any).__userId || "anonymous";

      const response = await fetch(this.endpoint, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-user-id": userId, // Simple authentication header
          // Note: In production, use Firebase ID token instead:
          // "Authorization": `Bearer ${await user.getIdToken()}`,
        },
        body: JSON.stringify({ command, context }),
      });

      const data = await response.json();

      if (!response.ok) {
        return {
          success: false,
          message: data.message || "Failed to process command",
          error: data.error || `HTTP ${response.status}`,
        };
      }

      return data;
    } catch (error) {
      console.error("APIRouteClient error:", error);
      return {
        success: false,
        message: "Failed to connect to AI service",
        error: error instanceof Error ? error.message : "Unknown error",
      };
    }
  }
}

// ============================================================================
// Environment-Based Export
// ============================================================================

/**
 * Export the appropriate client based on configuration
 *
 * Mode Selection:
 * - "api": APIRouteClient (secure server-side, RECOMMENDED)
 * - "direct": DirectOpenAIClient (browser-side, DEVELOPMENT ONLY)
 *
 * Set NEXT_PUBLIC_AI_CLIENT_MODE in .env.local to control this.
 * Defaults to "api" for security.
 */
const clientMode = process.env.NEXT_PUBLIC_AI_CLIENT_MODE || "api";

export const aiClient: AIClient =
  clientMode === "direct" ? new DirectOpenAIClient() : new APIRouteClient();

// Log which client is being used (helps with debugging)
if (typeof window !== "undefined") {
  console.log(
    `🤖 AI Client Mode: ${
      clientMode === "direct"
        ? "Direct (INSECURE - Dev Only)"
        : "API Route (SECURE)"
    }`
  );
}

// Also export classes for testing
export { DirectOpenAIClient, APIRouteClient };
