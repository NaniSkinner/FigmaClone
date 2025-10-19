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

// Simplified style-specific prompts for Ghibli model (as per Replicate documentation)
const REPLICATE_STYLE_PROMPTS = {
  anime: "Ghibli Studio style, Charming hand-drawn anime-style illustration",
  ghibli:
    "Ghibli Studio style, Charming hand-drawn anime-style illustration with soft watercolor backgrounds",
  spirited_away:
    "Spirited Away style, Hand-drawn anime illustration with mystical atmosphere",
  totoro:
    "My Neighbor Totoro style, Gentle hand-drawn animation with soft pastel colors",
};

// Negative prompts to avoid photorealism and identity drift - comprehensive
const NEGATIVE_PROMPT =
  "photorealistic, realistic, photo, photograph, photography, hdr, high dynamic range, raw photo, dslr, skin pores, skin texture, skin detail, pores, blemishes, freckles detail, stubble, shiny skin, oily skin, sweaty skin, harsh specular, camera lens, bokeh, depth of field, motion blur, film grain, noise, jpeg artifacts, chromatic aberration, lens distortion, vignette, detailed wrinkles, age lines, five o'clock shadow, facial hair detail, wet skin, glossy skin, makeup detail, foundation, eyeliner, mascara, 3d render, cgi, ray tracing, unreal engine, different person, wrong identity, face change";

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
 * Generate anime-style image using Replicate Ghibli model
 * Uses danila013/ghibli-easycontrol for true hand-drawn Ghibli-style transformation.
 * This model supports img2img with fine-tuning controls for style intensity.
 *
 * Parameters:
 * - lora_weight: Controls Ghibli style intensity (0-2, default 1)
 * - guidance_scale: How closely to follow the prompt (1-10, default 3.5)
 * - num_inference_steps: Quality vs speed tradeoff (1-100, default 25)
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

    // Get style-specific prompt (simplified as per documentation)
    const stylePrompt =
      REPLICATE_STYLE_PROMPTS[style as keyof typeof REPLICATE_STYLE_PROMPTS] ||
      REPLICATE_STYLE_PROMPTS.anime;

    // Map our style parameters to Ghibli model controls
    // lora_weight: Controls style intensity (0-2, we'll use 0.8-1.5 range)
    // Higher styleStrength = higher lora_weight = more Ghibli style
    const loraWeight = 0.5 + styleStrength * 1.0; // Maps 0.65 styleStrength -> 1.15 lora_weight

    // guidance_scale: How closely to follow prompt (1-10, we'll use 3-5 range)
    // Higher for more faithful Ghibli reproduction
    const guidanceScale = 3.0 + styleStrength * 2.0; // Maps 0.65 -> 4.3

    // num_inference_steps: Quality vs speed (1-100)
    // More steps = better quality, use 25-35 range for good balance
    const inferenceSteps = Math.round(20 + styleStrength * 15); // Maps 0.65 -> ~30 steps

    console.log(
      `[Replicate] Using Ghibli model (style: ${style}, lora: ${loraWeight.toFixed(
        2
      )}, guidance: ${guidanceScale.toFixed(1)}, steps: ${inferenceSteps})`
    );

    // Use danila013/ghibli-easycontrol - True Ghibli style transformation with img2img
    // Full model with COMPLETE version hash (64 characters)
    // https://replicate.com/danila013/ghibli-easycontrol/versions/f74e8dedd3ac3bc9e9d992fec9a12d62639e6f9bfc5bbf00a1edcca29673da66
    const output = await replicate.run(
      "danila013/ghibli-easycontrol:f74e8dedd3ac3bc9e9d992fec9a12d62639e6f9bfc5bbf00a1edcca29673da66",
      {
        input: {
          input_image: sourceImageDataUrl, // Source image for transformation
          prompt: stylePrompt, // Simplified prompt as per documentation
          lora_weight: loraWeight, // Style intensity (0-2)
          guidance_scale: guidanceScale, // Prompt adherence (1-10)
          num_inference_steps: inferenceSteps, // Quality vs speed (1-100)
          seed: -1, // Random seed for variety
        },
      }
    );

    console.log("[Replicate] Generation complete, processing output...");
    console.log(
      "[Replicate] Output type:",
      typeof output,
      "Is array:",
      Array.isArray(output)
    );

    // Debug: log constructor and check for stream-like properties
    if (typeof output === "object" && output !== null) {
      console.log("[Replicate] Constructor name:", output.constructor?.name);
      console.log(
        "[Replicate] Has getReader:",
        typeof (output as any).getReader === "function"
      );
      console.log("[Replicate] Has url property:", "url" in output);
      console.log("[Replicate] Object keys:", Object.keys(output));
    }

    // Output can be: array of URLs, single URL string, ReadableStream, FileOutput, or base64 data URL
    let imageDataUrl: string;
    let outputUrl: string | null = null;

    // Handle different output formats
    if (typeof output === "string") {
      // FLUX returns a single URL string
      outputUrl = output;
      console.log("[Replicate] Direct string output detected");
    } else if (
      typeof output === "object" &&
      output !== null &&
      "url" in output &&
      typeof (output as any).url === "string"
    ) {
      // Model returned an object with a url property (FileOutput format)
      outputUrl = (output as any).url;
      console.log(
        "[Replicate] Object with url property detected:",
        (outputUrl || "").substring(0, 60) + "..."
      );
    } else if (
      typeof output === "object" &&
      output !== null &&
      (output.constructor?.name === "ReadableStream" ||
        typeof (output as any).getReader === "function")
    ) {
      // Ghibli model returns a ReadableStream with binary image data
      console.log(
        "[Replicate] Direct ReadableStream detected, reading stream as binary..."
      );
      const reader = (output as any).getReader();
      const chunks: Uint8Array[] = [];
      let done = false;

      while (!done) {
        const { value, done: streamDone } = await reader.read();
        done = streamDone;
        if (value) chunks.push(value);
      }

      // Concatenate chunks into single buffer
      const totalLength = chunks.reduce((acc, chunk) => acc + chunk.length, 0);
      const concatenated = new Uint8Array(totalLength);
      let offset = 0;
      for (const chunk of chunks) {
        concatenated.set(chunk, offset);
        offset += chunk.length;
      }

      console.log(`[Replicate] Stream read complete: ${totalLength} bytes`);

      // Check if it's binary image data (starts with PNG/JPEG magic bytes)
      const isPNG = concatenated[0] === 0x89 && concatenated[1] === 0x50;
      const isJPEG = concatenated[0] === 0xff && concatenated[1] === 0xd8;

      if (isPNG || isJPEG) {
        // It's binary image data - convert to base64 data URL
        const base64 = Buffer.from(concatenated).toString("base64");
        const mimeType = isPNG ? "image/png" : "image/jpeg";
        imageDataUrl = `data:${mimeType};base64,${base64}`;
        console.log(
          `[Replicate] Converted binary ${mimeType} to data URL (${base64.length} chars)`
        );

        // Skip URL download since we already have the data
        const duration = Date.now() - startTime;
        const estimatedCost = 0.034;
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
      } else {
        // Try to decode as text (might be URL or JSON)
        const text = new TextDecoder().decode(concatenated);
        console.log(
          "[Replicate] Stream content (first 200 chars):",
          text.substring(0, 200)
        );

        // The stream might contain a URL or JSON with URL
        try {
          const parsed = JSON.parse(text);
          outputUrl = parsed.url || parsed.output || parsed[0] || text;
        } catch {
          // Not JSON, might be direct URL
          outputUrl = text.trim();
        }
        console.log(
          "[Replicate] ReadableStream processed, URL:",
          outputUrl?.substring(0, 60) + "..."
        );
      }
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

    // danila013/ghibli-easycontrol pricing: ~$0.034 per generation
    // Typical run: 20-30 seconds depending on inference steps
    // Image-to-image transformation preserving composition while applying Ghibli style
    // Still cheaper than OpenAI (~$0.06) and produces true hand-drawn anime art
    const estimatedCost = 0.034;

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
 * Generate cartoon image using specialized cartoon model
 * Uses flux-kontext-apps/cartoonify for strong cartoon transformation
 */
export async function generateCartoonWithReplicate(
  options: ReplicateGenerateOptions
): Promise<ReplicateGenerateResult> {
  const { sourceImageDataUrl, style } = options;
  const startTime = Date.now();

  try {
    console.log(
      `[Replicate-Cartoon] Starting cartoon generation with style: ${style}`
    );

    const output = await replicate.run("flux-kontext-apps/cartoonify", {
      input: {
        input_image: sourceImageDataUrl,
        aspect_ratio: "match_input_image",
      },
    });

    // Process output (same as FLUX-dev)
    let imageDataUrl: string;
    let outputUrl: string | null = null;

    if (typeof output === "string") {
      outputUrl = output;
    } else if (Array.isArray(output) && output.length > 0) {
      const outputItem = output[0];
      if (typeof outputItem === "string") {
        outputUrl = outputItem;
      } else if (typeof outputItem === "object" && outputItem !== null) {
        if ("url" in outputItem && typeof outputItem.url === "string") {
          outputUrl = outputItem.url;
        } else {
          outputUrl = String(outputItem);
        }
      }
    }

    if (!outputUrl) {
      throw new Error("No output from cartoon model");
    }

    if (outputUrl.startsWith("data:")) {
      imageDataUrl = outputUrl;
    } else {
      const response = await fetch(outputUrl);
      if (!response.ok) {
        throw new Error(`Failed to download image: ${response.statusText}`);
      }
      const buffer = await response.arrayBuffer();
      const base64 = Buffer.from(buffer).toString("base64");
      imageDataUrl = `data:image/png;base64,${base64}`;
    }

    const duration = Date.now() - startTime;
    const estimatedCost = 0.015;

    console.log(
      `[Replicate-Cartoon] SUCCESS - Cost: ~$${estimatedCost.toFixed(
        4
      )}, Duration: ${duration}ms`
    );

    return { imageDataUrl, cost: estimatedCost, duration };
  } catch (error) {
    console.error("[Replicate-Cartoon] Error:", error);
    throw new Error(
      `Cartoon model failed: ${
        error instanceof Error ? error.message : "Unknown error"
      }`
    );
  }
}

/**
 * Generate anime art using Vision + Animagine XL
 * Better for true cartoon look vs img2img filtering
 */
export async function generateAnimeWithVision(
  options: ReplicateGenerateOptions & { sourceImageUrl: string }
): Promise<ReplicateGenerateResult> {
  const { sourceImageUrl, style, sourceImageDataUrl } = options;
  const startTime = Date.now();

  try {
    console.log(
      `[Replicate-Anime] Using Vision + Animagine XL for style: ${style}`
    );

    // Step 1: Analyze image with GPT-4 Vision
    const OpenAI = (await import("openai")).default;
    const openai = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY,
    });

    const visionPrompt = `Describe this person for creating an anime character. Focus on:
- Age and gender
- Hair: color, style, length
- Eye color
- Facial features and expression
- Clothing: style, colors, patterns
- Pose and positioning
- Any distinctive features
Keep description objective and detailed. 2-3 sentences max.`;

    const visionResponse = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [
        {
          role: "user",
          content: [
            { type: "text", text: visionPrompt },
            {
              type: "image_url",
              image_url: { url: sourceImageDataUrl, detail: "high" },
            },
          ],
        },
      ],
      max_tokens: 300,
    });

    const personDescription = visionResponse.choices[0].message.content || "";
    console.log(
      `[Replicate-Anime] Vision description: ${personDescription.substring(
        0,
        100
      )}...`
    );

    // Step 2: Generate anime art with Animagine XL
    const stylePrompt =
      REPLICATE_STYLE_PROMPTS[style as keyof typeof REPLICATE_STYLE_PROMPTS] ||
      REPLICATE_STYLE_PROMPTS.anime;

    const animePrompt = `${stylePrompt}, ${personDescription}`;

    console.log(`[Replicate-Anime] Generating with Animagine XL...`);

    const output = await replicate.run("cjwbw/animagine-xl-3.1", {
      input: {
        prompt: animePrompt,
        negative_prompt: NEGATIVE_PROMPT,
        width: 1024,
        height: 1024,
        num_inference_steps: 28,
        guidance_scale: 7.0,
      },
    });

    // Process output
    let imageDataUrl: string;
    let outputUrl: string | null = null;

    if (typeof output === "string") {
      outputUrl = output;
    } else if (Array.isArray(output) && output.length > 0) {
      const item = output[0];
      if (typeof item === "string") {
        outputUrl = item;
      } else if (typeof item === "object" && item !== null) {
        outputUrl = "url" in item ? String(item.url) : String(item);
      }
    }

    if (!outputUrl) {
      throw new Error("No output from Animagine XL");
    }

    if (outputUrl.startsWith("data:")) {
      imageDataUrl = outputUrl;
    } else {
      const response = await fetch(outputUrl);
      if (!response.ok) {
        throw new Error(`Failed to download: ${response.statusText}`);
      }
      const buffer = await response.arrayBuffer();
      const base64 = Buffer.from(buffer).toString("base64");
      imageDataUrl = `data:image/png;base64,${base64}`;
    }

    const duration = Date.now() - startTime;
    const visionCost = 0.002; // GPT-4o vision
    const animeCost = 0.012; // Animagine XL
    const estimatedCost = visionCost + animeCost;

    console.log(
      `[Replicate-Anime] SUCCESS - Cost: ~$${estimatedCost.toFixed(
        4
      )}, Duration: ${duration}ms`
    );

    return { imageDataUrl, cost: estimatedCost, duration };
  } catch (error) {
    console.error("[Replicate-Anime] Error:", error);
    throw new Error(
      `Anime generation failed: ${
        error instanceof Error ? error.message : "Unknown"
      }`
    );
  }
}

/**
 * Check if Replicate is configured
 */
export function isReplicateConfigured(): boolean {
  return !!process.env.REPLICATE_API_TOKEN;
}
