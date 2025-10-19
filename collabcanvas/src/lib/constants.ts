// Canvas constants
export const CANVAS_SIZE = {
  width: 8000,
  height: 8000,
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
  fontSize: 256, // 8x larger for 8000x8000 canvas for better visibility
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
export const OBJECT_UPDATE_THROTTLE = 50; // Reduced from 100ms to 50ms (20 FPS) for faster sync
export const PRESENCE_TIMEOUT = 60000; // 60 seconds - users offline longer than this are removed (with 10s heartbeat, gives 6x buffer)
export const PRESENCE_CLEANUP_INTERVAL = 15000; // 15 seconds - how often to check for stale presence

// Object lock settings for collaborative editing
export const LOCK_SELECTION_TTL_SEC = 10; // Brief "highlight only" hold - expires if user goes idle
export const LOCK_EDIT_TTL_SEC = 20; // Longer while actively editing (drag, resize, transform)
export const LOCK_RENEW_INTERVAL_MS = 5000; // How often to renew lock while actively editing
