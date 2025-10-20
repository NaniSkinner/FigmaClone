import { NextRequest, NextResponse } from "next/server";
import OpenAI from "openai";
import { BirthdayEnhanceRequest, BirthdayEnhanceResponse } from "@/types/ai";

// Initialize OpenAI client
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

/**
 * Build DALL-E prompt for birthday text enhancement
 */
function buildEnhancementPrompt(
  textContent: string,
  style: "3d_bubble" | "cartoon_inflated",
  colors: string[] = [],
  addDecorations: boolean = false
): string {
  const colorStr = colors.length > 0 ? colors.join(", ") : "pink, purple, blue";

  if (style === "3d_bubble") {
    let prompt = `3D bubble letters spelling "${textContent}" in a glossy, dimensional style with vibrant ${colorStr} gradient colors. 
    Each letter should have a shiny, reflective surface with soft shadows and depth. 
    Hand-painted aesthetic with smooth surfaces and rounded edges. 
    Professional quality, HD render. 
    Transparent or white background.`;

    if (addDecorations) {
      prompt += ` Add festive birthday decorations around the text: colorful balloons, confetti, streamers, and sparkles.`;
    }

    return prompt;
  }

  if (style === "cartoon_inflated") {
    let prompt = `Cartoon-style inflated balloon letters spelling "${textContent}" in a playful, hand-drawn aesthetic with bright ${colorStr} colors. 
    Each letter should look like a fun, puffy balloon with exaggerated proportions and cheerful character. 
    Whimsical, kid-friendly style with bold outlines and vibrant fills. 
    Fun party vibes. 
    Transparent or white background.`;

    if (addDecorations) {
      prompt += ` Add birthday party decorations: balloons, confetti, gift boxes, party hats, and celebration elements.`;
    }

    return prompt;
  }

  return `Artistic birthday text "${textContent}" with ${colorStr} colors`;
}

/**
 * Download image from URL and convert to base64 data URL
 */
async function imageUrlToDataUrl(imageUrl: string): Promise<string> {
  try {
    const response = await fetch(imageUrl);
    const arrayBuffer = await response.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);
    const base64 = buffer.toString("base64");
    return `data:image/png;base64,${base64}`;
  } catch (error) {
    console.error(
      "[Birthday Enhance] Error converting image to data URL:",
      error
    );
    throw new Error("Failed to download generated image");
  }
}

export async function POST(request: NextRequest) {
  const startTime = Date.now();
  let cost = 0;

  try {
    const body: BirthdayEnhanceRequest = await request.json();
    const {
      textContent,
      style = "3d_bubble",
      colors = [],
      addDecorations = false,
    } = body;

    // Validation
    if (!textContent || textContent.trim().length === 0) {
      return NextResponse.json(
        {
          success: false,
          error: "Text content is required",
        },
        { status: 400 }
      );
    }

    if (!["3d_bubble", "cartoon_inflated"].includes(style)) {
      return NextResponse.json(
        {
          success: false,
          error: "Invalid style. Must be '3d_bubble' or 'cartoon_inflated'",
        },
        { status: 400 }
      );
    }

    console.log("[Birthday Enhance] Starting enhancement:", {
      textContent,
      style,
      colors,
      addDecorations,
    });

    // Build DALL-E prompt
    const prompt = buildEnhancementPrompt(
      textContent,
      style,
      colors,
      addDecorations
    );
    console.log("[Birthday Enhance] DALL-E prompt:", prompt);

    // Call DALL-E 3
    const dalleResponse = await openai.images.generate({
      model: "dall-e-3",
      prompt,
      size: "1024x1024",
      quality: "hd",
      style: "natural",
      n: 1,
    });

    // DALL-E 3 HD 1024x1024 costs $0.080 per image
    cost = 0.08;

    const imageUrl = dalleResponse.data[0]?.url;
    if (!imageUrl) {
      throw new Error("No image URL in DALL-E response");
    }

    console.log("[Birthday Enhance] DALL-E image generated:", imageUrl);

    // Download image and convert to data URL
    const imageDataUrl = await imageUrlToDataUrl(imageUrl);
    const duration = Date.now() - startTime;

    console.log("[Birthday Enhance] Enhancement complete:", {
      duration: `${duration}ms`,
      cost: `$${cost.toFixed(3)}`,
      imageSize: `${(imageDataUrl.length / 1024).toFixed(2)} KB`,
    });

    return NextResponse.json({
      success: true,
      imageDataUrl,
      cost,
      duration,
    } as BirthdayEnhanceResponse);
  } catch (error: any) {
    console.error("[Birthday Enhance] Error:", error);

    // Check for rate limiting
    if (error.status === 429 || error.message?.includes("rate limit")) {
      return NextResponse.json(
        {
          success: false,
          error: "Rate limit exceeded. Please wait a moment and try again.",
        },
        { status: 429 }
      );
    }

    // Check for content policy violation
    if (error.message?.includes("content_policy")) {
      return NextResponse.json(
        {
          success: false,
          error:
            "The content violates OpenAI's usage policies. Please try different text or style.",
        },
        { status: 400 }
      );
    }

    return NextResponse.json(
      {
        success: false,
        error: error.message || "Failed to generate enhancement",
        cost: cost > 0 ? cost : undefined,
      },
      { status: 500 }
    );
  }
}
