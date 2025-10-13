"use client";

import { useRef, useEffect, useState } from "react";
import { Stage, Layer, Rect, Line } from "react-konva";
import Konva from "konva";
import { useCanvas } from "@/hooks/useCanvas";
import { useRealtimeSync } from "@/hooks/useRealtimeSync";
import { useCanvasStore } from "@/store";
import { ObjectRenderer } from "@/components/Objects";
import { CanvasObject } from "@/types";
import { DEFAULT_RECTANGLE_STYLE } from "@/lib/constants";
import { v4 as uuidv4 } from "uuid";

interface CanvasProps {
  width: number;
  height: number;
  userId: string | null;
  canvasId: string;
}

export default function Canvas({
  width,
  height,
  userId,
  canvasId,
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

  const {
    scale,
    position,
    setPosition,
    handleWheel,
    handleDragStart,
    handleDragEnd,
    handleDragMove,
    canvasSize,
  } = useCanvas();

  const { objects, selectedObjectId, setSelectedObjectId, updateObject } =
    useCanvasStore();
  const { createObject, updateObjectInFirestore } = useRealtimeSync(
    canvasId,
    userId
  );

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

  // Handle mouse down to start drawing a rectangle or panning
  const handleMouseDown = (e: Konva.KonvaEventObject<MouseEvent>) => {
    const clickedOnEmpty =
      e.target === e.target.getStage() ||
      e.target.name() === "background" ||
      (e.target.getClassName() === "Rect" &&
        (e.target.attrs.fill === "#F5F5F5" || e.target.attrs.fill === "white"));

    // Check if Shift key is held for panning
    const isShiftPressed = e.evt.shiftKey;

    if (clickedOnEmpty) {
      setSelectedObjectId(null);

      if (isShiftPressed) {
        // Start panning mode
        setIsPanning(true);
        setPanStart({ x: e.evt.clientX, y: e.evt.clientY });
      } else {
        // Start drawing mode
        const stage = stageRef.current;
        const point = stage.getPointerPosition();

        // Convert screen coordinates to canvas coordinates
        const x = (point.x - position.x) / scale;
        const y = (point.y - position.y) / scale;

        setIsDrawing(true);
        setNewRect({ x, y, width: 0, height: 0 });
      }
    }
  };

  // Handle mouse move to update rectangle size while drawing or pan canvas
  const handleMouseMove = (e: Konva.KonvaEventObject<MouseEvent>) => {
    if (isPanning && panStart) {
      // Handle panning
      const dx = e.evt.clientX - panStart.x;
      const dy = e.evt.clientY - panStart.y;

      setPosition({
        x: position.x + dx,
        y: position.y + dy,
      });

      setPanStart({ x: e.evt.clientX, y: e.evt.clientY });
    } else if (isDrawing && newRect) {
      // Handle drawing
      const stage = stageRef.current;
      const point = stage.getPointerPosition();

      // Convert screen coordinates to canvas coordinates
      const x = (point.x - position.x) / scale;
      const y = (point.y - position.y) / scale;

      const width = x - newRect.x;
      const height = y - newRect.y;

      setNewRect({ ...newRect, width, height });
    }
  };

  // Handle mouse up to finish drawing or panning
  const handleMouseUp = async () => {
    if (isPanning) {
      setIsPanning(false);
      setPanStart(null);
      return;
    }

    if (!isDrawing || !newRect || !userId) {
      setIsDrawing(false);
      setNewRect(null);
      return;
    }

    setIsDrawing(false);

    // Only create if rectangle is large enough (at least 10x10)
    if (Math.abs(newRect.width) > 10 && Math.abs(newRect.height) > 10) {
      const finalRect: CanvasObject = {
        id: uuidv4(),
        type: "rectangle",
        x: newRect.width < 0 ? newRect.x + newRect.width : newRect.x,
        y: newRect.height < 0 ? newRect.y + newRect.height : newRect.y,
        width: Math.abs(newRect.width),
        height: Math.abs(newRect.height),
        fill: DEFAULT_RECTANGLE_STYLE.fill,
        stroke: DEFAULT_RECTANGLE_STYLE.stroke,
        strokeWidth: DEFAULT_RECTANGLE_STYLE.strokeWidth,
        userId,
        createdAt: new Date(),
      };

      await createObject(finalRect);
    }

    setNewRect(null);
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
        onDragStart={handleDragStart}
        onDragEnd={handleDragEnd}
        onDragMove={handleDragMove}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
      >
        <Layer>
          {/* Background */}
          <Rect
            name="background"
            className="background"
            x={-1000}
            y={-1000}
            width={canvasSize.width + 2000}
            height={canvasSize.height + 2000}
            fill="#F5F5F5"
          />

          {/* Grid */}
          {gridLines}

          {/* Canvas boundary */}
          <Rect
            x={0}
            y={0}
            width={canvasSize.width}
            height={canvasSize.height}
            stroke="#D0D0D0"
            strokeWidth={2}
            fill="white"
          />

          {/* Render all objects */}
          <ObjectRenderer
            objects={objectsArray}
            selectedId={selectedObjectId}
            onSelect={setSelectedObjectId}
            onObjectChange={handleObjectChange}
          />

          {/* Show rectangle being drawn */}
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
        </Layer>
      </Stage>
    </div>
  );
}
