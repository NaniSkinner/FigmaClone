export interface Point {
  x: number;
  y: number;
}

// Shape type enum
export type ShapeType = "rectangle" | "circle" | "line" | "text" | "image";

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
  align?: "left" | "center" | "right"; // text alignment
  rotation?: number; // in degrees
  // Birthday text metadata (AI-generated)
  birthdayText?: boolean;
  birthdayStyle?: string;
  birthdayTemplate?: string;
  aiGenerated?: boolean;
  aiCost?: number;
}

// Image filter types
export type ImageFilter =
  | { type: "brightness"; value: number } // -1 to 1
  | { type: "contrast"; value: number } // -100 to 100
  | { type: "grayscale" }
  | { type: "blur"; radius: number }; // 0-40

// Image object
export interface ImageObject extends BaseCanvasObject {
  type: "image";

  // Storage
  src: string; // Firebase Storage URL
  thumbnailSrc?: string; // Base64 thumbnail (~20KB, 256x256)

  // Dimensions & Transform
  x: number; // Canvas position
  y: number;
  width: number; // Display dimensions
  height: number;
  rotation?: number; // Degrees (0-360)

  // Appearance
  opacity?: number; // 0-1 (default: 1)
  scaleX?: number; // Flip horizontal: -1, normal: 1
  scaleY?: number; // Flip vertical: -1, normal: 1
  filters?: ImageFilter[];

  // Original Metadata
  naturalWidth: number; // Original image dimensions
  naturalHeight: number;
  fileSize?: number; // Bytes (for analytics)
  mimeType?: string; // 'image/jpeg' | 'image/png' | 'image/webp' | 'image/gif'

  // Image Source Type
  subType?: "decorative" | "upload" | "ai-generated";

  // Decorative Items Metadata (for decorative SVG stickers)
  decorativeItemId?: string; // Reference to decorative item in library
  category?: string; // Category: balloons, axolotl, matcha, hockey, animals
  originalName?: string; // Original name from library

  // AI Generation Metadata (for Ghibli-transformed images)
  aiGenerated?: boolean;
  aiSourceImageId?: string; // ID of the original image that was transformed
  aiStyle?: "anime" | "ghibli" | "spirited_away" | "totoro";
  aiPromptUsed?: string;
  aiGeneratedAt?: Date;
  aiCost?: number; // USD cost of generation

  // Birthday Enhancement Metadata (for DALL-E enhanced text)
  birthdayEnhancement?: boolean;
  enhancementStyle?: "3d_bubble" | "cartoon_inflated";
  sourceText?: string; // The text that was enhanced
  aiDescription?: string; // GPT-4 Vision description
}

// Union type for all canvas objects
export type CanvasObject = Rectangle | Circle | Line | Text | ImageObject;

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
