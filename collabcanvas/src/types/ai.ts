import { CanvasObject } from "./canvas";

/**
 * AI Canvas Agent Type Definitions
 * Based on AI Canvas Agent PRD v1.0
 */

// AI Client Response
export interface AIResponse {
  success: boolean;
  message: string;
  actions?: AIAction[];
  error?: string;
  functionCalls?: AIFunctionCall[];
}

// Individual AI action result
export interface AIAction {
  type: "create" | "update" | "delete" | "query" | "arrange";
  objectId?: string;
  success: boolean;
  message: string;
}

// OpenAI function call structure
export interface AIFunctionCall {
  id: string;
  type: "function";
  function: {
    name: string;
    arguments: string; // JSON string
  };
}

// AI Operation for history tracking
export interface AIOperation {
  id: string;
  userId: string;
  command: string;
  timestamp: Date;
  sessionId: string;
  success: boolean;
  objectsCreated: string[]; // Object IDs
  objectsModified: string[]; // Object IDs
  objectsDeleted: string[]; // Object IDs
  executionTimeMs: number;
  error?: string;
}

// Canvas context for AI
export interface CanvasContext {
  timestamp: string;
  canvasInfo: {
    width: number;
    height: number;
    objectCount: number;
    gridSize: number;
  };
  objects: CanvasContextObject[];
  selection: string[];
  viewport: {
    scale: number;
    position: { x: number; y: number };
  };
}

// Simplified object representation for AI context
export interface CanvasContextObject {
  id: string;
  type: "rectangle" | "circle" | "line" | "text";
  position: { x: number; y: number };
  dimensions?: {
    width?: number;
    height?: number;
    radius?: number;
  };
  properties: {
    fill?: string;
    stroke?: string;
    text?: string;
    fontSize?: number;
    rotation?: number;
    zIndex: number;
  };
  metadata: {
    createdBy: string;
    createdByAI?: boolean;
    createdAt: string;
    lastModified?: string;
  };
}

// AI Chat Message
export interface AIChatMessage {
  id: string;
  role: "user" | "assistant" | "system";
  content: string;
  timestamp: Date;
  status?: "pending" | "success" | "error";
  actions?: AIAction[];
}

// AI Tool/Function definitions for OpenAI
export interface AITool {
  type: "function";
  function: {
    name: string;
    description: string;
    parameters: {
      type: "object";
      properties: Record<string, unknown>;
      required: string[];
    };
  };
}

// Undo operation for AI
export interface UndoOperation {
  id: string;
  type: "create" | "update" | "delete";
  timestamp: Date;
  source: "ai" | "manual";
  aiOperationId?: string; // Link to AI operation if AI-generated
  affectedObjectIds: string[];
  previousState?: CanvasObject[]; // For undo
  newState?: CanvasObject[]; // For redo
}

// AI Session tracking
export interface AISession {
  id: string;
  userId: string;
  startedAt: Date;
  endedAt?: Date;
  commandCount: number;
  successCount: number;
  errorCount: number;
}

// Configuration for AI Agent
export interface AIAgentConfig {
  userId: string;
  apiKey?: string;
  temperature?: number;
  maxTokens?: number;
  model?: string;
  onCreateObject?: (object: CanvasObject) => void;
  onUpdateObject?: (id: string, updates: Partial<CanvasObject>) => void;
  onDeleteObject?: (id: string) => void;
}

// Object reference types for natural language
export type ObjectReference =
  | { type: "color"; value: string }
  | {
      type: "position";
      value:
        | "center"
        | "top-left"
        | "top-right"
        | "bottom-left"
        | "bottom-right";
    }
  | { type: "size"; value: "largest" | "smallest" }
  | { type: "objectType"; value: "rectangle" | "circle" | "line" | "text" }
  | { type: "text"; value: string }
  | { type: "id"; value: string };
