/**
 * Complex Layout Generators
 *
 * Predefined templates for common UI components that the AI can create.
 * Each generator returns an array of CanvasObjects ready to be added.
 *
 * Reference: aiPRD.md Section 12.1 - Example Complex Layout
 * Reference: aiTasks.md Task 7 - Complex Layout Templates
 */

import { CanvasObject, Rectangle, Text } from "@/types/canvas";

// Default colors from PRD
const MATCHA = "#D4E7C5";
const LAVENDER = "#B4A7D6";
const DARK_GRAY = "#1F2937";
const LIGHT_GRAY = "#F5F5F5";
const WHITE = "#FFFFFF";

/**
 * Generate a login form layout
 *
 * Structure (from PRD Section 12.1):
 * - Container rectangle (300x450)
 * - Title text "Login"
 * - Username label and input field
 * - Password label and input field
 * - Remember me checkbox with label
 * - Submit button with text
 */
export function generateLoginForm(
  x: number,
  y: number,
  userId: string,
  getNextZIndex: () => number
): CanvasObject[] {
  const objects: CanvasObject[] = [];
  const now = new Date();

  // Container
  objects.push({
    id: crypto.randomUUID(),
    type: "rectangle",
    userId,
    x,
    y,
    width: 300,
    height: 450,
    fill: WHITE,
    stroke: DARK_GRAY,
    strokeWidth: 2,
    zIndex: getNextZIndex(),
    createdAt: now,
    updatedAt: now,
  } as Rectangle);

  // Title
  objects.push({
    id: crypto.randomUUID(),
    type: "text",
    userId,
    x: x + 150,
    y: y + 30,
    text: "Login",
    fontSize: 24,
    fontFamily: "Arial",
    fontStyle: "bold",
    fill: DARK_GRAY,
    zIndex: getNextZIndex(),
    createdAt: now,
    updatedAt: now,
  } as Text);

  // Username label
  objects.push({
    id: crypto.randomUUID(),
    type: "text",
    userId,
    x: x + 20,
    y: y + 90,
    text: "Username",
    fontSize: 14,
    fontFamily: "Arial",
    fill: DARK_GRAY,
    zIndex: getNextZIndex(),
    createdAt: now,
    updatedAt: now,
  } as Text);

  // Username input field
  objects.push({
    id: crypto.randomUUID(),
    type: "rectangle",
    userId,
    x: x + 20,
    y: y + 110,
    width: 260,
    height: 40,
    fill: LIGHT_GRAY,
    stroke: DARK_GRAY,
    strokeWidth: 1,
    zIndex: getNextZIndex(),
    createdAt: now,
    updatedAt: now,
  } as Rectangle);

  // Password label
  objects.push({
    id: crypto.randomUUID(),
    type: "text",
    userId,
    x: x + 20,
    y: y + 170,
    text: "Password",
    fontSize: 14,
    fontFamily: "Arial",
    fill: DARK_GRAY,
    zIndex: getNextZIndex(),
    createdAt: now,
    updatedAt: now,
  } as Text);

  // Password input field
  objects.push({
    id: crypto.randomUUID(),
    type: "rectangle",
    userId,
    x: x + 20,
    y: y + 190,
    width: 260,
    height: 40,
    fill: LIGHT_GRAY,
    stroke: DARK_GRAY,
    strokeWidth: 1,
    zIndex: getNextZIndex(),
    createdAt: now,
    updatedAt: now,
  } as Rectangle);

  // Remember me checkbox
  objects.push({
    id: crypto.randomUUID(),
    type: "rectangle",
    userId,
    x: x + 20,
    y: y + 250,
    width: 20,
    height: 20,
    fill: WHITE,
    stroke: DARK_GRAY,
    strokeWidth: 2,
    zIndex: getNextZIndex(),
    createdAt: now,
    updatedAt: now,
  } as Rectangle);

  // Remember me label
  objects.push({
    id: crypto.randomUUID(),
    type: "text",
    userId,
    x: x + 50,
    y: y + 255,
    text: "Remember me",
    fontSize: 12,
    fontFamily: "Arial",
    fill: DARK_GRAY,
    zIndex: getNextZIndex(),
    createdAt: now,
    updatedAt: now,
  } as Text);

  // Submit button
  objects.push({
    id: crypto.randomUUID(),
    type: "rectangle",
    userId,
    x: x + 20,
    y: y + 300,
    width: 260,
    height: 45,
    fill: MATCHA,
    stroke: LAVENDER,
    strokeWidth: 2,
    zIndex: getNextZIndex(),
    createdAt: now,
    updatedAt: now,
  } as Rectangle);

  // Submit button text
  objects.push({
    id: crypto.randomUUID(),
    type: "text",
    userId,
    x: x + 125,
    y: y + 315,
    text: "Sign In",
    fontSize: 16,
    fontFamily: "Arial",
    fontStyle: "bold",
    fill: DARK_GRAY,
    zIndex: getNextZIndex(),
    createdAt: now,
    updatedAt: now,
  } as Text);

  return objects;
}

/**
 * Generate a navigation bar layout
 *
 * Structure:
 * - Background rectangle (full width)
 * - Logo text
 * - Menu items with even spacing
 */
export function generateNavigationBar(
  x: number,
  y: number,
  userId: string,
  getNextZIndex: () => number,
  config: { items?: string[]; width?: number } = {}
): CanvasObject[] {
  const objects: CanvasObject[] = [];
  const now = new Date();
  const width = config.width || 800;
  const items = config.items || ["Home", "About", "Services", "Contact"];

  // Background
  objects.push({
    id: crypto.randomUUID(),
    type: "rectangle",
    userId,
    x,
    y,
    width,
    height: 60,
    fill: MATCHA,
    stroke: LAVENDER,
    strokeWidth: 2,
    zIndex: getNextZIndex(),
    createdAt: now,
    updatedAt: now,
  } as Rectangle);

  // Logo
  objects.push({
    id: crypto.randomUUID(),
    type: "text",
    userId,
    x: x + 20,
    y: y + 25,
    text: "Logo",
    fontSize: 20,
    fontFamily: "Arial",
    fontStyle: "bold",
    fill: DARK_GRAY,
    zIndex: getNextZIndex(),
    createdAt: now,
    updatedAt: now,
  } as Text);

  // Menu items
  const menuStartX = x + width - items.length * 100;
  items.forEach((item, index) => {
    objects.push({
      id: crypto.randomUUID(),
      type: "text",
      userId,
      x: menuStartX + index * 100,
      y: y + 25,
      text: item,
      fontSize: 16,
      fontFamily: "Arial",
      fill: DARK_GRAY,
      zIndex: getNextZIndex(),
      createdAt: now,
      updatedAt: now,
    } as Text);
  });

  return objects;
}

/**
 * Generate a card component layout
 *
 * Structure:
 * - Container rectangle
 * - Image placeholder rectangle
 * - Title text
 * - Description text
 * - Action button
 */
export function generateCard(
  x: number,
  y: number,
  userId: string,
  getNextZIndex: () => number,
  config: {
    title?: string;
    description?: string;
    width?: number;
    height?: number;
  } = {}
): CanvasObject[] {
  const objects: CanvasObject[] = [];
  const now = new Date();
  const width = config.width || 280;
  const height = config.height || 380;
  const title = config.title || "Card Title";
  const description = config.description || "Card description goes here";

  // Container
  objects.push({
    id: crypto.randomUUID(),
    type: "rectangle",
    userId,
    x,
    y,
    width,
    height,
    fill: WHITE,
    stroke: DARK_GRAY,
    strokeWidth: 2,
    zIndex: getNextZIndex(),
    createdAt: now,
    updatedAt: now,
  } as Rectangle);

  // Image placeholder
  objects.push({
    id: crypto.randomUUID(),
    type: "rectangle",
    userId,
    x: x + 10,
    y: y + 10,
    width: width - 20,
    height: 160,
    fill: LIGHT_GRAY,
    stroke: DARK_GRAY,
    strokeWidth: 1,
    zIndex: getNextZIndex(),
    createdAt: now,
    updatedAt: now,
  } as Rectangle);

  // Title
  objects.push({
    id: crypto.randomUUID(),
    type: "text",
    userId,
    x: x + 20,
    y: y + 190,
    text: title,
    fontSize: 20,
    fontFamily: "Arial",
    fontStyle: "bold",
    fill: DARK_GRAY,
    zIndex: getNextZIndex(),
    createdAt: now,
    updatedAt: now,
  } as Text);

  // Description
  objects.push({
    id: crypto.randomUUID(),
    type: "text",
    userId,
    x: x + 20,
    y: y + 230,
    text: description,
    fontSize: 14,
    fontFamily: "Arial",
    fill: DARK_GRAY,
    zIndex: getNextZIndex(),
    createdAt: now,
    updatedAt: now,
  } as Text);

  // Action button
  objects.push({
    id: crypto.randomUUID(),
    type: "rectangle",
    userId,
    x: x + 20,
    y: y + height - 60,
    width: width - 40,
    height: 40,
    fill: MATCHA,
    stroke: LAVENDER,
    strokeWidth: 2,
    zIndex: getNextZIndex(),
    createdAt: now,
    updatedAt: now,
  } as Rectangle);

  // Button text
  objects.push({
    id: crypto.randomUUID(),
    type: "text",
    userId,
    x: x + width / 2 - 30,
    y: y + height - 45,
    text: "Learn More",
    fontSize: 14,
    fontFamily: "Arial",
    fontStyle: "bold",
    fill: DARK_GRAY,
    zIndex: getNextZIndex(),
    createdAt: now,
    updatedAt: now,
  } as Text);

  return objects;
}

/**
 * Generate a button group layout
 *
 * Structure:
 * - Multiple buttons in horizontal arrangement
 * - Consistent sizing and spacing
 */
export function generateButtonGroup(
  x: number,
  y: number,
  userId: string,
  getNextZIndex: () => number,
  config: { items?: string[] } = {}
): CanvasObject[] {
  const objects: CanvasObject[] = [];
  const now = new Date();
  const items = config.items || ["Save", "Cancel", "Delete"];
  const buttonWidth = 120;
  const buttonHeight = 40;
  const spacing = 15;

  items.forEach((label, index) => {
    const buttonX = x + index * (buttonWidth + spacing);

    // Button background
    objects.push({
      id: crypto.randomUUID(),
      type: "rectangle",
      userId,
      x: buttonX,
      y,
      width: buttonWidth,
      height: buttonHeight,
      fill:
        index === 0
          ? MATCHA
          : index === items.length - 1
          ? "#FF6B6B"
          : LIGHT_GRAY,
      stroke: DARK_GRAY,
      strokeWidth: 2,
      zIndex: getNextZIndex(),
      createdAt: now,
      updatedAt: now,
    } as Rectangle);

    // Button text
    objects.push({
      id: crypto.randomUUID(),
      type: "text",
      userId,
      x: buttonX + buttonWidth / 2 - 20,
      y: y + 15,
      text: label,
      fontSize: 14,
      fontFamily: "Arial",
      fontStyle: "bold",
      fill: DARK_GRAY,
      zIndex: getNextZIndex(),
      createdAt: now,
      updatedAt: now,
    } as Text);
  });

  return objects;
}

/**
 * Generate a dashboard layout
 *
 * Structure:
 * - Header bar
 * - Sidebar
 * - Main content area
 * - Widget placeholders
 */
export function generateDashboard(
  x: number,
  y: number,
  userId: string,
  getNextZIndex: () => number,
  config: { title?: string; width?: number; height?: number } = {}
): CanvasObject[] {
  const objects: CanvasObject[] = [];
  const now = new Date();
  const width = config.width || 1000;
  const height = config.height || 700;
  const title = config.title || "Dashboard";

  // Header
  objects.push({
    id: crypto.randomUUID(),
    type: "rectangle",
    userId,
    x,
    y,
    width,
    height: 60,
    fill: MATCHA,
    stroke: LAVENDER,
    strokeWidth: 2,
    zIndex: getNextZIndex(),
    createdAt: now,
    updatedAt: now,
  } as Rectangle);

  // Header title
  objects.push({
    id: crypto.randomUUID(),
    type: "text",
    userId,
    x: x + 20,
    y: y + 25,
    text: title,
    fontSize: 24,
    fontFamily: "Arial",
    fontStyle: "bold",
    fill: DARK_GRAY,
    zIndex: getNextZIndex(),
    createdAt: now,
    updatedAt: now,
  } as Text);

  // Sidebar
  objects.push({
    id: crypto.randomUUID(),
    type: "rectangle",
    userId,
    x,
    y: y + 60,
    width: 200,
    height: height - 60,
    fill: LIGHT_GRAY,
    stroke: DARK_GRAY,
    strokeWidth: 2,
    zIndex: getNextZIndex(),
    createdAt: now,
    updatedAt: now,
  } as Rectangle);

  // Sidebar menu items
  const menuItems = ["Overview", "Analytics", "Reports", "Settings"];
  menuItems.forEach((item, index) => {
    objects.push({
      id: crypto.randomUUID(),
      type: "text",
      userId,
      x: x + 20,
      y: y + 100 + index * 40,
      text: item,
      fontSize: 16,
      fontFamily: "Arial",
      fill: DARK_GRAY,
      zIndex: getNextZIndex(),
      createdAt: now,
      updatedAt: now,
    } as Text);
  });

  // Main content area
  objects.push({
    id: crypto.randomUUID(),
    type: "rectangle",
    userId,
    x: x + 200,
    y: y + 60,
    width: width - 200,
    height: height - 60,
    fill: WHITE,
    stroke: DARK_GRAY,
    strokeWidth: 2,
    zIndex: getNextZIndex(),
    createdAt: now,
    updatedAt: now,
  } as Rectangle);

  // Widget placeholders (3 cards)
  const cardWidth = 240;
  const cardHeight = 180;
  const cardSpacing = 20;
  const cardsStartX = x + 220;
  const cardsStartY = y + 80;

  for (let i = 0; i < 3; i++) {
    const cardX = cardsStartX + i * (cardWidth + cardSpacing);

    // Widget card
    objects.push({
      id: crypto.randomUUID(),
      type: "rectangle",
      userId,
      x: cardX,
      y: cardsStartY,
      width: cardWidth,
      height: cardHeight,
      fill: MATCHA,
      stroke: LAVENDER,
      strokeWidth: 2,
      zIndex: getNextZIndex(),
      createdAt: now,
      updatedAt: now,
    } as Rectangle);

    // Widget title
    objects.push({
      id: crypto.randomUUID(),
      type: "text",
      userId,
      x: cardX + 20,
      y: cardsStartY + 20,
      text: `Widget ${i + 1}`,
      fontSize: 18,
      fontFamily: "Arial",
      fontStyle: "bold",
      fill: DARK_GRAY,
      zIndex: getNextZIndex(),
      createdAt: now,
      updatedAt: now,
    } as Text);
  }

  return objects;
}
