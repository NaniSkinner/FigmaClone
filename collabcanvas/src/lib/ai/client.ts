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
    this.model = "gpt-4-turbo-preview";
    this.temperature = 0.7; // Creative flexibility
    this.maxTokens = 1000; // Response limit
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

      // Call OpenAI with function calling
      const response = await this.openai.chat.completions.create({
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
      });

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
    } catch (error) {
      console.error("DirectOpenAIClient error:", error);
      return {
        success: false,
        message: "Failed to process command",
        error: error instanceof Error ? error.message : "Unknown error",
      };
    }
  }

  /**
   * Build system prompt with canvas context
   */
  private buildSystemPrompt(context: CanvasContext): string {
    return `You are an AI assistant that helps manipulate a collaborative design canvas.

CURRENT CANVAS STATE:
${JSON.stringify(context, null, 2)}

CAPABILITIES:
- Create shapes (rectangles, circles, lines)
- Create text elements
- Move, resize, and rotate objects
- Delete objects
- Arrange objects in layouts
- Query canvas state

RULES:
1. Canvas boundaries: 0-2000px (width and height)
2. Maximum 5 objects per command
3. Use Matcha Green (#D4E7C5) and Lavender (#B4A7D6) as default colors
4. All measurements in pixels
5. Rotation in degrees (0-360)
6. Z-index range: 0-999

RESPONSE STYLE:
- Be concise and professional
- List each action taken with ✓ or ✗
- Ask for clarification when ambiguous
- Suggest alternatives when commands fail
- Never use technical jargon in error messages

When the user asks you to do something, use the available function tools to manipulate the canvas.`;
  }

  /**
   * Get AI tool definitions (placeholder - will be filled in Task 5)
   */
  private getTools(): AITool[] {
    // TODO: Implement full tool definitions in Task 5
    // For now, return empty array
    return [];
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
      // TODO: Implement in Task 19
      // This will make a fetch call to the API route with authentication

      const response = await fetch(this.endpoint, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          // TODO: Add Firebase auth token
          // Authorization: `Bearer ${userToken}`,
        },
        body: JSON.stringify({ command, context }),
      });

      if (!response.ok) {
        throw new Error(`API error: ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      console.error("APIRouteClient error:", error);
      return {
        success: false,
        message: "Failed to process command",
        error: error instanceof Error ? error.message : "Unknown error",
      };
    }
  }
}

// ============================================================================
// Environment-Based Export
// ============================================================================

/**
 * Export the appropriate client based on environment
 *
 * Development: DirectOpenAIClient (client-side)
 * Production: APIRouteClient (server-side)
 *
 * This allows us to seamlessly switch between implementations
 * without changing any consuming code.
 */
export const aiClient: AIClient =
  process.env.NODE_ENV === "production"
    ? new APIRouteClient()
    : new DirectOpenAIClient();

// Also export classes for testing
export { DirectOpenAIClient, APIRouteClient };
