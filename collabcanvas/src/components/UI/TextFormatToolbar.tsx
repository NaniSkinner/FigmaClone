"use client";

import { Text as TextType } from "@/types";

interface TextFormatToolbarProps {
  textObject: TextType;
  stageScale: number;
  stagePosition: { x: number; y: number };
  onFormatChange: (updates: Partial<TextType>) => void;
}

const FONT_SIZES = [12, 14, 16, 18, 24, 32, 48, 72];
const FONT_FAMILIES = [
  "Arial",
  "Georgia",
  "Courier New",
  "Comic Sans MS",
  "Roboto",
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
    let newStyle = textObject.fontStyle || "normal";
    if (isBold) {
      // Remove bold
      newStyle = newStyle.replace("bold", "").trim();
      if (newStyle === "") newStyle = "normal";
    } else {
      // Add bold
      if (newStyle === "normal") {
        newStyle = "bold";
      } else if (newStyle === "italic") {
        newStyle = "bold italic";
      }
    }
    onFormatChange({ fontStyle: newStyle as TextType["fontStyle"] });
  };

  const toggleItalic = () => {
    let newStyle = textObject.fontStyle || "normal";
    if (isItalic) {
      // Remove italic
      newStyle = newStyle.replace("italic", "").trim();
      if (newStyle === "") newStyle = "normal";
    } else {
      // Add italic
      if (newStyle === "normal") {
        newStyle = "italic";
      } else if (newStyle === "bold") {
        newStyle = "bold italic";
      }
    }
    onFormatChange({ fontStyle: newStyle as TextType["fontStyle"] });
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
        {FONT_FAMILIES.map((font) => (
          <option key={font} value={font}>
            {font}
          </option>
        ))}
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
