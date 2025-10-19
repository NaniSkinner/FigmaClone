/**
 * Replicate AI Integration for Anime Style Transfer
 *
 * Uses true image-to-image models to preserve identity, pose, and composition
 * while applying anime art style.
 */

import Replicate from "replicate";
import { GhibliStyle } from "@/types/ai";

// Initialize Replicate client
const replicate = new Replicate({
  auth: process.env.REPLICATE_API_TOKEN!,
});

// Style-specific prompts for Replicate models
const REPLICATE_STYLE_PROMPTS = {
  anime: "anime style, clean line art, cel shading, expressive anime eyes",
  ghibli:
    "anime style, watercolor painting, soft pastel colors, gentle lighting, whimsical atmosphere",
  spirited_away:
    "anime style, vibrant colors, mystical atmosphere, detailed background, ethereal lighting",
  totoro:
    "anime style, soft muted pastels, nature elements, peaceful countryside mood, gentle features",
};

// Negative prompts to avoid identity drift and quality issues
const NEGATIVE_PROMPT =
  "photorealistic, realistic photo, 3d render, cgi, distorted face, extra limbs, deformed, ugly, blurry, different person, wrong hair color, wrong face shape, identity drift, age changed, western cartoon, photo filter";

export interface ReplicateGenerateOptions {
  sourceImageDataUrl: string; // Base64 data URL
  style: GhibliStyle;
  identityStrength?: number; // 0-1, default 0.8 (quality-focused)
  styleStrength?: number; // 0-1, default 0.65 (quality-focused)
}

export interface ReplicateGenerateResult {
  imageDataUrl: string; // Base64 data URL
  cost: number; // Estimated cost in USD
  duration: number; // Milliseconds
}

/**
 * Generate anime-style image using Replicate SDXL img2img
 * Uses true image-to-image transformation to preserve identity, facial features,
 * pose, and composition while applying anime art style.
 *
 * Identity preservation is controlled by the strength parameter (lower = better preservation).
 */
export async function generateAnimeWithReplicate(
  options: ReplicateGenerateOptions
): Promise<ReplicateGenerateResult> {
  const {
    sourceImageDataUrl,
    style,
    identityStrength = 0.8, // Quality-focused: higher identity preservation
    styleStrength = 0.65, // Quality-focused: moderate transformation
  } = options;

  const startTime = Date.now();

  try {
    console.log(
      `[Replicate] Starting generation with style: ${style}, identity: ${identityStrength}, style strength: ${styleStrength}`
    );

    // Get style-specific prompt
    const stylePrompt =
      REPLICATE_STYLE_PROMPTS[style as keyof typeof REPLICATE_STYLE_PROMPTS] ||
      REPLICATE_STYLE_PROMPTS.anime;

    // Calculate strength parameter for SDXL img2img
    // Lower strength = more identity preservation (0.15-0.35 recommended)
    // identityStrength 0.8 → strength 0.2 (strong identity preservation)
    // identityStrength 0.6 → strength 0.4 (moderate transformation)
    const strength = Math.max(0.15, Math.min(0.5, 1 - identityStrength));

    console.log(
      `[Replicate] Using SDXL img2img with strength=${strength.toFixed(
        2
      )} for identity preservation`
    );

    // Use FLUX.1-dev - Supports true img2img with controlnet
    // Public model: https://replicate.com/black-forest-labs/flux-dev
    // Unlike schnell, dev version supports image conditioning for identity preservation
    const output = await replicate.run("black-forest-labs/flux-dev", {
      input: {
        prompt: stylePrompt,
        image: sourceImageDataUrl, // Source image for img2img transformation
        prompt_strength: strength, // How much to transform (lower = more identity preservation)
        num_inference_steps: 28, // FLUX-dev needs more steps than schnell for quality
        guidance_scale: 3.5, // FLUX works better with lower guidance (2-4 range)
        // FLUX-dev doesn't have aggressive NSFW filtering like SDXL
      },
    });

    console.log("[Replicate] Generation complete, processing output...");
    console.log(
      "[Replicate] Output type:",
      typeof output,
      "Is array:",
      Array.isArray(output)
    );

    // Output can be: array of URLs, single URL string, or base64 data URL
    let imageDataUrl: string;
    let outputUrl: string | null = null;

    // Handle different output formats
    if (typeof output === "string") {
      // FLUX returns a single URL string
      outputUrl = output;
      console.log("[Replicate] Direct string output detected");
    } else if (Array.isArray(output) && output.length > 0) {
      // SDXL and some models return array
      const outputItem = output[0];
      if (typeof outputItem === "string") {
        outputUrl = outputItem;
        console.log("[Replicate] Array output detected");
      } else if (typeof outputItem === "object" && outputItem !== null) {
        // Handle ReadableStream or FileOutput objects
        // Check if it has a 'url' property (FileOutput format)
        if ("url" in outputItem && typeof outputItem.url === "string") {
          outputUrl = outputItem.url;
          console.log(
            "[Replicate] Array with object output detected (url property)"
          );
        } else if (outputItem.constructor.name === "ReadableStream") {
          // It's a ReadableStream - this means we need to wait for it
          console.log("[Replicate] ReadableStream detected, reading stream...");
          // Read the stream to get the URL
          const reader = outputItem.getReader();
          const chunks: Uint8Array[] = [];
          let done = false;

          while (!done) {
            const { value, done: streamDone } = await reader.read();
            done = streamDone;
            if (value) chunks.push(value);
          }

          // Concatenate chunks and decode
          const concatenated = new Uint8Array(
            chunks.reduce((acc, chunk) => acc + chunk.length, 0)
          );
          let offset = 0;
          for (const chunk of chunks) {
            concatenated.set(chunk, offset);
            offset += chunk.length;
          }

          const text = new TextDecoder().decode(concatenated);
          // The stream might contain JSON or just a URL string
          try {
            const parsed = JSON.parse(text);
            outputUrl = parsed.url || parsed.output || text;
          } catch {
            outputUrl = text.trim();
          }
          console.log(
            "[Replicate] ReadableStream processed, URL:",
            outputUrl?.substring(0, 60) + "..."
          );
        } else {
          // Inspect object properties including non-enumerable ones
          console.log("[Replicate] Inspecting object...");
          console.log("[Replicate] Constructor:", outputItem.constructor.name);
          console.log("[Replicate] Keys:", Object.keys(outputItem));
          console.log(
            "[Replicate] All property names:",
            Object.getOwnPropertyNames(outputItem)
          );

          // Try various common property names for file outputs
          const possibleUrlProps = [
            "url",
            "href",
            "src",
            "path",
            "uri",
            "location",
            "link",
          ];
          for (const prop of possibleUrlProps) {
            if (prop in outputItem) {
              const value = (outputItem as any)[prop];
              if (typeof value === "string") {
                outputUrl = value;
                console.log(
                  `[Replicate] Found URL in ${prop} property:`,
                  outputUrl.substring(0, 60) + "..."
                );
                break;
              }
            }
          }

          // If still no URL, try toString()
          if (!outputUrl) {
            try {
              const str = String(outputItem);
              if (str.startsWith("http")) {
                outputUrl = str;
                console.log(
                  "[Replicate] Extracted URL from toString():",
                  outputUrl.substring(0, 60) + "..."
                );
              }
            } catch (e) {
              console.error("[Replicate] toString() failed:", e);
            }
          }

          if (!outputUrl) {
            const objStr = JSON.stringify(outputItem).substring(0, 200);
            console.error(
              "[Replicate] Unexpected array item type:",
              typeof outputItem,
              objStr
            );
            throw new Error("Unexpected output format from Replicate");
          }
        }
      } else {
        console.error(
          "[Replicate] Unexpected array item type:",
          typeof outputItem,
          outputItem
        );
        throw new Error("Unexpected output format from Replicate");
      }
    } else {
      console.error("[Replicate] Unexpected output:", output);
      throw new Error("No output received from Replicate");
    }

    // Ensure we have a valid URL
    if (!outputUrl) {
      throw new Error("No valid URL extracted from Replicate output");
    }

    // Process the URL (convert to base64)
    if (outputUrl.startsWith("data:")) {
      // Already a data URL
      imageDataUrl = outputUrl;
      console.log("[Replicate] Output is already base64 data URL");
    } else {
      // It's a URL, download and convert to base64
      console.log(
        "[Replicate] Downloading output from URL:",
        outputUrl.substring(0, 60) + "..."
      );
      const response = await fetch(outputUrl);
      if (!response.ok) {
        throw new Error(`Failed to download image: ${response.statusText}`);
      }
      const buffer = await response.arrayBuffer();
      const base64 = Buffer.from(buffer).toString("base64");
      imageDataUrl = `data:image/png;base64,${base64}`;
      console.log("[Replicate] Successfully converted to base64");
    }

    const duration = Date.now() - startTime;

    // FLUX.1-dev img2img pricing: ~$0.015-0.02 per generation (28 steps)
    // Typical run: 15-25 seconds
    // True identity-preserving image-to-image transformation
    // Less aggressive NSFW filtering than SDXL
    // Still cheaper than OpenAI (~$0.06)
    const estimatedCost = 0.018;

    console.log(
      `[Replicate] SUCCESS - Cost: ~$${estimatedCost.toFixed(
        4
      )}, Duration: ${duration}ms`
    );

    return {
      imageDataUrl,
      cost: estimatedCost,
      duration,
    };
  } catch (error) {
    console.error("[Replicate] Generation error:", error);

    // Provide helpful error message
    let errorMessage = "Replicate generation failed: ";

    if (error instanceof Error && error.message.includes("422")) {
      errorMessage +=
        "The model version doesn't exist or requires permission. ";
      errorMessage +=
        "Visit https://replicate.com/explore to find working image-to-image models. ";
      errorMessage += "Falling back to OpenAI for now.";
    } else if (error instanceof Error) {
      errorMessage += error.message;
    } else {
      errorMessage += "Unknown error";
    }

    throw new Error(errorMessage);
  }
}

/**
 * Check if Replicate is configured
 */
export function isReplicateConfigured(): boolean {
  return !!process.env.REPLICATE_API_TOKEN;
}
