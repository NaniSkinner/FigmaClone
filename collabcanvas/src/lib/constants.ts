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
  fill: "#7BA05B", // Darker matcha green
  stroke: "#8B5CF6", // Brighter purple
  strokeWidth: 3,
};

export const DEFAULT_CIRCLE_STYLE = {
  fill: "#7BA05B", // Darker matcha green
  stroke: "#8B5CF6", // Brighter purple
  strokeWidth: 3,
};

export const DEFAULT_LINE_STYLE = {
  stroke: "#8B5CF6", // Brighter purple
  strokeWidth: 6,
};

export const DEFAULT_TEXT_STYLE = {
  fill: "#1F2937", // Dark gray
  fontSize: 16,
  fontFamily: "Arial",
};

// User colors for cursor and presence (darker, more vibrant colors)
export const USER_COLORS = [
  "#B91C1C", // Dark red
  "#6B8E4E", // Dark matcha green
  "#1E40AF", // Deep blue
  "#6B21A8", // Dark purple
  "#C2410C", // Dark orange
  "#BE185D", // Deep pink
  "#581C87", // Deeper purple
  "#15803D", // Dark forest green
  "#7E22CE", // Rich purple
  "#A16207", // Dark gold
];

// Real-time sync settings
export const CURSOR_UPDATE_THROTTLE = 50; // 20 FPS
export const OBJECT_UPDATE_THROTTLE = 100; // 10 FPS
export const PRESENCE_TIMEOUT = 30000; // 30 seconds
