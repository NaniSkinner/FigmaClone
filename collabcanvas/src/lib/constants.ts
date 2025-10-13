// Canvas constants
export const CANVAS_SIZE = {
  width: 2000,
  height: 2000,
};

export const ZOOM_LIMITS = {
  min: 0.1,
  max: 2.0,
};

// Object styling
export const DEFAULT_RECTANGLE_STYLE = {
  fill: "#D4E7C5", // Matcha latte
  stroke: "#B4A7D6", // Lavender purple
  strokeWidth: 2,
};

// User colors for cursor and presence
export const USER_COLORS = [
  "#FF6B6B",
  "#4ECDC4",
  "#45B7D1",
  "#96CEB4",
  "#FFEAA7",
  "#DDA15E",
  "#BC6C25",
  "#A8DADC",
  "#E63946",
  "#F1FAEE",
];

// Real-time sync settings
export const CURSOR_UPDATE_THROTTLE = 50; // 20 FPS
export const OBJECT_UPDATE_THROTTLE = 100; // 10 FPS
export const PRESENCE_TIMEOUT = 30000; // 30 seconds
