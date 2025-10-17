export interface Point {
  x: number;
  y: number;
}

// Shape type enum
export type ShapeType = "rectangle" | "circle" | "line" | "text";

// Object lock for collaborative editing
export interface ObjectLock {
  userId: string;
  userName?: string;
  userColor?: string;
  acquiredAt?: Date; // server timestamp
  expiresAt: Date; // absolute expiry time (short TTL)
}

// Base interface for common properties
interface BaseCanvasObject {
  id: string;
  userId: string;
  createdAt: Date;
  updatedAt?: Date;
  zIndex: number; // Layer order (higher = on top)
  visible?: boolean; // Visibility state (default: true)
  locked?: boolean; // Lock state (default: false)
  lock?: ObjectLock; // Soft lock for collaborative editing
  // AI metadata (optional - only present for AI-created objects)
  createdByAI?: boolean; // Whether object was created by AI agent
  aiCommand?: string; // Original natural language command
  aiSessionId?: string; // Session ID for grouping related AI operations
}

// Rectangle shape
export interface Rectangle extends BaseCanvasObject {
  type: "rectangle";
  x: number;
  y: number;
  width: number;
  height: number;
  fill: string;
  stroke: string;
  strokeWidth: number;
  rotation?: number; // in degrees
}

// Circle shape
export interface Circle extends BaseCanvasObject {
  type: "circle";
  x: number; // center x
  y: number; // center y
  radius: number;
  fill: string;
  stroke: string;
  strokeWidth: number;
  rotation?: number; // in degrees
}

// Line shape
export interface Line extends BaseCanvasObject {
  type: "line";
  points: [number, number, number, number]; // [x1, y1, x2, y2]
  stroke: string;
  strokeWidth: number;
  rotation?: number; // in degrees
}

// Text object
export interface Text extends BaseCanvasObject {
  type: "text";
  x: number;
  y: number;
  text: string;
  fontSize: number;
  fontFamily: string;
  fontStyle?: "normal" | "bold" | "italic" | "bold italic";
  fill: string;
  width?: number; // auto-width initially
  rotation?: number; // in degrees
}

// Union type for all canvas objects
export type CanvasObject = Rectangle | Circle | Line | Text;

export interface CanvasState {
  id: string;
  scale: number;
  position: Point;
  objects: CanvasObject[];
}

export interface Viewport {
  x: number;
  y: number;
  scale: number;
}

// Selection box for drag-to-select
export interface SelectionBox {
  startX: number;
  startY: number;
  currentX: number;
  currentY: number;
}
