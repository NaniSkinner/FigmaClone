"use client";

import { useRef, useEffect, useState } from "react";
import { Stage, Layer, Rect, Line, Circle, Text } from "react-konva";
import Konva from "konva";
import { useRealtimeSync } from "@/hooks/useRealtimeSync";
import { useCanvasStore } from "@/store";
import ObjectRenderer from "@/components/Objects/ObjectRenderer";
import TextEditor from "@/components/Objects/TextEditor";
import TextFormatToolbar from "@/components/UI/TextFormatToolbar";
import { CanvasObject, Text as TextType } from "@/types";
import {
  DEFAULT_RECTANGLE_STYLE,
  DEFAULT_CIRCLE_STYLE,
  DEFAULT_LINE_STYLE,
  DEFAULT_TEXT_STYLE,
  CANVAS_SIZE,
} from "@/lib/constants";
import { v4 as uuidv4 } from "uuid";
import { ToolMode } from "@/components/Canvas/CanvasControls";

interface CanvasProps {
  width: number;
  height: number;
  userId: string | null;
  canvasId: string;
  scale: number;
  position: { x: number; y: number };
  setPosition: (position: { x: number; y: number }) => void;
  handleWheel: (e: WheelEvent) => void;
  tool: ToolMode;
}

export default function Canvas({
  width,
  height,
  userId,
  canvasId,
  scale,
  position,
  setPosition,
  handleWheel,
  tool,
}: CanvasProps) {
  const stageRef = useRef<any>(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [isPanning, setIsPanning] = useState(false);
  const [panStart, setPanStart] = useState<{ x: number; y: number } | null>(
    null
  );
  const [newRect, setNewRect] = useState<{
    x: number;
    y: number;
    width: number;
    height: number;
  } | null>(null);
  const [newCircle, setNewCircle] = useState<{
    x: number;
    y: number;
    radius: number;
  } | null>(null);
  const [newLine, setNewLine] = useState<{
    points: [number, number, number, number];
  } | null>(null);
  const [editingTextId, setEditingTextId] = useState<string | null>(null);

  const canvasSize = CANVAS_SIZE;

  const { objects, selectedObjectId, setSelectedObjectId, updateObject } =
    useCanvasStore();
  const { createObject, updateObjectInFirestore, deleteObject } =
    useRealtimeSync(canvasId, userId);

  // Add wheel event listener for zoom
  useEffect(() => {
    const stage = stageRef.current;
    if (!stage) return;

    const container = stage.container();
    container.addEventListener("wheel", handleWheel);

    return () => {
      container.removeEventListener("wheel", handleWheel);
    };
  }, [handleWheel]);

  // Add keyboard event listener for delete
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.key === "Delete" || e.key === "Backspace") && selectedObjectId) {
        e.preventDefault();
        deleteObject(selectedObjectId);
        setSelectedObjectId(null);
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => {
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [selectedObjectId, deleteObject, setSelectedObjectId]);

  // Handle mouse down to start drawing a shape or panning
  const handleMouseDown = async (e: Konva.KonvaEventObject<MouseEvent>) => {
    // Don't interfere if clicking on a draggable object - unless we're in delete mode
    if (e.target.draggable && e.target.draggable() && tool !== "delete") {
      return;
    }

    // Determine what was clicked
    const clickedOnBackground = e.target.name() === "background";
    const clickedOnCanvas = e.target.name() === "canvas-area";
    const clickedOnEmpty =
      clickedOnBackground ||
      clickedOnCanvas ||
      e.target === e.target.getStage();

    if (clickedOnEmpty) {
      // Deselect when clicking on empty space (except in delete mode)
      if (tool !== "delete") {
        setSelectedObjectId(null);
      }

      // Get click position in canvas coordinates
      const stage = stageRef.current;
      const point = stage.getPointerPosition();
      let x = (point.x - position.x) / scale;
      let y = (point.y - position.y) / scale;

      // Clamp initial coordinates to canvas bounds
      x = Math.max(0, Math.min(x, canvasSize.width));
      y = Math.max(0, Math.min(y, canvasSize.height));

      // Handle different tool modes
      if (tool === "rectangle") {
        // Rectangle mode: only draw on white canvas area
        if (clickedOnCanvas) {
          setIsDrawing(true);
          setNewRect({ x, y, width: 0, height: 0 });
        } else if (clickedOnBackground) {
          // On gray background, allow panning
          setIsPanning(true);
          setPanStart({ x: e.evt.clientX, y: e.evt.clientY });
        }
      } else if (tool === "circle") {
        // Circle mode: only draw on white canvas area
        if (clickedOnCanvas) {
          setIsDrawing(true);
          setNewCircle({ x, y, radius: 0 });
        } else if (clickedOnBackground) {
          setIsPanning(true);
          setPanStart({ x: e.evt.clientX, y: e.evt.clientY });
        }
      } else if (tool === "line") {
        // Line mode: only draw on white canvas area
        if (clickedOnCanvas) {
          setIsDrawing(true);
          setNewLine({ points: [x, y, x, y] });
        } else if (clickedOnBackground) {
          setIsPanning(true);
          setPanStart({ x: e.evt.clientX, y: e.evt.clientY });
        }
      } else if (tool === "text") {
        // Text mode: click to place text
        if (clickedOnCanvas && userId) {
          const textObject: CanvasObject = {
            id: uuidv4(),
            type: "text",
            x,
            y,
            text: "Enter text",
            fontSize: DEFAULT_TEXT_STYLE.fontSize,
            fontFamily: DEFAULT_TEXT_STYLE.fontFamily,
            fill: DEFAULT_TEXT_STYLE.fill,
            userId,
            createdAt: new Date(),
          };
          await createObject(textObject);
          setSelectedObjectId(textObject.id);
        } else if (clickedOnBackground) {
          setIsPanning(true);
          setPanStart({ x: e.evt.clientX, y: e.evt.clientY });
        }
      } else if (tool === "pan") {
        // Pan mode: drag anywhere to pan
        setIsPanning(true);
        setPanStart({ x: e.evt.clientX, y: e.evt.clientY });
      } else if (tool === "select") {
        // Select mode: just deselect on empty click (already handled above)
        // Objects will handle their own selection in shape components
      } else if (tool === "delete") {
        // Delete mode: objects will handle their own deletion
        // Clicking on empty space does nothing
      }
    }
  };

  // Handle mouse move to update shape size while drawing or pan canvas
  const handleMouseMove = (e: Konva.KonvaEventObject<MouseEvent>) => {
    // Don't interfere with object dragging
    if (
      e.target.draggable &&
      e.target.draggable() &&
      e.target.isDragging &&
      e.target.isDragging()
    ) {
      return;
    }

    if (isPanning && panStart) {
      // Handle panning
      const dx = e.evt.clientX - panStart.x;
      const dy = e.evt.clientY - panStart.y;

      setPosition({
        x: position.x + dx,
        y: position.y + dy,
      });

      setPanStart({ x: e.evt.clientX, y: e.evt.clientY });
    } else if (isDrawing) {
      // Handle drawing for different shapes
      const stage = stageRef.current;
      const point = stage.getPointerPosition();

      // Convert screen coordinates to canvas coordinates
      let x = (point.x - position.x) / scale;
      let y = (point.y - position.y) / scale;

      // Clamp coordinates to canvas bounds
      x = Math.max(0, Math.min(x, canvasSize.width));
      y = Math.max(0, Math.min(y, canvasSize.height));

      if (newRect) {
        // Rectangle drawing
        const width = x - newRect.x;
        const height = y - newRect.y;
        setNewRect({ ...newRect, width, height });
      } else if (newCircle) {
        // Circle drawing (radius from center)
        const dx = x - newCircle.x;
        const dy = y - newCircle.y;
        const radius = Math.sqrt(dx * dx + dy * dy);
        setNewCircle({ ...newCircle, radius });
      } else if (newLine) {
        // Line drawing (update end point)
        setNewLine({ points: [newLine.points[0], newLine.points[1], x, y] });
      }
    }
  };

  // Handle mouse up to finish drawing or panning
  const handleMouseUp = async () => {
    if (isPanning) {
      setIsPanning(false);
      setPanStart(null);
      return;
    }

    if (!isDrawing || !userId) {
      setIsDrawing(false);
      setNewRect(null);
      setNewCircle(null);
      setNewLine(null);
      return;
    }

    setIsDrawing(false);

    // Create rectangle
    if (newRect) {
      // Only create if rectangle is large enough (at least 10x10)
      if (Math.abs(newRect.width) > 10 && Math.abs(newRect.height) > 10) {
        // Calculate final position and dimensions
        let x = newRect.width < 0 ? newRect.x + newRect.width : newRect.x;
        let y = newRect.height < 0 ? newRect.y + newRect.height : newRect.y;
        let width = Math.abs(newRect.width);
        let height = Math.abs(newRect.height);

        // Ensure the rectangle is fully within canvas bounds
        x = Math.max(0, Math.min(x, canvasSize.width));
        y = Math.max(0, Math.min(y, canvasSize.height));
        width = Math.min(width, canvasSize.width - x);
        height = Math.min(height, canvasSize.height - y);

        // Final check: only create if the rectangle is within bounds and still large enough
        if (
          x >= 0 &&
          y >= 0 &&
          x + width <= canvasSize.width &&
          y + height <= canvasSize.height &&
          width >= 10 &&
          height >= 10
        ) {
          const finalRect: CanvasObject = {
            id: uuidv4(),
            type: "rectangle",
            x,
            y,
            width,
            height,
            fill: DEFAULT_RECTANGLE_STYLE.fill,
            stroke: DEFAULT_RECTANGLE_STYLE.stroke,
            strokeWidth: DEFAULT_RECTANGLE_STYLE.strokeWidth,
            userId,
            createdAt: new Date(),
          };

          await createObject(finalRect);
        }
      }
      setNewRect(null);
    }

    // Create circle
    if (newCircle) {
      // Only create if circle is large enough (radius at least 5)
      if (newCircle.radius > 5) {
        let x = newCircle.x;
        let y = newCircle.y;
        let radius = newCircle.radius;

        // Ensure the circle is fully within canvas bounds
        radius = Math.min(
          radius,
          x,
          y,
          canvasSize.width - x,
          canvasSize.height - y
        );

        if (radius >= 5) {
          const finalCircle: CanvasObject = {
            id: uuidv4(),
            type: "circle",
            x,
            y,
            radius,
            fill: DEFAULT_CIRCLE_STYLE.fill,
            stroke: DEFAULT_CIRCLE_STYLE.stroke,
            strokeWidth: DEFAULT_CIRCLE_STYLE.strokeWidth,
            userId,
            createdAt: new Date(),
          };

          await createObject(finalCircle);
        }
      }
      setNewCircle(null);
    }

    // Create line
    if (newLine) {
      const [x1, y1, x2, y2] = newLine.points;
      const dx = x2 - x1;
      const dy = y2 - y1;
      const length = Math.sqrt(dx * dx + dy * dy);

      // Only create if line is long enough (at least 10px)
      if (length > 10) {
        const finalLine: CanvasObject = {
          id: uuidv4(),
          type: "line",
          points: newLine.points,
          stroke: DEFAULT_LINE_STYLE.stroke,
          strokeWidth: DEFAULT_LINE_STYLE.strokeWidth,
          userId,
          createdAt: new Date(),
        };

        await createObject(finalLine);
      }
      setNewLine(null);
    }
  };

  // Handle object changes (drag or transform)
  const handleObjectChange = async (
    id: string,
    attrs: Partial<CanvasObject>
  ) => {
    // Update locally immediately for responsiveness
    updateObject(id, attrs);
    // Sync to Firestore (throttled)
    await updateObjectInFirestore(id, attrs);
  };

  // Generate grid lines
  const gridLines = [];
  const gridSize = 50;
  const padding = 200;

  // Vertical lines
  for (let i = -padding; i < canvasSize.width + padding; i += gridSize) {
    gridLines.push(
      <Line
        key={`v-${i}`}
        points={[i, -padding, i, canvasSize.height + padding]}
        stroke="#E0E0E0"
        strokeWidth={1}
      />
    );
  }

  // Horizontal lines
  for (let i = -padding; i < canvasSize.height + padding; i += gridSize) {
    gridLines.push(
      <Line
        key={`h-${i}`}
        points={[-padding, i, canvasSize.width + padding, i]}
        stroke="#E0E0E0"
        strokeWidth={1}
      />
    );
  }

  // Handle text double-click for editing
  const handleTextDoubleClick = (textId: string) => {
    setEditingTextId(textId);
  };

  // Handle text save
  const handleTextSave = async (newText: string) => {
    if (editingTextId) {
      // Update locally first for immediate feedback
      updateObject(editingTextId, { text: newText });
      // Then sync to Firestore
      await updateObjectInFirestore(editingTextId, { text: newText });
    }
  };

  // Handle text format change
  const handleTextFormatChange = async (updates: Partial<TextType>) => {
    if (editingTextId) {
      // Update locally first for immediate feedback
      updateObject(editingTextId, updates);
      // Then sync to Firestore
      await updateObjectInFirestore(editingTextId, updates);
    }
  };

  // Get the text object being edited
  const editingTextObject = editingTextId
    ? (objects.get(editingTextId) as TextType)
    : null;

  // Convert objects Map to array for rendering
  const objectsArray = Array.from(objects.values());

  return (
    <div className="w-full h-full overflow-hidden bg-gray-50">
      <Stage
        ref={stageRef}
        width={width}
        height={height}
        scaleX={scale}
        scaleY={scale}
        x={position.x}
        y={position.y}
        draggable={false}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
      >
        <Layer>
          {/* Background - Gray Grid Area */}
          <Rect
            name="background"
            className="background"
            x={-10000}
            y={-10000}
            width={canvasSize.width + 20000}
            height={canvasSize.height + 20000}
            fill="#F5F5F5"
            listening={true}
          />

          {/* Grid */}
          {gridLines}

          {/* Canvas boundary - White Drawing Area */}
          <Rect
            name="canvas-area"
            x={0}
            y={0}
            width={canvasSize.width}
            height={canvasSize.height}
            stroke="#D0D0D0"
            strokeWidth={2}
            fill="white"
            listening={true}
          />

          {/* Render all objects */}
          <ObjectRenderer
            objects={objectsArray}
            selectedId={selectedObjectId}
            onSelect={setSelectedObjectId}
            onObjectChange={handleObjectChange}
            tool={tool}
            onDelete={deleteObject}
            onTextDoubleClick={handleTextDoubleClick}
          />

          {/* Show shape being drawn */}
          {newRect && (
            <Rect
              x={newRect.width < 0 ? newRect.x + newRect.width : newRect.x}
              y={newRect.height < 0 ? newRect.y + newRect.height : newRect.y}
              width={Math.abs(newRect.width)}
              height={Math.abs(newRect.height)}
              fill={DEFAULT_RECTANGLE_STYLE.fill}
              stroke={DEFAULT_RECTANGLE_STYLE.stroke}
              strokeWidth={DEFAULT_RECTANGLE_STYLE.strokeWidth}
              opacity={0.7}
            />
          )}
          {newCircle && (
            <Circle
              x={newCircle.x}
              y={newCircle.y}
              radius={newCircle.radius}
              fill={DEFAULT_CIRCLE_STYLE.fill}
              stroke={DEFAULT_CIRCLE_STYLE.stroke}
              strokeWidth={DEFAULT_CIRCLE_STYLE.strokeWidth}
              opacity={0.7}
            />
          )}
          {newLine && (
            <Line
              points={newLine.points}
              stroke={DEFAULT_LINE_STYLE.stroke}
              strokeWidth={DEFAULT_LINE_STYLE.strokeWidth}
              opacity={0.7}
              lineCap="round"
              lineJoin="round"
            />
          )}
        </Layer>
      </Stage>

      {/* Text Editor Overlay */}
      {editingTextObject && editingTextId && (
        <>
          <TextEditor
            textObject={editingTextObject}
            stageScale={scale}
            stagePosition={position}
            onSave={handleTextSave}
            onClose={() => setEditingTextId(null)}
          />
          <TextFormatToolbar
            textObject={editingTextObject}
            stageScale={scale}
            stagePosition={position}
            onFormatChange={handleTextFormatChange}
          />
        </>
      )}
    </div>
  );
}
