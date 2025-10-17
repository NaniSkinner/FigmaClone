/**
 * Canvas AI Agent
 *
 * Main orchestrator for AI-powered canvas manipulation.
 * Processes natural language commands and executes canvas operations.
 *
 * Reference: aiPRD.md Section 4 - AI Canvas Agent
 * Reference: aiTasks.md Task 6 - AI Agent Implementation
 */

import { aiClient } from "./client";
import { CanvasObject, Rectangle, Circle, Text, Line } from "@/types/canvas";
import {
  AIResponse,
  AIAction,
  AIOperation,
  AIOperationLog,
  AIAgentConfig,
  CanvasContext,
} from "@/types/ai";
import {
  generateLoginForm,
  generateNavigationBar,
  generateCard,
  generateButtonGroup,
  generateDashboard,
} from "./layouts";
import { db } from "@/lib/firebase";
import { doc, setDoc, serverTimestamp } from "firebase/firestore";

// Constants - Physical canvas dimensions
const CANVAS_WIDTH = 8000;
const CANVAS_HEIGHT = 8000;
const MAX_OBJECTS_PER_COMMAND = 5;
const DEFAULT_FILL = "#D4E7C5"; // Matcha Green
const DEFAULT_STROKE = "#B4A7D6"; // Lavender
const DEFAULT_STROKE_WIDTH = 3;
const DEFAULT_TEXT_FILL = "#1F2937"; // Dark gray
const DEFAULT_FONT_SIZE = 128; // 4x larger for 8000x8000 canvas (was 32 for 2000x2000)
const DEFAULT_FONT_FAMILY = "Arial";

/**
 * CanvasAIAgent Class
 *
 * Handles the complete AI command processing pipeline:
 * 1. Get canvas context
 * 2. Call OpenAI with function tools
 * 3. Parse function calls
 * 4. Execute functions sequentially
 * 5. Return formatted response
 */
export class CanvasAIAgent {
  private userId: string;
  private canvasId?: string;
  private sessionId: string; // Session ID for grouping related operations
  private currentCommand: string | null = null; // Track current command for metadata
  private currentOperationId: string | null = null; // Track current operation for undo grouping
  private onCreateObject: (object: CanvasObject) => void;
  private onUpdateObject: (id: string, updates: Partial<CanvasObject>) => void;
  private onDeleteObject: (id: string) => void;
  private getCanvasContext: () => CanvasContext;
  private findObjectByDescription: (description: string) => CanvasObject[];
  private getNextZIndex: () => number;
  private onRecordCreate?: (
    objectIdsOrObjects: string[] | CanvasObject[],
    source: "ai" | "manual",
    aiOperationId?: string
  ) => void;
  private onRecordUpdate?: (
    objectIds: string[],
    previousStates: CanvasObject[],
    source: "ai" | "manual",
    aiOperationId?: string
  ) => void;
  private onRecordDelete?: (
    deletedObjects: CanvasObject[],
    source: "ai" | "manual",
    aiOperationId?: string
  ) => void;

  constructor(
    config: AIAgentConfig & {
      getCanvasContext: () => CanvasContext;
      findObjectByDescription: (description: string) => CanvasObject[];
      getNextZIndex: () => number;
      onRecordCreate?: (
        objectIdsOrObjects: string[] | CanvasObject[],
        source: "ai" | "manual",
        aiOperationId?: string
      ) => void;
      onRecordUpdate?: (
        objectIds: string[],
        previousStates: CanvasObject[],
        source: "ai" | "manual",
        aiOperationId?: string
      ) => void;
      onRecordDelete?: (
        deletedObjects: CanvasObject[],
        source: "ai" | "manual",
        aiOperationId?: string
      ) => void;
    }
  ) {
    this.userId = config.userId;
    this.canvasId = config.canvasId;
    this.sessionId = crypto.randomUUID(); // Generate session ID for this agent instance
    this.onCreateObject = config.onCreateObject || (() => {});
    this.onUpdateObject = config.onUpdateObject || (() => {});
    this.onDeleteObject = config.onDeleteObject || (() => {});
    this.getCanvasContext = config.getCanvasContext;
    this.findObjectByDescription = config.findObjectByDescription;
    this.getNextZIndex = config.getNextZIndex;
    this.onRecordCreate = config.onRecordCreate;
    this.onRecordUpdate = config.onRecordUpdate;
    this.onRecordDelete = config.onRecordDelete;
  }

  /**
   * Process a natural language command
   * Main entry point for AI operations
   */
  async processCommand(command: string): Promise<AIResponse> {
    const startTime = Date.now();
    const actions: AIAction[] = [];

    // Store current command for metadata and generate operation ID for undo grouping
    this.currentCommand = command;
    this.currentOperationId = crypto.randomUUID();

    try {
      // Step 1: Get current canvas context
      const context = this.getCanvasContext();

      // Step 2: Call OpenAI with context and tools
      const aiResponse = await aiClient.processCommand(command, context);

      if (!aiResponse.success) {
        return aiResponse;
      }

      // Step 3: Execute function calls
      if (aiResponse.functionCalls && aiResponse.functionCalls.length > 0) {
        for (const call of aiResponse.functionCalls) {
          try {
            const args = JSON.parse(call.function.arguments);
            const action = await this.executeFunction(call.function.name, args);
            actions.push(action);
          } catch (error) {
            actions.push({
              type: "create",
              success: false,
              message: `Failed to execute ${call.function.name}: ${
                error instanceof Error ? error.message : "Unknown error"
              }`,
            });
          }
        }
      }

      const executionTime = Date.now() - startTime;

      // Step 4: Format response
      const successCount = actions.filter((a) => a.success).length;
      const failureCount = actions.filter((a) => !a.success).length;

      let message = aiResponse.message || "";
      if (actions.length > 0) {
        message += `\n\n${successCount} operation(s) completed successfully`;
        if (failureCount > 0) {
          message += `, ${failureCount} failed`;
        }
      }

      // Step 5: Log operation to Firestore (if canvasId provided)
      if (this.canvasId && successCount > 0) {
        this.logOperation(command, true, actions, executionTime).catch((err) =>
          console.warn("Failed to log AI operation:", err)
        );
      }

      return {
        success: successCount > 0,
        message,
        actions,
      };
    } catch (error) {
      console.error("CanvasAIAgent error:", error);

      // Log failed operation (if canvasId provided)
      if (this.canvasId) {
        const executionTime = Date.now() - startTime;
        this.logOperation(
          command,
          false,
          actions,
          executionTime,
          error instanceof Error ? error.message : "Unknown error"
        ).catch((err) => console.warn("Failed to log AI operation:", err));
      }

      return {
        success: false,
        message: "Failed to process command",
        error: error instanceof Error ? error.message : "Unknown error",
        actions,
      };
    }
  }

  /**
   * Log AI operation to Firestore for tracking and analytics
   */
  private async logOperation(
    command: string,
    success: boolean,
    actions: AIAction[],
    executionTimeMs: number,
    error?: string
  ): Promise<void> {
    if (!this.canvasId) return;

    const operationId = crypto.randomUUID();
    const operationLog: AIOperationLog = {
      id: operationId,
      sessionId: this.sessionId,
      canvasId: this.canvasId,
      userId: this.userId,
      command,
      timestamp: new Date(),
      success,
      actions,
      objectsCreated: actions
        .filter((a) => a.type === "create" && a.success && a.objectId)
        .map((a) => a.objectId!),
      objectsModified: actions
        .filter((a) => a.type === "update" && a.success && a.objectId)
        .map((a) => a.objectId!),
      objectsDeleted: actions
        .filter((a) => a.type === "delete" && a.success && a.objectId)
        .map((a) => a.objectId!),
      ...(error && { error }), // Only include error field if it's defined
      executionTimeMs,
    };

    const operationRef = doc(
      db,
      `canvas/${this.canvasId}/ai-operations`,
      operationId
    );

    await setDoc(operationRef, {
      ...operationLog,
      timestamp: serverTimestamp(),
    });
  }

  /**
   * Execute a specific function based on its name
   */
  private async executeFunction(name: string, args: any): Promise<AIAction> {
    switch (name) {
      case "createShape":
        return this.executeCreateShape(args);
      case "createText":
        return this.executeCreateText(args);
      case "moveObject":
        return this.executeMoveObject(args);
      case "resizeObject":
        return this.executeResizeObject(args);
      case "rotateObject":
        return this.executeRotateObject(args);
      case "deleteObject":
        return this.executeDeleteObject(args);
      case "arrangeObjects":
        return this.executeArrangeObjects(args);
      case "createComplexLayout":
        return this.executeCreateComplexLayout(args);
      case "getCanvasState":
        return this.executeGetCanvasState(args);
      default:
        return {
          type: "create",
          success: false,
          message: `Unknown function: ${name}`,
        };
    }
  }

  // ========================================================================
  // Function Executors
  // ========================================================================

  /**
   * Execute createShape function
   */
  private executeCreateShape(args: {
    type: "rectangle" | "circle";
    x: number;
    y: number;
    width?: number;
    height?: number;
    radius?: number;
    fill?: string;
    stroke?: string;
    strokeWidth?: number;
    rotation?: number;
  }): AIAction {
    try {
      const id = crypto.randomUUID();
      const zIndex = this.getNextZIndex();

      // Validate boundaries
      if (
        args.x < 0 ||
        args.x > CANVAS_WIDTH ||
        args.y < 0 ||
        args.y > CANVAS_HEIGHT
      ) {
        return {
          type: "create",
          success: false,
          message: `Position (${args.x}, ${args.y}) is outside canvas boundaries (0-${CANVAS_WIDTH}, 0-${CANVAS_HEIGHT})`,
        };
      }

      if (args.type === "rectangle") {
        const width = args.width || 400;
        const height = args.height || 300;

        const rectangle: Rectangle = {
          id,
          type: "rectangle",
          userId: this.userId,
          x: args.x,
          y: args.y,
          width,
          height,
          fill: args.fill || DEFAULT_FILL,
          stroke: args.stroke || DEFAULT_STROKE,
          strokeWidth: args.strokeWidth || DEFAULT_STROKE_WIDTH,
          rotation: args.rotation || 0,
          zIndex,
          createdAt: new Date(),
          updatedAt: new Date(),
          // AI metadata
          createdByAI: true,
          aiCommand: this.currentCommand || undefined,
          aiSessionId: this.sessionId,
        };

        this.onCreateObject(rectangle);

        // Record for undo (if callback provided)
        if (this.onRecordCreate && this.currentOperationId) {
          this.onRecordCreate([rectangle], "ai", this.currentOperationId);
        }

        return {
          type: "create",
          objectId: id,
          success: true,
          message: `✓ Created ${
            args.fill ? args.fill : "matcha"
          } rectangle at (${args.x}, ${args.y})`,
        };
      } else if (args.type === "circle") {
        const radius = args.radius || 200;

        const circle: Circle = {
          id,
          type: "circle",
          userId: this.userId,
          x: args.x,
          y: args.y,
          radius,
          fill: args.fill || DEFAULT_FILL,
          stroke: args.stroke || DEFAULT_STROKE,
          strokeWidth: args.strokeWidth || DEFAULT_STROKE_WIDTH,
          rotation: args.rotation || 0,
          zIndex,
          createdAt: new Date(),
          updatedAt: new Date(),
          // AI metadata
          createdByAI: true,
          aiCommand: this.currentCommand || undefined,
          aiSessionId: this.sessionId,
        };

        this.onCreateObject(circle);

        // Record for undo (if callback provided)
        if (this.onRecordCreate && this.currentOperationId) {
          this.onRecordCreate([circle], "ai", this.currentOperationId);
        }

        return {
          type: "create",
          objectId: id,
          success: true,
          message: `✓ Created ${args.fill ? args.fill : "matcha"} circle at (${
            args.x
          }, ${args.y})`,
        };
      }

      return {
        type: "create",
        success: false,
        message: `Unknown shape type: ${args.type}`,
      };
    } catch (error) {
      return {
        type: "create",
        success: false,
        message: `Failed to create shape: ${
          error instanceof Error ? error.message : "Unknown error"
        }`,
      };
    }
  }

  /**
   * Execute createText function
   */
  private executeCreateText(args: {
    text: string;
    x: number;
    y: number;
    fontSize?: number;
    fontFamily?: string;
    fontStyle?: "normal" | "bold" | "italic" | "bold italic";
    fill?: string;
    rotation?: number;
  }): AIAction {
    try {
      const id = crypto.randomUUID();
      const zIndex = this.getNextZIndex();

      // Validate boundaries
      if (
        args.x < 0 ||
        args.x > CANVAS_WIDTH ||
        args.y < 0 ||
        args.y > CANVAS_HEIGHT
      ) {
        return {
          type: "create",
          success: false,
          message: `Position (${args.x}, ${args.y}) is outside canvas boundaries`,
        };
      }

      const textObject: Text = {
        id,
        type: "text",
        userId: this.userId,
        x: args.x,
        y: args.y,
        text: args.text,
        fontSize: args.fontSize || DEFAULT_FONT_SIZE,
        fontFamily: args.fontFamily || DEFAULT_FONT_FAMILY,
        fontStyle: args.fontStyle || "normal",
        fill: args.fill || DEFAULT_TEXT_FILL,
        rotation: args.rotation || 0,
        zIndex,
        createdAt: new Date(),
        updatedAt: new Date(),
        // AI metadata
        createdByAI: true,
        aiCommand: this.currentCommand || undefined,
        aiSessionId: this.sessionId,
      };

      this.onCreateObject(textObject);

      // Record for undo (if callback provided)
      if (this.onRecordCreate && this.currentOperationId) {
        this.onRecordCreate([textObject], "ai", this.currentOperationId);
      }

      return {
        type: "create",
        objectId: id,
        success: true,
        message: `✓ Created text "${args.text}" at (${args.x}, ${args.y})`,
      };
    } catch (error) {
      return {
        type: "create",
        success: false,
        message: `Failed to create text: ${
          error instanceof Error ? error.message : "Unknown error"
        }`,
      };
    }
  }

  /**
   * Execute moveObject function
   */
  private executeMoveObject(args: {
    objectId: string;
    x: number;
    y: number;
  }): AIAction {
    try {
      // Find object by ID or description
      const objects = this.findObjectByDescription(args.objectId);

      if (objects.length === 0) {
        return {
          type: "update",
          success: false,
          message: `Could not find object: ${args.objectId}`,
        };
      }

      if (objects.length > 1) {
        return {
          type: "update",
          success: false,
          message: `Found ${objects.length} objects matching "${args.objectId}". Please be more specific.`,
        };
      }

      const object = objects[0];

      // Validate boundaries
      if (
        args.x < 0 ||
        args.x > CANVAS_WIDTH ||
        args.y < 0 ||
        args.y > CANVAS_HEIGHT
      ) {
        return {
          type: "update",
          success: false,
          message: `Position (${args.x}, ${args.y}) is outside canvas boundaries`,
        };
      }

      // Update position based on object type
      if (object.type === "line") {
        // For lines, calculate offset and apply to both points
        const currentX = object.points[0];
        const currentY = object.points[1];
        const offsetX = args.x - currentX;
        const offsetY = args.y - currentY;

        this.onUpdateObject(object.id, {
          points: [
            object.points[0] + offsetX,
            object.points[1] + offsetY,
            object.points[2] + offsetX,
            object.points[3] + offsetY,
          ],
          updatedAt: new Date(),
        });
      } else {
        this.onUpdateObject(object.id, {
          x: args.x,
          y: args.y,
          updatedAt: new Date(),
        });
      }

      return {
        type: "update",
        objectId: object.id,
        success: true,
        message: `✓ Moved ${object.type} to (${args.x}, ${args.y})`,
      };
    } catch (error) {
      return {
        type: "update",
        success: false,
        message: `Failed to move object: ${
          error instanceof Error ? error.message : "Unknown error"
        }`,
      };
    }
  }

  /**
   * Execute resizeObject function
   */
  private executeResizeObject(args: {
    objectId: string;
    width?: number;
    height?: number;
    radius?: number;
  }): AIAction {
    try {
      const objects = this.findObjectByDescription(args.objectId);

      if (objects.length === 0) {
        return {
          type: "update",
          success: false,
          message: `Could not find object: ${args.objectId}`,
        };
      }

      if (objects.length > 1) {
        return {
          type: "update",
          success: false,
          message: `Found ${objects.length} objects matching "${args.objectId}". Please be more specific.`,
        };
      }

      const object = objects[0];

      if (object.type === "rectangle") {
        const updates: Partial<Rectangle> = { updatedAt: new Date() };
        if (args.width !== undefined)
          updates.width = Math.max(10, Math.min(args.width, CANVAS_WIDTH));
        if (args.height !== undefined)
          updates.height = Math.max(10, Math.min(args.height, CANVAS_HEIGHT));
        this.onUpdateObject(object.id, updates);
      } else if (object.type === "circle") {
        const updates: Partial<Circle> = { updatedAt: new Date() };
        if (args.radius !== undefined)
          updates.radius = Math.max(5, Math.min(args.radius, CANVAS_WIDTH / 2));
        this.onUpdateObject(object.id, updates);
      } else {
        return {
          type: "update",
          success: false,
          message: `Cannot resize ${object.type} objects`,
        };
      }

      return {
        type: "update",
        objectId: object.id,
        success: true,
        message: `✓ Resized ${object.type}`,
      };
    } catch (error) {
      return {
        type: "update",
        success: false,
        message: `Failed to resize object: ${
          error instanceof Error ? error.message : "Unknown error"
        }`,
      };
    }
  }

  /**
   * Execute rotateObject function
   */
  private executeRotateObject(args: {
    objectId: string;
    degrees: number;
  }): AIAction {
    try {
      const objects = this.findObjectByDescription(args.objectId);

      if (objects.length === 0) {
        return {
          type: "update",
          success: false,
          message: `Could not find object: ${args.objectId}`,
        };
      }

      if (objects.length > 1) {
        return {
          type: "update",
          success: false,
          message: `Found ${objects.length} objects matching "${args.objectId}". Please be more specific.`,
        };
      }

      const object = objects[0];

      // Normalize rotation to 0-360
      const currentRotation = object.rotation || 0;
      const newRotation =
        (((currentRotation + args.degrees) % 360) + 360) % 360;

      this.onUpdateObject(object.id, {
        rotation: newRotation,
        updatedAt: new Date(),
      });

      return {
        type: "update",
        objectId: object.id,
        success: true,
        message: `✓ Rotated ${object.type} by ${args.degrees}° (now at ${newRotation}°)`,
      };
    } catch (error) {
      return {
        type: "update",
        success: false,
        message: `Failed to rotate object: ${
          error instanceof Error ? error.message : "Unknown error"
        }`,
      };
    }
  }

  /**
   * Execute deleteObject function
   */
  private executeDeleteObject(args: { objectId: string }): AIAction {
    try {
      const objects = this.findObjectByDescription(args.objectId);

      if (objects.length === 0) {
        return {
          type: "delete",
          success: false,
          message: `Could not find object: ${args.objectId}`,
        };
      }

      if (objects.length > 1) {
        return {
          type: "delete",
          success: false,
          message: `Found ${objects.length} objects matching "${args.objectId}". Please be more specific.`,
        };
      }

      const object = objects[0];

      // Record for undo BEFORE deletion (need object data)
      if (this.onRecordDelete && this.currentOperationId) {
        this.onRecordDelete([object], "ai", this.currentOperationId);
      }

      this.onDeleteObject(object.id);

      return {
        type: "delete",
        objectId: object.id,
        success: true,
        message: `✓ Deleted ${object.type}`,
      };
    } catch (error) {
      return {
        type: "delete",
        success: false,
        message: `Failed to delete object: ${
          error instanceof Error ? error.message : "Unknown error"
        }`,
      };
    }
  }

  /**
   * Execute arrangeObjects function
   */
  private executeArrangeObjects(args: {
    objectIds: string[];
    layout: "horizontal" | "vertical" | "grid";
    spacing?: number;
    startX?: number;
    startY?: number;
    columns?: number;
  }): AIAction {
    try {
      // Resolve object IDs (might be descriptions)
      const objects: CanvasObject[] = [];
      for (const id of args.objectIds) {
        const found = this.findObjectByDescription(id);
        objects.push(...found);
      }

      if (objects.length === 0) {
        return {
          type: "arrange",
          success: false,
          message: `Could not find any objects to arrange`,
        };
      }

      const spacing = args.spacing || 20;
      const startX = args.startX || 100;
      const startY = args.startY || 100;

      if (args.layout === "horizontal") {
        let currentX = startX;
        objects.forEach((obj) => {
          if (obj.type === "line") {
            const width = Math.abs(obj.points[2] - obj.points[0]);
            const offsetX = currentX - obj.points[0];
            this.onUpdateObject(obj.id, {
              points: [
                obj.points[0] + offsetX,
                startY,
                obj.points[2] + offsetX,
                startY + Math.abs(obj.points[3] - obj.points[1]),
              ],
              updatedAt: new Date(),
            });
            currentX += width + spacing;
          } else {
            this.onUpdateObject(obj.id, {
              x: currentX,
              y: startY,
              updatedAt: new Date(),
            });
            const width =
              obj.type === "rectangle"
                ? obj.width
                : obj.type === "circle"
                ? obj.radius * 2
                : 100;
            currentX += width + spacing;
          }
        });
      } else if (args.layout === "vertical") {
        let currentY = startY;
        objects.forEach((obj) => {
          if (obj.type === "line") {
            const height = Math.abs(obj.points[3] - obj.points[1]);
            const offsetY = currentY - obj.points[1];
            this.onUpdateObject(obj.id, {
              points: [
                startX,
                obj.points[1] + offsetY,
                startX + Math.abs(obj.points[2] - obj.points[0]),
                obj.points[3] + offsetY,
              ],
              updatedAt: new Date(),
            });
            currentY += height + spacing;
          } else {
            this.onUpdateObject(obj.id, {
              x: startX,
              y: currentY,
              updatedAt: new Date(),
            });
            const height =
              obj.type === "rectangle"
                ? obj.height
                : obj.type === "circle"
                ? obj.radius * 2
                : 100;
            currentY += height + spacing;
          }
        });
      } else if (args.layout === "grid") {
        const columns = args.columns || 3;
        let col = 0;
        let row = 0;
        const cellWidth = 150;
        const cellHeight = 150;

        objects.forEach((obj) => {
          const x = startX + col * (cellWidth + spacing);
          const y = startY + row * (cellHeight + spacing);

          if (obj.type === "line") {
            const width = Math.abs(obj.points[2] - obj.points[0]);
            const height = Math.abs(obj.points[3] - obj.points[1]);
            this.onUpdateObject(obj.id, {
              points: [x, y, x + width, y + height],
              updatedAt: new Date(),
            });
          } else {
            this.onUpdateObject(obj.id, { x, y, updatedAt: new Date() });
          }

          col++;
          if (col >= columns) {
            col = 0;
            row++;
          }
        });
      }

      return {
        type: "arrange",
        success: true,
        message: `✓ Arranged ${objects.length} objects in ${args.layout} layout`,
      };
    } catch (error) {
      return {
        type: "arrange",
        success: false,
        message: `Failed to arrange objects: ${
          error instanceof Error ? error.message : "Unknown error"
        }`,
      };
    }
  }

  /**
   * Execute createComplexLayout function
   */
  private executeCreateComplexLayout(args: {
    layoutType:
      | "loginForm"
      | "navigationBar"
      | "card"
      | "buttonGroup"
      | "dashboard";
    x?: number;
    y?: number;
    config?: any;
  }): AIAction {
    try {
      const x = args.x || 500;
      const y = args.y || 400;
      const config = args.config || {};

      let objects: CanvasObject[] = [];

      switch (args.layoutType) {
        case "loginForm":
          objects = generateLoginForm(x, y, this.userId, this.getNextZIndex);
          break;
        case "navigationBar":
          objects = generateNavigationBar(
            x,
            y,
            this.userId,
            this.getNextZIndex,
            config
          );
          break;
        case "card":
          objects = generateCard(x, y, this.userId, this.getNextZIndex, config);
          break;
        case "buttonGroup":
          objects = generateButtonGroup(
            x,
            y,
            this.userId,
            this.getNextZIndex,
            config
          );
          break;
        case "dashboard":
          objects = generateDashboard(
            x,
            y,
            this.userId,
            this.getNextZIndex,
            config
          );
          break;
        default:
          return {
            type: "create",
            success: false,
            message: `Unknown layout type: ${args.layoutType}`,
          };
      }

      // Limit objects per command
      if (objects.length > MAX_OBJECTS_PER_COMMAND) {
        return {
          type: "create",
          success: false,
          message: `Layout would create ${objects.length} objects, but maximum is ${MAX_OBJECTS_PER_COMMAND} per command`,
        };
      }

      // Add AI metadata to all objects
      const objectsWithMetadata = objects.map((obj) => ({
        ...obj,
        createdByAI: true,
        aiCommand: this.currentCommand || undefined,
        aiSessionId: this.sessionId,
      }));

      // Create all objects
      objectsWithMetadata.forEach((obj) => this.onCreateObject(obj));

      // Record for undo (if callback provided) - group all objects as one undo action
      if (this.onRecordCreate && this.currentOperationId) {
        this.onRecordCreate(objectsWithMetadata, "ai", this.currentOperationId);
      }

      return {
        type: "create",
        success: true,
        message: `✓ Created ${args.layoutType} with ${objects.length} elements`,
      };
    } catch (error) {
      return {
        type: "create",
        success: false,
        message: `Failed to create layout: ${
          error instanceof Error ? error.message : "Unknown error"
        }`,
      };
    }
  }

  /**
   * Execute getCanvasState function
   */
  private executeGetCanvasState(args: { filter?: string }): AIAction {
    try {
      const context = this.getCanvasContext();
      let message = `Canvas has ${context.objects.length} objects`;

      if (args.filter) {
        if (args.filter === "selected") {
          message = `${context.selection.length} objects selected`;
        } else if (args.filter.startsWith("type:")) {
          const type = args.filter.split(":")[1];
          const count = context.objects.filter(
            (obj) => obj.type === type
          ).length;
          message = `${count} ${type} objects on canvas`;
        }
      }

      return {
        type: "query",
        success: true,
        message: `✓ ${message}`,
      };
    } catch (error) {
      return {
        type: "query",
        success: false,
        message: `Failed to get canvas state: ${
          error instanceof Error ? error.message : "Unknown error"
        }`,
      };
    }
  }
}
