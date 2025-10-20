/**
 * Template Loader Module
 *
 * Loads and processes birthday invite templates with placeholder replacement.
 *
 * Features:
 * - Loads template JSON files from /public/templates/birthday/
 * - Replaces placeholders ([NAME], [AGE], [DATE], [TIME], [LOCATION])
 * - Scales templates for 8000x8000 canvas
 * - Creates text objects on canvas
 *
 * Reference: AIhbPRD.md Section 5 - Template System
 */

import { Text as TextObject } from "@/types/canvas";

export interface TemplateElement {
  type: "text" | "image" | "shape";
  content?: string;
  x: number;
  y: number;
  fontSize?: number;
  fontFamily?: string;
  color?: string;
  align?: "left" | "center" | "right";
  width?: number;
}

export interface InviteTemplate {
  id: string;
  name: string;
  displayName: string;
  category: "birthday" | "party" | "celebration";
  description: string;
  dimensions: {
    width: number;
    height: number;
    displayWidth: number;
    displayHeight: number;
    dpi?: number;
  };
  canvasScale?: {
    comment?: string;
    scaleX: number;
    scaleY: number;
  };
  format: "instagram_story" | "instagram_post" | "print_card" | "digital";
  elements: TemplateElement[];
  thumbnail?: string;
}

export interface TemplatePlaceholders {
  name?: string;
  age?: string;
  date?: string;
  time?: string;
  location?: string;
}

export interface LoadTemplateOptions {
  templateId: string;
  placeholders?: TemplatePlaceholders;
  userId: string;
}

export interface LoadTemplateResult {
  success: boolean;
  template?: InviteTemplate;
  textObjects?: TextObject[];
  error?: string;
}

/**
 * Available template IDs
 */
export const TEMPLATE_IDS = [
  "ig_story_birthday",
  "square_birthday_post",
  "print_card_6x4",
  "digital_landscape",
  "kids_party_square",
] as const;

export type TemplateId = (typeof TEMPLATE_IDS)[number];

/**
 * Load a template by ID
 */
export async function loadTemplate(
  templateId: string
): Promise<InviteTemplate | null> {
  try {
    const response = await fetch(`/templates/birthday/${templateId}.json`);

    if (!response.ok) {
      console.error(`Failed to load template: ${templateId}`);
      return null;
    }

    const template: InviteTemplate = await response.json();
    return template;
  } catch (error) {
    console.error(`Error loading template ${templateId}:`, error);
    return null;
  }
}

/**
 * Replace placeholders in template content
 */
export function replacePlaceholders(
  content: string,
  placeholders: TemplatePlaceholders
): string {
  let result = content;

  // Replace all placeholders
  if (placeholders.name) {
    result = result.replace(/\[NAME\]/gi, placeholders.name);
  }
  if (placeholders.age) {
    result = result.replace(/\[AGE\]/gi, placeholders.age);
  }
  if (placeholders.date) {
    result = result.replace(/\[DATE\]/gi, placeholders.date);
  }
  if (placeholders.time) {
    result = result.replace(/\[TIME\]/gi, placeholders.time);
  }
  if (placeholders.location) {
    result = result.replace(/\[LOCATION\]/gi, placeholders.location);
  }

  return result;
}

/**
 * Check if content contains placeholders
 */
export function hasPlaceholders(content: string): boolean {
  return /\[(NAME|AGE|DATE|TIME|LOCATION)\]/i.test(content);
}

/**
 * Get list of remaining placeholders in content
 */
export function getRemainingPlaceholders(content: string): string[] {
  const matches = content.match(/\[(NAME|AGE|DATE|TIME|LOCATION)\]/gi);
  return matches ? [...new Set(matches)] : [];
}

/**
 * Convert template elements to canvas text objects
 */
export function createTextObjectsFromTemplate(
  template: InviteTemplate,
  placeholders: TemplatePlaceholders,
  userId: string,
  startZIndex: number
): TextObject[] {
  const textObjects: TextObject[] = [];

  template.elements.forEach((element, index) => {
    if (element.type === "text" && element.content) {
      // Replace placeholders
      const content = replacePlaceholders(element.content, placeholders);

      // Create text object
      const textObject: TextObject = {
        id: crypto.randomUUID(),
        type: "text",
        x: element.x,
        y: element.y,
        text: content,
        fontSize: element.fontSize || 256,
        fontFamily: element.fontFamily || "Arial",
        fill: element.color || "#000000",
        fontStyle: "normal",
        width: element.width,
        align: element.align || "left",
        rotation: 0,
        userId,
        zIndex: startZIndex + index,
        createdAt: new Date(),
        updatedAt: new Date(),
        // Template metadata
        birthdayTemplate: template.id,
        aiGenerated: false, // Templates are not AI-generated
      };

      textObjects.push(textObject);
    }
  });

  return textObjects;
}

/**
 * Load template and create text objects
 * Main function used by AI agent
 */
export async function loadTemplateAndCreateObjects(
  options: LoadTemplateOptions
): Promise<LoadTemplateResult> {
  const { templateId, placeholders = {}, userId } = options;

  try {
    console.log("[TemplateLoader] Loading template:", templateId);
    console.log("[TemplateLoader] Placeholders:", placeholders);

    // Step 1: Load template
    const template = await loadTemplate(templateId);

    if (!template) {
      console.error("[TemplateLoader] Template not found:", templateId);
      return {
        success: false,
        error: `Template not found: ${templateId}`,
      };
    }

    console.log("[TemplateLoader] Template loaded:", template.displayName);
    console.log("[TemplateLoader] Template dimensions:", template.dimensions);
    console.log("[TemplateLoader] Elements count:", template.elements.length);

    // Step 2: Create text objects (z-index will be set by canvas store)
    const textObjects = createTextObjectsFromTemplate(
      template,
      placeholders,
      userId,
      1000 // Starting z-index (will be overridden by canvas store)
    );

    console.log("[TemplateLoader] Created text objects:", textObjects.length);
    textObjects.forEach((obj, i) => {
      console.log(`[TemplateLoader] Object ${i}:`, {
        text: obj.text,
        x: obj.x,
        y: obj.y,
        fontSize: obj.fontSize,
        fontFamily: obj.fontFamily,
        fill: obj.fill,
        align: obj.align,
        width: obj.width,
      });
    });

    return {
      success: true,
      template,
      textObjects,
    };
  } catch (error) {
    console.error("[TemplateLoader] Error:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to load template",
    };
  }
}

/**
 * Get template metadata without loading full template
 */
export interface TemplateMetadata {
  id: string;
  name: string;
  displayName: string;
  description: string;
  dimensions: string;
  format: string;
}

export const TEMPLATE_METADATA: TemplateMetadata[] = [
  {
    id: "ig_story_birthday",
    name: "Instagram Story - Birthday",
    displayName: "Instagram Story Birthday Invite",
    description: "Vertical birthday invite optimized for Instagram Stories",
    dimensions: "1080 x 1920 (9:16)",
    format: "instagram_story",
  },
  {
    id: "square_birthday_post",
    name: "Square Post - Birthday",
    displayName: "Square Birthday Post",
    description: "Square birthday post for Instagram/Facebook",
    dimensions: "1080 x 1080 (1:1)",
    format: "instagram_post",
  },
  {
    id: "print_card_6x4",
    name: "Print Card 6x4",
    displayName: 'Print Birthday Card (6" x 4")',
    description: "Classic birthday card for printing at 300 DPI",
    dimensions: '1800 x 1200 (6" x 4" @ 300 DPI)',
    format: "print_card",
  },
  {
    id: "digital_landscape",
    name: "Digital Landscape",
    displayName: "Digital Landscape Invite",
    description: "Horizontal birthday invite for email/web display",
    dimensions: "1920 x 1080 (16:9)",
    format: "digital",
  },
  {
    id: "kids_party_square",
    name: "Kids Party Square",
    displayName: "Kids Birthday Party (Square)",
    description: "Colorful, playful birthday invite for children's parties",
    dimensions: "1080 x 1080 (1:1)",
    format: "instagram_post",
  },
];
