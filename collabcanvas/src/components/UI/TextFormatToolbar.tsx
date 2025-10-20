"use client";

import { Text as TextType } from "@/types";

interface TextFormatToolbarProps {
  textObject: TextType;
  stageScale: number;
  stagePosition: { x: number; y: number };
  onFormatChange: (updates: Partial<TextType>) => void;
}

const FONT_SIZES = [12, 14, 16, 18, 24, 32, 48, 72];

// Font families organized by category (scaled for 8000x8000 canvas)
const FONT_FAMILIES = [
  // Party Fonts (Tier 1: Bubble/Rounded)
  { value: "Fredoka One", label: "Fredoka One", category: "party" },
  { value: "Baloo 2", label: "Baloo 2", category: "party" },
  { value: "Rubik Bubbles", label: "Rubik Bubbles", category: "party" },
  { value: "Carter One", label: "Carter One", category: "party" },
  { value: "Lilita One", label: "Lilita One", category: "party" },
  // Decorative Fonts (Tier 2)
  { value: "Pacifico", label: "Pacifico", category: "decorative" },
  { value: "Righteous", label: "Righteous", category: "decorative" },
  { value: "Bungee", label: "Bungee", category: "decorative" },
  { value: "Kavoon", label: "Kavoon", category: "decorative" },
  // Standard Fonts
  { value: "Arial", label: "Arial", category: "standard" },
  { value: "Georgia", label: "Georgia", category: "standard" },
  { value: "Courier New", label: "Courier New", category: "standard" },
  { value: "Comic Sans MS", label: "Comic Sans MS", category: "standard" },
  { value: "Roboto", label: "Roboto", category: "standard" },
];

export default function TextFormatToolbar({
  textObject,
  stageScale,
  stagePosition,
  onFormatChange,
}: TextFormatToolbarProps) {
  // Calculate position above the text
  const toolbarX = textObject.x * stageScale + stagePosition.x;
  const toolbarY = textObject.y * stageScale + stagePosition.y - 50; // 50px above

  const isBold = textObject.fontStyle?.includes("bold");
  const isItalic = textObject.fontStyle?.includes("italic");

  const toggleBold = () => {
    let newStyle: TextType["fontStyle"] = textObject.fontStyle || "normal";
    if (isBold) {
      // Remove bold
      const cleaned = newStyle.replace("bold", "").trim();
      newStyle = (cleaned === "" ? "normal" : cleaned) as TextType["fontStyle"];
    } else {
      // Add bold
      if (newStyle === "normal") {
        newStyle = "bold";
      } else if (newStyle === "italic") {
        newStyle = "bold italic";
      }
    }
    onFormatChange({ fontStyle: newStyle });
  };

  const toggleItalic = () => {
    let newStyle: TextType["fontStyle"] = textObject.fontStyle || "normal";
    if (isItalic) {
      // Remove italic
      const cleaned = newStyle.replace("italic", "").trim();
      newStyle = (cleaned === "" ? "normal" : cleaned) as TextType["fontStyle"];
    } else {
      // Add italic
      if (newStyle === "normal") {
        newStyle = "italic";
      } else if (newStyle === "bold") {
        newStyle = "bold italic";
      }
    }
    onFormatChange({ fontStyle: newStyle });
  };

  return (
    <div
      style={{
        position: "fixed",
        left: `${toolbarX}px`,
        top: `${toolbarY}px`,
        zIndex: 1001,
      }}
      className="text-format-toolbar bg-white rounded-lg shadow-lg border border-gray-200 px-3 py-2 flex items-center gap-2"
      onClick={(e) => e.stopPropagation()} // Prevent canvas clicks
      onMouseDown={(e) => e.stopPropagation()} // Prevent editor close
    >
      {/* Font Size */}
      <select
        value={textObject.fontSize}
        onChange={(e) => onFormatChange({ fontSize: parseInt(e.target.value) })}
        className="text-xs border border-gray-300 rounded px-2 py-1 focus:outline-none focus:ring-2 focus:ring-purple-500"
        title="Font Size"
      >
        {FONT_SIZES.map((size) => (
          <option key={size} value={size}>
            {size}px
          </option>
        ))}
      </select>

      {/* Font Family */}
      <select
        value={textObject.fontFamily}
        onChange={(e) => onFormatChange({ fontFamily: e.target.value })}
        className="text-xs border border-gray-300 rounded px-2 py-1 focus:outline-none focus:ring-2 focus:ring-purple-500"
        title="Font Family"
      >
        <optgroup label="🎉 Party Fonts">
          {FONT_FAMILIES.filter((f) => f.category === "party").map((font) => (
            <option key={font.value} value={font.value}>
              {font.label}
            </option>
          ))}
        </optgroup>
        <optgroup label="✨ Decorative Fonts">
          {FONT_FAMILIES.filter((f) => f.category === "decorative").map(
            (font) => (
              <option key={font.value} value={font.value}>
                {font.label}
              </option>
            )
          )}
        </optgroup>
        <optgroup label="📝 Standard Fonts">
          {FONT_FAMILIES.filter((f) => f.category === "standard").map(
            (font) => (
              <option key={font.value} value={font.value}>
                {font.label}
              </option>
            )
          )}
        </optgroup>
      </select>

      <div className="w-px h-6 bg-gray-300" />

      {/* Bold */}
      <button
        onClick={toggleBold}
        className={`px-2 py-1 text-sm font-bold rounded transition-colors ${
          isBold
            ? "bg-purple-100 text-purple-700"
            : "hover:bg-gray-100 text-gray-700"
        }`}
        title="Bold"
      >
        B
      </button>

      {/* Italic */}
      <button
        onClick={toggleItalic}
        className={`px-2 py-1 text-sm italic rounded transition-colors ${
          isItalic
            ? "bg-purple-100 text-purple-700"
            : "hover:bg-gray-100 text-gray-700"
        }`}
        title="Italic"
      >
        I
      </button>

      <div className="w-px h-6 bg-gray-300" />

      {/* Color Picker */}
      <input
        type="color"
        value={textObject.fill}
        onChange={(e) => onFormatChange({ fill: e.target.value })}
        className="w-8 h-8 rounded cursor-pointer border border-gray-300"
        title="Text Color"
      />
    </div>
  );
}
