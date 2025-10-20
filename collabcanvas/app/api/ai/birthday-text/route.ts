/**
 * AI Birthday Text Generation API Route
 *
 * Analyzes user requests and generates structured birthday text data
 * using GPT-4 for fast, editable text object creation.
 *
 * Features:
 * - Smart clarification (asks questions if unclear)
 * - Smart defaults (Fredoka One, pink/purple, vertical)
 * - Cost tracking (~$0.01-0.02 per generation)
 * - Fast response (<5s target)
 *
 * Reference: AIhbPRD.md Section 3.4 - Phase 1 Text Generation
 */

import { NextRequest, NextResponse } from "next/server";
import OpenAI from "openai";
import { BirthdayTextRequest, BirthdayTextResponse } from "@/types/ai";

// Initialize OpenAI with server-side key
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

// AI Configuration
// Note: Using gpt-4 for now, may upgrade to gpt-4-turbo-preview for faster responses
const AI_CONFIG = {
  model: "gpt-4" as const,
  temperature: 0.7,
  maxTokens: 1000,
};

// Canvas dimensions for birthday text (scaled for 8000x8000 canvas)
const CANVAS_DIMENSIONS = {
  width: 8000,
  height: 8000,
};

// Font defaults for birthday text
const DEFAULT_FONT = "Fredoka One";
const DEFAULT_COLORS = {
  pink: "#FF69B4",
  purple: "#DA70D6",
  lavender: "#9370DB",
};

// Font mapping for style preferences
const FONT_STYLE_MAP: Record<string, string> = {
  bubbly: "Fredoka One",
  bubble: "Fredoka One",
  rounded: "Baloo 2",
  playful: "Baloo 2",
  elegant: "Pacifico",
  bold: "Lilita One",
  fun: "Carter One",
  modern: "Righteous",
  layered: "Bungee",
  thick: "Kavoon",
  default: "Fredoka One",
};

/**
 * Build GPT-4 system prompt for birthday text analysis
 */
function buildBirthdayTextPrompt(userMessage: string): string {
  return `You are a birthday invite designer. Analyze this user request and create birthday text elements.

USER REQUEST: "${userMessage}"

TASK: Extract the following information:
1. Name(s) to include in the birthday text
2. Additional text elements (date, time, location, age, etc.)
3. Style preference (bubbly, elegant, bold, playful, modern)
4. Color preference (if specified)
5. Layout preference (vertical, horizontal, arc)

CONFIDENCE CHECK:
- If the request is CLEAR and includes a name OR is casual (like "test", "demo"), set action: "generate"
- If the request is AMBIGUOUS and MISSING critical info (no name, unclear intent), set action: "clarify"
- When clarifying, ask ONE simple, friendly question with suggestions

SMART DEFAULTS (use when not specified):
- Font: "${DEFAULT_FONT}" (bubbly party font)
- Colors: Pink (#FF69B4) → Purple (#DA70D6) gradient
- Layout: Vertical stack (mobile-friendly)
- Size: 256-320px (scaled for 8000x8000 canvas)
- Position: Centered on canvas (x: 4000, y starts at 3000)

POSITIONING GUIDE (for 8000x8000 canvas):
- Center X: 4000
- Vertical spacing: 400-500px between elements
- Start Y: 3000 for first element
- Each subsequent element: Y += 500

RETURN JSON FORMAT:
{
  "action": "generate" | "clarify",
  "clarifyQuestion": "What name should I put on the banner?" (if action is "clarify"),
  "textElements": [
    {
      "content": "HAPPY",
      "fontFamily": "Fredoka One",
      "fontSize": 320,
      "color": "#FF69B4",
      "x": 4000,
      "y": 3000,
      "align": "center"
    },
    {
      "content": "BIRTHDAY",
      "fontFamily": "Fredoka One",
      "fontSize": 320,
      "color": "#DA70D6",
      "y": 3500
    }
  ],
  "canvasDimensions": { "width": 8000, "height": 8000 }
}

IMPORTANT RULES:
- ONLY return valid JSON, no other text
- Use "align": "center" for all centered text
- Apply colors in a gradient (lighter to darker)
- For multi-word names, keep them together or split into separate elements
- Dates/times should be smaller (200-220px)
- Location text should be smallest (180-200px)
`;
}

/**
 * POST /api/ai/birthday-text
 *
 * Process birthday text generation requests
 */
export async function POST(request: NextRequest) {
  const startTime = Date.now();

  try {
    // Step 1: Parse request body
    const body: BirthdayTextRequest = await request.json();
    const { userMessage } = body;

    if (!userMessage || typeof userMessage !== "string") {
      return NextResponse.json<BirthdayTextResponse>(
        {
          success: false,
          action: "clarify",
          error: "Invalid request: userMessage is required",
        },
        { status: 400 }
      );
    }

    // Step 2: Validate message length
    if (userMessage.length > 500) {
      return NextResponse.json<BirthdayTextResponse>(
        {
          success: false,
          action: "clarify",
          error: "Message too long. Please keep requests under 500 characters.",
        },
        { status: 400 }
      );
    }

    console.log(`[Birthday Text API] Processing request: "${userMessage}"`);

    // Step 3: Call GPT-4 with JSON mode
    const completion = await openai.chat.completions.create({
      model: AI_CONFIG.model,
      temperature: AI_CONFIG.temperature,
      max_tokens: AI_CONFIG.maxTokens,
      response_format: { type: "json_object" },
      messages: [
        {
          role: "system",
          content: buildBirthdayTextPrompt(userMessage),
        },
        {
          role: "user",
          content: userMessage,
        },
      ],
    });

    const message = completion.choices[0]?.message;

    if (!message || !message.content) {
      return NextResponse.json<BirthdayTextResponse>(
        {
          success: false,
          action: "clarify",
          error: "No response from AI",
        },
        { status: 500 }
      );
    }

    // Step 4: Parse GPT-4 response
    let parsedResponse: any;
    try {
      parsedResponse = JSON.parse(message.content);
    } catch (parseError) {
      console.error("[Birthday Text API] JSON parse error:", parseError);
      return NextResponse.json<BirthdayTextResponse>(
        {
          success: false,
          action: "clarify",
          error: "Failed to parse AI response",
        },
        { status: 500 }
      );
    }

    // Step 5: Calculate cost and duration
    const duration = Date.now() - startTime;
    const tokensUsed =
      (completion.usage?.prompt_tokens || 0) +
      (completion.usage?.completion_tokens || 0);
    const cost = (tokensUsed / 1000) * 0.01; // $0.01 per 1K tokens (GPT-4 estimate)

    console.log(
      `[Birthday Text API] Response: ${
        parsedResponse.action
      }, Duration: ${duration}ms, Cost: $${cost.toFixed(4)}`
    );

    // Step 6: Return formatted response
    const response: BirthdayTextResponse = {
      success: true,
      action: parsedResponse.action,
      clarifyQuestion: parsedResponse.clarifyQuestion,
      textElements: parsedResponse.textElements,
      canvasDimensions: parsedResponse.canvasDimensions || CANVAS_DIMENSIONS,
      cost,
      duration,
    };

    return NextResponse.json(response);
  } catch (error) {
    console.error("[Birthday Text API] Error:", error);

    const duration = Date.now() - startTime;

    // Handle specific OpenAI errors
    if (error instanceof Error) {
      if (error.message.includes("rate_limit")) {
        return NextResponse.json<BirthdayTextResponse>(
          {
            success: false,
            action: "clarify",
            error: "Rate limit reached. Please try again in a moment.",
            duration,
          },
          { status: 429 }
        );
      }

      if (error.message.includes("timeout")) {
        return NextResponse.json<BirthdayTextResponse>(
          {
            success: false,
            action: "clarify",
            error: "Request timed out. Please try again.",
            duration,
          },
          { status: 504 }
        );
      }
    }

    // Generic error response
    return NextResponse.json<BirthdayTextResponse>(
      {
        success: false,
        action: "clarify",
        error: "Failed to generate birthday text. Please try again.",
        duration,
      },
      { status: 500 }
    );
  }
}
