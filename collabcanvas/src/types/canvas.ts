export interface Point {
  x: number;
  y: number;
}

export interface CanvasObject {
  id: string;
  type: "rectangle";
  x: number;
  y: number;
  width: number;
  height: number;
  fill: string;
  stroke: string;
  strokeWidth: number;
  userId: string;
  createdAt: Date;
  updatedAt?: Date;
}

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
