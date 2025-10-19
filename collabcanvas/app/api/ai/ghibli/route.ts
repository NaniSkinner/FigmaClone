/**
 * AI Ghibli Transformation API Route
 *
 * Transforms images into Studio Ghibli anime style using:
 * - GPT-4 Vision: Analyzes source image for accurate recreation
 * - DALL-E 3 HD: Generates Ghibli-style artwork
 *
 * Reference: ImageAiPRD Section 3.3 - API Route Implementation
 */

import { NextRequest, NextResponse } from "next/server";
import OpenAI from "openai";

// Initialize OpenAI with server-side key
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

// Style-specific prompts for DALL-E 3
const STYLE_PROMPTS = {
  ghibli: `Studio Ghibli animation style with hand-painted watercolor aesthetics, 
           soft dreamy lighting, gentle pastel and earth tones, whimsical details, 
           subtle gradients, and peaceful atmosphere`,

  spirited_away: `Spirited Away anime style with rich saturated colors, 
                   detailed mystical backgrounds, vibrant reds and golds, 
                   ethereal lighting, intricate architectural details, 
                   and magical realism`,

  totoro: `My Neighbor Totoro style with soft muted pastels, 
           lush green nature elements, gentle sunlight filtering through trees, 
           peaceful countryside mood, simple but expressive character designs`,

  howls: `Howl's Moving Castle style with Victorian-era aesthetics, 
          steampunk mechanical elements, warm golden lighting, 
          detailed period costumes, magical transformations, 
          and romantic atmosphere`,
};

// GPT-4 Vision analysis prompt
const ANALYSIS_PROMPT = `Analyze this image in extreme detail for accurate recreation. Describe:
- Main subjects and their exact positions/poses
- Facial expressions and emotions (if people/characters present)
- Lighting direction and quality
- Color palette and tones
- Composition and perspective
- Background elements and depth
- Textures and materials
- Overall mood and atmosphere

Be extremely specific - this description will be used to recreate the image in a different artistic style.`;

/**
 * POST /api/ai/ghibli
 *
 * Request body:
 * - imageUrl: string (Firebase Storage URL)
 * - style: 'ghibli' | 'spirited_away' | 'totoro' | 'howls'
 *
 * Response:
 * - success: boolean
 * - generatedImageUrl?: string (DALL-E 3 URL)
 * - description?: string (GPT-4 Vision analysis)
 * - style: string
 * - cost: number (USD)
 * - duration: number (milliseconds)
 * - error?: string
 */
export async function POST(request: NextRequest) {
  const startTime = Date.now();
  let analysisCost = 0;
  let generationCost = 0;

  try {
    // Parse request body
    const body = await request.json();
    const { imageUrl, style = "ghibli" } = body;

    // Validate inputs
    if (!imageUrl || typeof imageUrl !== "string") {
      return NextResponse.json(
        {
          success: false,
          error: "Image URL is required",
          style,
          cost: 0,
          duration: Date.now() - startTime,
        },
        { status: 400 }
      );
    }

    if (!["ghibli", "spirited_away", "totoro", "howls"].includes(style)) {
      return NextResponse.json(
        {
          success: false,
          error:
            "Invalid style. Must be one of: ghibli, spirited_away, totoro, howls",
          style,
          cost: 0,
          duration: Date.now() - startTime,
        },
        { status: 400 }
      );
    }

    console.log(
      `[Ghibli API] Starting generation: style=${style}, imageUrl=${imageUrl.substring(
        0,
        50
      )}...`
    );

    // ========================================================================
    // Step 1: GPT-4 Vision Analysis (5-10 seconds)
    // ========================================================================
    console.log("[Ghibli API] Step 1: Analyzing image with GPT-4 Vision...");

    const analysisResponse = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [
        {
          role: "user",
          content: [
            {
              type: "text",
              text: ANALYSIS_PROMPT,
            },
            {
              type: "image_url",
              image_url: {
                url: imageUrl,
                detail: "high",
              },
            },
          ],
        },
      ],
      max_tokens: 500,
    });

    const description = analysisResponse.choices[0].message.content || "";

    // Calculate GPT-4 Vision cost
    // GPT-4 Vision pricing: ~$0.01/1K tokens (input) + ~$0.03/1K tokens (output)
    const tokensUsed = analysisResponse.usage?.total_tokens || 500;
    analysisCost = (tokensUsed / 1000) * 0.015; // Average rate

    console.log(
      `[Ghibli API] Step 1 complete. Tokens: ${tokensUsed}, Description length: ${description.length}`
    );

    // ========================================================================
    // Step 2: DALL-E 3 Generation (15-20 seconds)
    // ========================================================================
    console.log(
      "[Ghibli API] Step 2: Generating Ghibli artwork with DALL-E 3..."
    );

    // Construct final prompt
    const stylePrompt = STYLE_PROMPTS[style as keyof typeof STYLE_PROMPTS];
    const finalPrompt = `${stylePrompt}.

Recreate this scene maintaining exact composition, subjects, and layout:

${description}

Render in authentic Studio Ghibli hand-drawn animation style. Use traditional 2D animation techniques with painted backgrounds. IMPORTANT: Maintain the original scene's composition, subject positions, and overall layout exactly - only change the artistic style.`;

    console.log(
      `[Ghibli API] DALL-E prompt length: ${finalPrompt.length} characters`
    );

    const imageResponse = await openai.images.generate({
      model: "dall-e-3",
      prompt: finalPrompt,
      size: "1024x1024",
      quality: "hd",
      style: "natural", // More Ghibli-like than 'vivid'
      n: 1,
    });

    const generatedImageUrl = imageResponse.data?.[0]?.url;

    if (!generatedImageUrl) {
      throw new Error("DALL-E 3 did not return an image URL");
    }

    // DALL-E 3 HD cost: $0.04 per 1024x1024 image
    generationCost = 0.04;

    console.log(
      `[Ghibli API] Step 2 complete. Image URL: ${generatedImageUrl.substring(
        0,
        50
      )}...`
    );

    // ========================================================================
    // Step 3: Return response
    // ========================================================================
    const totalCost = analysisCost + generationCost;
    const duration = Date.now() - startTime;

    console.log(
      `[Ghibli API] SUCCESS - Cost: $${totalCost.toFixed(
        4
      )}, Duration: ${duration}ms`
    );

    return NextResponse.json({
      success: true,
      generatedImageUrl,
      description,
      style,
      cost: totalCost,
      duration,
    });
  } catch (error: any) {
    const duration = Date.now() - startTime;
    console.error("[Ghibli API] ERROR:", error);

    // Handle specific OpenAI errors
    if (error instanceof OpenAI.APIError) {
      const status = error.status || 500;
      let userMessage = "AI generation failed";

      if (status === 400) {
        userMessage = "Invalid request - check image URL";
      } else if (status === 429) {
        userMessage = "Rate limit exceeded - please try again in a moment";
      } else if (error.code === "content_policy_violation") {
        userMessage = "Image cannot be processed (content policy violation)";
      } else if (status >= 500) {
        userMessage = "OpenAI service error - please try again";
      }

      return NextResponse.json(
        {
          success: false,
          error: userMessage,
          style: "ghibli",
          cost: analysisCost + generationCost,
          duration,
        },
        { status }
      );
    }

    // Generic error handling
    return NextResponse.json(
      {
        success: false,
        error: error.message || "AI generation failed. Please try again.",
        style: "ghibli",
        cost: analysisCost + generationCost,
        duration,
      },
      { status: 500 }
    );
  }
}
