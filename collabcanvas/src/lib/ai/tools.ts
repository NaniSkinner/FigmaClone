/**
 * AI Tool Definitions for OpenAI Function Calling
 *
 * Defines the "vocabulary" that the AI agent can use to manipulate the canvas.
 * Each tool represents a specific canvas operation with typed parameters.
 *
 * Reference: aiPRD.md Section 4.4.2 - Function Tools Schema
 * Reference: aiTasks.md Task 5 - AI Tool Definitions
 */

import { AITool } from "@/types/ai";

/**
 * Tool 1: Create Shape
 * Creates rectangles and circles on the canvas
 */
export const createShapeTool: AITool = {
  type: "function",
  function: {
    name: "createShape",
    description:
      "Create basic geometric shapes (rectangles, circles) for UI layouts, diagrams, and explicit geometry requests. For BIRTHDAY DECORATIONS (balloons, confetti, 3D effects), use enhanceBirthdayText instead. Use this for: UI elements, explicit 'create N circles', non-decorative shapes, forms, buttons, and layouts.",
    parameters: {
      type: "object",
      properties: {
        type: {
          type: "string",
          enum: ["rectangle", "circle"],
          description: "The type of shape to create",
        },
        x: {
          type: "number",
          description:
            "X coordinate of the shape (top-left for rectangle, center for circle). Range: 0-8000. Center is at 4000.",
        },
        y: {
          type: "number",
          description:
            "Y coordinate of the shape (top-left for rectangle, center for circle). Range: 0-8000. Center is at 4000.",
        },
        width: {
          type: "number",
          description:
            "Width of the rectangle in pixels (for rectangle only). Default: 400. Min: 10, typical: 200-1000",
        },
        height: {
          type: "number",
          description:
            "Height of the rectangle in pixels (for rectangle only). Default: 300. Min: 10, typical: 200-800",
        },
        radius: {
          type: "number",
          description:
            "Radius of the circle in pixels (for circle only). Default: 200. Min: 10, typical: 100-500",
        },
        fill: {
          type: "string",
          description:
            "Fill color as hex code or color name. Default: #D4E7C5 (Matcha Green). Accepts any color: red, blue, black, or hex codes like #FF0000, #0000FF",
        },
        stroke: {
          type: "string",
          description:
            "Stroke color as hex code or color name. Default: #B4A7D6 (Lavender). Accepts any color: black, white, red, or hex codes like #000000, #FFFFFF",
        },
        strokeWidth: {
          type: "number",
          description: "Stroke width in pixels. Default: 3. Range: 1-10",
        },
        rotation: {
          type: "number",
          description: "Rotation in degrees. Default: 0. Range: 0-360",
        },
      },
      required: ["type", "x", "y"],
    },
  },
};

/**
 * Tool 2: Create Text
 * Creates text elements on the canvas
 */
export const createTextTool: AITool = {
  type: "function",
  function: {
    name: "createText",
    description:
      "Create a simple text element on the canvas with specified content, position, and styling. Use for basic text labels, UI text, and non-birthday text. For birthday/party text with special effects (3D, artistic, decorative), use enhanceBirthdayText or generateBirthdayText instead. If position not specified, defaults to center (4000, 4000).",
    parameters: {
      type: "object",
      properties: {
        text: {
          type: "string",
          description: "The text content to display",
        },
        x: {
          type: "number",
          description:
            "X coordinate of the text (top-left). Range: 0-8000. Center is at 4000. Defaults to 4000 if not specified.",
        },
        y: {
          type: "number",
          description:
            "Y coordinate of the text (top-left). Range: 0-8000. Center is at 4000. Defaults to 4000 if not specified.",
        },
        fontSize: {
          type: "number",
          description: "Font size in pixels. Default: 128. Range: 16-800",
        },
        fontFamily: {
          type: "string",
          description:
            "Font family name. Default: 'Arial'. Examples: 'Arial', 'Helvetica', 'Times New Roman'",
        },
        fontStyle: {
          type: "string",
          enum: ["normal", "bold", "italic", "bold italic"],
          description: "Font style. Default: 'normal'",
        },
        fill: {
          type: "string",
          description:
            "Text color as hex code or color name. Default: #1F2937 (dark gray). Accepts any color: black, white, red, blue, or hex codes like #000000, #FFFFFF",
        },
        rotation: {
          type: "number",
          description: "Rotation in degrees. Default: 0. Range: 0-360",
        },
      },
      required: ["text"],
    },
  },
};

/**
 * Tool 3: Move Object
 * Moves an object to a new position
 */
export const moveObjectTool: AITool = {
  type: "function",
  function: {
    name: "moveObject",
    description:
      "Move an object to a new position on the canvas. Can reference objects by description (e.g., 'blue rectangle') or ID",
    parameters: {
      type: "object",
      properties: {
        objectId: {
          type: "string",
          description:
            "The ID of the object to move, or a natural language description (e.g., 'the blue rectangle', 'largest circle')",
        },
        x: {
          type: "number",
          description: "New X coordinate. Range: 0-8000. Center is at 4000.",
        },
        y: {
          type: "number",
          description: "New Y coordinate. Range: 0-8000. Center is at 4000.",
        },
      },
      required: ["objectId", "x", "y"],
    },
  },
};

/**
 * Tool 4: Resize Object
 * Changes the dimensions of an object
 */
export const resizeObjectTool: AITool = {
  type: "function",
  function: {
    name: "resizeObject",
    description:
      "Resize an object (change width/height for rectangles, radius for circles). Can reference by description or ID",
    parameters: {
      type: "object",
      properties: {
        objectId: {
          type: "string",
          description:
            "The ID of the object to resize, or a natural language description",
        },
        width: {
          type: "number",
          description:
            "New width in pixels (for rectangles). Min: 10, Max: 8000",
        },
        height: {
          type: "number",
          description:
            "New height in pixels (for rectangles). Min: 10, Max: 8000",
        },
        radius: {
          type: "number",
          description: "New radius in pixels (for circles). Min: 10, Max: 4000",
        },
      },
      required: ["objectId"],
    },
  },
};

/**
 * Tool 5: Rotate Object
 * Rotates an object by a specified angle
 */
export const rotateObjectTool: AITool = {
  type: "function",
  function: {
    name: "rotateObject",
    description:
      "Rotate an object by a specified angle in degrees. Can reference by description or ID",
    parameters: {
      type: "object",
      properties: {
        objectId: {
          type: "string",
          description:
            "The ID of the object to rotate, or a natural language description",
        },
        degrees: {
          type: "number",
          description:
            "Rotation angle in degrees. Positive = clockwise, negative = counter-clockwise. Will be normalized to 0-360",
        },
      },
      required: ["objectId", "degrees"],
    },
  },
};

/**
 * Tool 6: Delete Object
 * Removes an object from the canvas
 */
export const deleteObjectTool: AITool = {
  type: "function",
  function: {
    name: "deleteObject",
    description:
      "Delete an object from the canvas. Can reference by description or ID",
    parameters: {
      type: "object",
      properties: {
        objectId: {
          type: "string",
          description:
            "The ID of the object to delete, or a natural language description (e.g., 'the red circle', 'all text')",
        },
      },
      required: ["objectId"],
    },
  },
};

/**
 * Tool 7: Arrange Objects
 * Arranges multiple objects in a layout pattern
 */
export const arrangeObjectsTool: AITool = {
  type: "function",
  function: {
    name: "arrangeObjects",
    description:
      "Arrange multiple objects in a layout pattern (horizontal, vertical, or grid)",
    parameters: {
      type: "object",
      properties: {
        objectIds: {
          type: "array",
          items: { type: "string" },
          description:
            "Array of object IDs to arrange, or descriptions like 'all rectangles'",
        },
        layout: {
          type: "string",
          enum: ["horizontal", "vertical", "grid"],
          description:
            "Layout type: 'horizontal' = left to right, 'vertical' = top to bottom, 'grid' = rows and columns",
        },
        spacing: {
          type: "number",
          description: "Space between objects in pixels. Default: 20",
        },
        startX: {
          type: "number",
          description: "Starting X coordinate for the layout. Default: 100",
        },
        startY: {
          type: "number",
          description: "Starting Y coordinate for the layout. Default: 100",
        },
        columns: {
          type: "number",
          description: "Number of columns (for grid layout only). Default: 3",
        },
      },
      required: ["objectIds", "layout"],
    },
  },
};

/**
 * Tool 8: Create Complex Layout
 * Creates a complete UI component from a template
 */
export const createComplexLayoutTool: AITool = {
  type: "function",
  function: {
    name: "createComplexLayout",
    description:
      "Create a complex UI layout from predefined templates (login form, navigation bar, card, button group, dashboard)",
    parameters: {
      type: "object",
      properties: {
        layoutType: {
          type: "string",
          enum: [
            "loginForm",
            "navigationBar",
            "card",
            "buttonGroup",
            "dashboard",
          ],
          description: "The type of layout template to create",
        },
        x: {
          type: "number",
          description:
            "X coordinate for the layout's top-left corner. Default: 500",
        },
        y: {
          type: "number",
          description:
            "Y coordinate for the layout's top-left corner. Default: 400",
        },
        config: {
          type: "object",
          description:
            "Configuration object for the layout. Structure varies by layoutType",
          properties: {
            title: {
              type: "string",
              description: "Title text (for card, dashboard)",
            },
            items: {
              type: "array",
              items: { type: "string" },
              description:
                "Array of item labels (for navigationBar, buttonGroup)",
            },
            width: { type: "number", description: "Overall width" },
            height: { type: "number", description: "Overall height" },
          },
        },
      },
      required: ["layoutType"],
    },
  },
};

/**
 * Tool 9: Get Canvas State
 * Queries the current canvas state
 */
export const getCanvasStateTool: AITool = {
  type: "function",
  function: {
    name: "getCanvasState",
    description:
      "Query the current canvas state - get information about objects, selection, or viewport",
    parameters: {
      type: "object",
      properties: {
        filter: {
          type: "string",
          description:
            "Optional filter: 'selected' = only selected objects, 'type:rectangle' = only rectangles, 'all' = everything",
        },
      },
      required: [],
    },
  },
};

/**
 * Tool 10: Create Batch Shapes
 * Creates multiple shapes at once for efficient batch operations
 */
export const createBatchShapesTool: AITool = {
  type: "function",
  function: {
    name: "createBatchShapes",
    description:
      "Create multiple shapes at once (up to 500 shapes). Use this for batch operations when user requests many objects. Much more efficient than calling createShape multiple times.",
    parameters: {
      type: "object",
      properties: {
        shapes: {
          type: "array",
          description: "Array of shapes to create",
          items: {
            type: "object",
            properties: {
              type: {
                type: "string",
                enum: ["rectangle", "circle"],
                description: "Shape type",
              },
              x: {
                type: "number",
                description: "X coordinate (0-8000)",
              },
              y: {
                type: "number",
                description: "Y coordinate (0-8000)",
              },
              width: {
                type: "number",
                description: "Width for rectangles (default: 400)",
              },
              height: {
                type: "number",
                description: "Height for rectangles (default: 300)",
              },
              radius: {
                type: "number",
                description: "Radius for circles (default: 200)",
              },
              fill: {
                type: "string",
                description: "Fill color as hex or name",
              },
              stroke: {
                type: "string",
                description: "Stroke color as hex or name",
              },
              strokeWidth: {
                type: "number",
                description: "Stroke width (default: 3)",
              },
              rotation: {
                type: "number",
                description: "Rotation in degrees (default: 0)",
              },
            },
            required: ["type", "x", "y"],
          },
        },
      },
      required: ["shapes"],
    },
  },
};

/**
 * Tool 11: Generate Birthday Text
 * AI-powered birthday banner and e-invite text generation
 */
export const generateBirthdayTextTool: AITool = {
  type: "function",
  function: {
    name: "generateBirthdayText",
    description:
      "Generate simple editable birthday text objects with bubble fonts and festive colors. Use for SIMPLE/PLAIN birthday text requests WITHOUT 3D or artistic effects. Creates editable text objects for birthday invites, party banners, and celebration graphics. Fast generation (~3-5s) with smart clarification for ambiguous requests. NOTE: If user asks for '3D text', 'fancy', 'artistic', or 'decorative' effects, use enhanceBirthdayText instead.",
    parameters: {
      type: "object",
      properties: {
        userMessage: {
          type: "string",
          description:
            'The user\'s birthday text request for SIMPLE TEXT (not 3D). Examples: "Create HAPPY BIRTHDAY EVA text", "Make birthday banner for Sarah", "Generate pink bubbly text saying HAPPY BDAY MOM", "Create birthday invite with date and time". Include name, style preferences (bubbly, elegant, playful), color preferences, and any additional text (date, time, location). Do NOT use this for 3D or artistic requests.',
        },
      },
      required: ["userMessage"],
    },
  },
};

/**
 * Tool 12: Load Birthday Template
 * Load preset birthday invite templates with placeholder replacement
 */
export const loadBirthdayTemplateTool: AITool = {
  type: "function",
  function: {
    name: "loadBirthdayTemplate",
    description:
      "Load a preset birthday invite template with automatic placeholder replacement. Templates include Instagram Story, Square Post, Print Cards, Digital Landscape, and Kids Party formats. Creates complete invite layouts with text elements.",
    parameters: {
      type: "object",
      properties: {
        templateId: {
          type: "string",
          enum: [
            "ig_story_birthday",
            "square_birthday_post",
            "print_card_6x4",
            "digital_landscape",
            "kids_party_square",
          ],
          description:
            'Template to load: "ig_story_birthday" (Instagram Story 9:16), "square_birthday_post" (Square 1:1 for Instagram/Facebook), "print_card_6x4" (6x4 print card at 300 DPI), "digital_landscape" (16:9 landscape for email/web), "kids_party_square" (Colorful square for kids parties)',
        },
        name: {
          type: "string",
          description: "Name to replace [NAME] placeholder in template",
        },
        age: {
          type: "string",
          description: "Age to replace [AGE] placeholder (if template has it)",
        },
        date: {
          type: "string",
          description:
            'Date to replace [DATE] placeholder, e.g., "Saturday, Dec 25"',
        },
        time: {
          type: "string",
          description: 'Time to replace [TIME] placeholder, e.g., "3:00 PM"',
        },
        location: {
          type: "string",
          description:
            'Location to replace [LOCATION] placeholder, e.g., "Central Park"',
        },
      },
      required: ["templateId"],
    },
  },
};

/**
 * Export all tools as an array for OpenAI
 */
/**
 * Tool 12: Enhance Birthday Text Artistic
 * DALL-E 3 artistic enhancement for birthday text
 */
export const enhanceBirthdayTextTool: AITool = {
  type: "function",
  function: {
    name: "enhanceBirthdayText",
    description:
      "PRIMARY TOOL for 3D birthday text and artistic birthday/party requests. Use DALL-E 3 to generate professional graphics with 3D text effects, cartoon styles, balloons, confetti, decorations, and fancy backgrounds. ALWAYS use THIS tool (NOT createText or generateBirthdayText) when user asks for: '3D text', '3D birthday', 'fancy text', 'artistic text', 'decorative text', 'balloons', 'confetti', or any artistic effects. For simple plain text without 3D/artistic effects, use generateBirthdayText instead. Takes ~20-30s to generate stunning, professional-quality images.",
    parameters: {
      type: "object",
      properties: {
        textContent: {
          type: "string",
          description:
            'The birthday text to render in 3D/artistic style. IMPORTANT: Extract text from user\'s request - for example, if user says "create 3D happy birthday text", use textContent="HAPPY BIRTHDAY". If user says "make 3D text saying Happy Birthday Eva", use textContent="HAPPY BIRTHDAY EVA". If user doesn\'t specify text content AND there are text objects on canvas, combine them (e.g., "HAPPY" + "BIRTHDAY" + "EVA" = "HAPPY BIRTHDAY EVA"). If no text provided and no text on canvas, you must clarify what text to use.',
        },
        style: {
          type: "string",
          enum: ["3d_bubble", "cartoon_inflated"],
          description:
            'Enhancement style: "3d_bubble" (glossy, dimensional, professional, metallic - use for "3D" requests) for elegant look, "cartoon_inflated" (playful, balloon-like, hand-drawn) for fun, kids-friendly look. Default to "3d_bubble" when user says "3D".',
        },
        colors: {
          type: "array",
          items: { type: "string" },
          description:
            'Array of color names or hex codes for the 3D text. Examples: ["pink", "purple", "blue"], ["#FF69B4", "#DA70D6"], ["gold", "silver"]. Extract from user request if specified. Defaults to vibrant pink/purple/blue gradient if not specified.',
        },
        addDecorations: {
          type: "boolean",
          description:
            'Whether to add festive decorations (balloons, confetti, streamers) around the 3D text. Set to true when user requests "add decorations", "add balloons", "add confetti", "with decorations", etc. Default false.',
        },
      },
      required: ["textContent", "style"],
    },
  },
};

export const allTools: AITool[] = [
  // Birthday/Party tools (check these first for decorative requests)
  enhanceBirthdayTextTool, // For artistic effects, decorations in birthday context
  generateBirthdayTextTool,
  loadBirthdayTemplateTool,

  // Basic shape tools (for geometry and UI)
  createShapeTool, // For explicit geometric shapes and UI elements
  createBatchShapesTool,

  // Other manipulation tools
  createTextTool,
  moveObjectTool,
  resizeObjectTool,
  rotateObjectTool,
  deleteObjectTool,
  arrangeObjectsTool,
  createComplexLayoutTool,
  getCanvasStateTool,
];
