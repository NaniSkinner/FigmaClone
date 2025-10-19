/**
 * AI Ghibli Transformation API Route
 *
 * Transforms images into Studio Ghibli anime style using:
 * - GPT-4 Vision: Analyzes source image for accurate recreation
 * - DALL-E 3 HD: Generates Ghibli-style artwork
 *
 * Note: Returns DALL-E URL for client-side upload to Firebase Storage
 * Reference: ImageAiPRD Section 3.3 - API Route Implementation
 */

import { NextRequest, NextResponse } from "next/server";
import OpenAI from "openai";
import {
  generateAnimeWithReplicate,
  generateCartoonWithReplicate,
  generateAnimeWithVision,
  isReplicateConfigured,
} from "@/lib/ai/replicate";

// Initialize OpenAI with server-side key (fallback)
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

// Style-specific prompts for DALL-E 3
const STYLE_PROMPTS = {
  anime: `Turn this image into Japanese anime-like illustration with hand-drawn animation style, 
          expressive anime eyes, and painterly brush strokes`,

  ghibli: `Japanese anime style with hand-painted watercolor aesthetics, 
           painterly textures and soft brush strokes for a warm nostalgic feeling.
           Transform into anime character with: soft dreamy lighting, gentle pastel and earth tones, 
           whimsical details, subtle gradients, peaceful atmosphere, and expressive anime features`,

  spirited_away: `Mystical Japanese anime style with painterly textures and soft brush strokes for a warm nostalgic feeling.
                   Transform into anime character with: rich saturated colors, detailed mystical backgrounds, 
                   vibrant reds and golds, ethereal lighting, intricate architectural details, 
                   magical realism, and expressive anime features`,

  totoro: `Gentle Japanese anime style with painterly textures and soft brush strokes for a warm nostalgic feeling.
           Transform into anime character with: soft muted pastels, lush green nature elements, 
           gentle sunlight filtering through trees, peaceful countryside mood, 
           simple but expressive character designs with round gentle features`,
};

// GPT-4 Vision analysis prompt - IDENTITY PRESERVATION FOCUSED
const ANALYSIS_PROMPT = `Analyze this image in EXTREME detail for faithful recreation. For accurate preservation, describe:

PEOPLE/SUBJECTS (if present):
- Exact face shape, facial features, and proportions
- Hair style, color, length, and how it frames the face
- Clothing details, colors, patterns, and fit
- Exact body pose, posture, and positioning
- Age, gender presentation, and distinctive features
- Eye color, nose shape, mouth shape, expression

COMPOSITION & LAYOUT:
- Camera angle and perspective (eye-level, above, below)
- Subject placement and framing
- Foreground, midground, background layering
- Spatial relationships between elements

ENVIRONMENT:
- Background elements and their exact positions
- Setting and location details
- Objects, furniture, or scenery
- Depth and distance

TECHNICAL:
- Lighting direction, quality, and shadows
- Color palette and tones
- Mood and atmosphere

Be EXTREMELY specific about identity-defining features. This must preserve the subject's appearance while only changing to anime art style.`;

/**
 * POST /api/ai/ghibli
 *
 * Request body:
 * - imageUrl: string (Firebase Storage URL)
 * - style: 'ghibli' | 'spirited_away' | 'totoro' | 'howls'
 * - userId: string
 * - projectId: string
 *
 * Response:
 * - success: boolean
 * - firebaseUrl?: string (Firebase Storage URL of generated image)
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
    const {
      imageUrl,
      style = "anime",
      userId,
      projectId,
      provider = "replicate", // Default to Replicate for better identity preservation
    } = body;

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

    if (!userId || !projectId) {
      return NextResponse.json(
        {
          success: false,
          error: "User ID and Project ID are required",
          style,
          cost: 0,
          duration: Date.now() - startTime,
        },
        { status: 400 }
      );
    }

    if (!["anime", "ghibli", "spirited_away", "totoro"].includes(style)) {
      return NextResponse.json(
        {
          success: false,
          error:
            "Invalid style. Must be one of: anime, ghibli, spirited_away, totoro",
          style,
          cost: 0,
          duration: Date.now() - startTime,
        },
        { status: 400 }
      );
    }

    console.log(
      `[Ghibli API] Starting generation: provider=${provider}, style=${style}, imageUrl=${imageUrl.substring(
        0,
        50
      )}...`
    );

    // ========================================================================
    // REPLICATE PATH (Image-to-Image with Identity Preservation)
    // ========================================================================
    if (provider === "replicate" && isReplicateConfigured()) {
      console.log("[Ghibli API] Using Replicate for image-to-image generation");

      try {
        // Download source image and convert to base64
        console.log("[Ghibli API] Step 1: Downloading source image...");
        const sourceResponse = await fetch(imageUrl);
        if (!sourceResponse.ok) {
          throw new Error(
            `Failed to download source image: ${sourceResponse.statusText}`
          );
        }
        const sourceBuffer = await sourceResponse.arrayBuffer();

        console.log(
          `[Ghibli API] Original image size: ${(
            sourceBuffer.byteLength /
            1024 /
            1024
          ).toFixed(2)}MB`
        );

        // Resize image to 1024x1024 to avoid CUDA out of memory errors
        console.log("[Ghibli API] Step 1a: Resizing image to 1024x1024...");
        const sharp = (await import("sharp")).default;
        const resizedBuffer = await sharp(Buffer.from(sourceBuffer))
          .resize(1024, 1024, { fit: "cover" })
          .png()
          .toBuffer();

        const sourceBase64 = resizedBuffer.toString("base64");
        const sourceDataUrl = `data:image/png;base64,${sourceBase64}`;

        console.log(
          `[Ghibli API] Resized image size: ${(
            resizedBuffer.byteLength /
            1024 /
            1024
          ).toFixed(2)}MB`
        );

        // Generate with Ghibli Model (img2img)
        console.log(
          "[Ghibli API] Step 2: Generating with Ghibli Model (danila013/ghibli-easycontrol)..."
        );
        const result = await generateAnimeWithReplicate({
          sourceImageDataUrl: sourceDataUrl,
          style,
          identityStrength: 0.8,
          styleStrength: 0.65,
        });

        const totalCost = result.cost;
        const duration = Date.now() - startTime;

        console.log(
          `[Ghibli API] REPLICATE SUCCESS - Cost: $${totalCost.toFixed(
            4
          )}, Duration: ${duration}ms`
        );

        return NextResponse.json({
          success: true,
          imageDataUrl: result.imageDataUrl,
          description:
            "Image transformed using Replicate (identity-preserving)",
          style,
          cost: totalCost,
          duration,
        });
      } catch (replicateError) {
        // Replicate failed, log warning and fall back to OpenAI
        console.warn(
          "[Ghibli API] Replicate generation failed, falling back to OpenAI:",
          replicateError instanceof Error
            ? replicateError.message
            : "Unknown error"
        );
        console.log(
          "[Ghibli API] Automatic fallback to OpenAI (text-to-image)"
        );
        // Continue to OpenAI path below
      }
    }

    // ========================================================================
    // OPENAI FALLBACK PATH (Text-to-Image via Vision + DALL-E)
    // ========================================================================
    console.log(
      "[Ghibli API] Using OpenAI (fallback - identity may not be preserved)"
    );

    // ========================================================================
    // Step 1: GPT-4 Vision Analysis (5-10 seconds)
    // ========================================================================
    console.log("[Ghibli API] Step 1: Analyzing image with GPT-4 Vision...");

    // Download source image and convert to base64 (ensures Vision can access it)
    console.log("[Ghibli API] Step 1a: Downloading source image for Vision...");
    const sourceResponse = await fetch(imageUrl);
    if (!sourceResponse.ok) {
      throw new Error(
        `Failed to download source image: ${sourceResponse.statusText}`
      );
    }
    const sourceBuffer = await sourceResponse.arrayBuffer();
    const sourceBase64 = Buffer.from(sourceBuffer).toString("base64");
    const sourceDataUrl = `data:image/png;base64,${sourceBase64}`;

    console.log(
      `[Ghibli API] Step 1b: Source image size: ${(
        sourceBuffer.byteLength /
        1024 /
        1024
      ).toFixed(2)}MB`
    );

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
                url: sourceDataUrl, // Use base64 data URL instead of Firebase URL
                detail: "high",
              },
            },
          ],
        },
      ],
      max_tokens: 1000, // Increased from 500 for more detailed descriptions
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

    // Construct final prompt with IDENTITY PRESERVATION emphasis
    const stylePrompt = STYLE_PROMPTS[style as keyof typeof STYLE_PROMPTS];
    const finalPrompt = `Transform this into a Japanese anime art style while PRESERVING the original subject identity and composition.

STYLE: ${stylePrompt}

SCENE TO RECREATE EXACTLY:
${description}

CRITICAL PRESERVATION REQUIREMENTS:
- PRESERVE the exact subject identity: face shape, facial features, hair style/color, clothing, body proportions
- PRESERVE the exact pose, posture, and body positioning
- PRESERVE the exact camera angle and perspective
- PRESERVE the exact composition and layout
- PRESERVE background elements in their exact positions
- DO NOT add, remove, or move any elements
- DO NOT change hair color, clothing colors, or facial features
- DO NOT alter the scene layout or camera framing

STYLE TRANSFORMATION (ONLY):
- Apply Japanese anime art style: clean line art, flat cel shading, soft gradients
- Add characteristic anime eyes (large, expressive) while keeping original eye color and expression
- Use painterly textures and soft brush strokes for warmth
- Apply hand-drawn 2D animation aesthetic
- Use traditional cel animation techniques

The result must look like the SAME person/scene in anime style, not a different character or composition.`;

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
    // Step 3: Download image and convert to base64 (avoid CORS issues)
    // ========================================================================
    console.log("[Ghibli API] Step 3: Downloading image for client upload...");

    const downloadResponse = await fetch(generatedImageUrl);
    if (!downloadResponse.ok) {
      throw new Error(
        `Failed to download image from DALL-E: ${downloadResponse.statusText}`
      );
    }

    // Convert to base64 for client-side upload (avoids CORS)
    const imageBuffer = await downloadResponse.arrayBuffer();
    const base64Image = Buffer.from(imageBuffer).toString("base64");
    const imageDataUrl = `data:image/png;base64,${base64Image}`;

    console.log(
      `[Ghibli API] Step 3 complete. Image size: ${(
        imageBuffer.byteLength /
        1024 /
        1024
      ).toFixed(2)}MB`
    );

    // ========================================================================
    // Step 4: Return response with base64 image data
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
      imageDataUrl, // Base64 data URL for client upload
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
