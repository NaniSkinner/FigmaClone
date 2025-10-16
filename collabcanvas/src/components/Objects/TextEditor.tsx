"use client";

import { useEffect, useRef, useState } from "react";
import { Text as TextType } from "@/types";

interface TextEditorProps {
  textObject: TextType;
  stageScale: number;
  stagePosition: { x: number; y: number };
  onSave: (newText: string) => void;
  onClose: () => void;
}

export default function TextEditor({
  textObject,
  stageScale,
  stagePosition,
  onSave,
  onClose,
}: TextEditorProps) {
  const [text, setText] = useState(textObject.text);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const textRef = useRef(text); // Keep ref updated with current text value

  // Update text when textObject changes (for multi-user scenarios)
  useEffect(() => {
    setText(textObject.text);
  }, [textObject.text]);

  // Keep ref in sync with text state
  useEffect(() => {
    textRef.current = text;
  }, [text]);

  const handleSave = () => {
    // Use ref to get latest text value
    const currentText = textRef.current;
    // Save if text has changed
    if (currentText !== textObject.text) {
      onSave(currentText);
    }
    onClose();
  };

  useEffect(() => {
    // Focus the textarea immediately
    if (textareaRef.current) {
      textareaRef.current.focus();
      textareaRef.current.select();
    }

    // Handle click outside to close
    const handleClickOutside = (e: MouseEvent) => {
      const target = e.target as Node;

      // Check if click is on textarea or toolbar
      const clickedOnTextarea =
        textareaRef.current && textareaRef.current.contains(target);
      const clickedOnToolbar = (e.target as HTMLElement).closest(
        ".text-format-toolbar"
      );

      // Only save and close if clicking outside both editor and toolbar
      if (!clickedOnTextarea && !clickedOnToolbar) {
        handleSave();
      }
    };

    // Small delay to prevent immediate close from the double-click event
    const timer = setTimeout(() => {
      document.addEventListener("mousedown", handleClickOutside);
    }, 150);

    return () => {
      clearTimeout(timer);
      document.removeEventListener("mousedown", handleClickOutside);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Escape") {
      handleSave();
    }
    // Don't close on Enter - allow multi-line text
    e.stopPropagation(); // Prevent canvas keyboard shortcuts
  };

  // Calculate position based on stage transform
  const editorX = textObject.x * stageScale + stagePosition.x;
  const editorY = textObject.y * stageScale + stagePosition.y;
  const editorWidth = textObject.width
    ? textObject.width * stageScale
    : 200 * stageScale;

  return (
    <textarea
      ref={textareaRef}
      value={text}
      onChange={(e) => setText(e.target.value)}
      onKeyDown={handleKeyDown}
      style={{
        position: "fixed",
        left: `${editorX}px`,
        top: `${editorY}px`,
        width: `${editorWidth}px`,
        minHeight: `${textObject.fontSize * stageScale * 1.2}px`,
        fontSize: `${textObject.fontSize * stageScale}px`,
        fontFamily: textObject.fontFamily,
        fontStyle: textObject.fontStyle?.includes("italic")
          ? "italic"
          : "normal",
        fontWeight: textObject.fontStyle?.includes("bold") ? "bold" : "normal",
        color: textObject.fill,
        backgroundColor: "rgba(255, 255, 255, 0.95)",
        border: "2px solid #8B5CF6",
        borderRadius: "4px",
        padding: "4px 8px",
        resize: "none",
        overflow: "hidden",
        zIndex: 1000,
        outline: "none",
        lineHeight: "1.2",
      }}
      rows={1}
    />
  );
}
