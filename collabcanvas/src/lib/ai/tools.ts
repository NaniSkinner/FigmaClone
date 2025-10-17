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
      "Create a rectangle or circle on the canvas with specified position, dimensions, and colors",
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
            "Fill color as hex code. Default: #D4E7C5 (Matcha Green). Examples: #FF0000, #0000FF",
        },
        stroke: {
          type: "string",
          description:
            "Stroke color as hex code. Default: #B4A7D6 (Lavender). Examples: #000000, #FFFFFF",
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
      "Create a text element on the canvas with specified content, position, and styling",
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
            "X coordinate of the text (top-left). Range: 0-8000. Center is at 4000.",
        },
        y: {
          type: "number",
          description:
            "Y coordinate of the text (top-left). Range: 0-8000. Center is at 4000.",
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
            "Text color as hex code. Default: #1F2937 (dark gray). Examples: #000000, #FFFFFF",
        },
        rotation: {
          type: "number",
          description: "Rotation in degrees. Default: 0. Range: 0-360",
        },
      },
      required: ["text", "x", "y"],
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
 * Export all tools as an array for OpenAI
 */
export const allTools: AITool[] = [
  createShapeTool,
  createTextTool,
  moveObjectTool,
  resizeObjectTool,
  rotateObjectTool,
  deleteObjectTool,
  arrangeObjectsTool,
  createComplexLayoutTool,
  getCanvasStateTool,
];
