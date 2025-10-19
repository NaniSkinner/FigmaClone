"use client";

import { useRef, useEffect, useState } from "react";
import { Stage, Layer, Rect, Line, Circle, Text } from "react-konva";
import Konva from "konva";
import { useLayerManagement } from "@/hooks/useLayerManagement";
import { useCanvasStore } from "@/store";
import { useProjectStore } from "@/store/projectStore";
import { useUserStore } from "@/store/userStore";
import { useToast } from "@/contexts/ToastContext";
import ObjectRenderer from "@/components/Objects/ObjectRenderer";
import SelectionBox from "@/components/Canvas/SelectionBox";
import TextEditor from "@/components/Objects/TextEditor";
import TextFormatToolbar from "@/components/UI/TextFormatToolbar";
import { CanvasObject, Text as TextType, ImageObject } from "@/types";
import {
  DEFAULT_RECTANGLE_STYLE,
  DEFAULT_CIRCLE_STYLE,
  DEFAULT_LINE_STYLE,
  DEFAULT_TEXT_STYLE,
  CANVAS_SIZE,
} from "@/lib/constants";
import { v4 as uuidv4 } from "uuid";
import { ToolMode } from "@/components/Canvas/CanvasControls";
import { uploadImage } from "@/lib/firebase/storage";

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
  setTool: (tool: ToolMode) => void;
  onlineUsers: Map<string, any>; // UserPresence from useMultiplayer
  updateSelectedObjects: (selectedObjectIds: string[]) => void;
  createObject: (object: CanvasObject) => Promise<void>;
  updateObjectInFirestore: (id: string, updates: Partial<CanvasObject>) => void;
  deleteObject: (id: string) => Promise<void>;
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
  setTool,
  onlineUsers,
  updateSelectedObjects,
  createObject,
  updateObjectInFirestore,
  deleteObject,
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
  const [groupDragStart, setGroupDragStart] = useState<Map<
    string,
    { x: number; y: number }
  > | null>(null);
  const [clipboard, setClipboard] = useState<CanvasObject[]>([]);
  const [isDragOver, setIsDragOver] = useState(false);

  const canvasSize = CANVAS_SIZE;
  const currentProject = useProjectStore((state) => state.currentProject);
  const currentUser = useUserStore((state) => state.currentUser);
  const addObject = useCanvasStore((state) => state.addObject);
  const { addToast } = useToast();

  const {
    objects,
    selectedObjectIds,
    clearSelection,
    updateObject,
    selectionBox,
    setSelectionBox,
    isSelecting,
    setIsSelecting,
    setSelectedObjectIds,
    getNextZIndex,
    duplicateObjects,
    copyObjects,
    pasteObjects,
    addToSelection,
  } = useCanvasStore();
  const { bringToFront, sendToBack, bringForward, sendBackward } =
    useLayerManagement(updateObjectInFirestore);

  // Sync selection to presence (real-time selection visibility)
  useEffect(() => {
    const selectedArray = Array.from(selectedObjectIds);
    updateSelectedObjects(selectedArray);
  }, [selectedObjectIds, updateSelectedObjects]);

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

  // Add keyboard event listener for shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Ctrl/Cmd+A: Select all objects
      if ((e.ctrlKey || e.metaKey) && e.key === "a") {
        e.preventDefault();
        const { selectAll } = useCanvasStore.getState();
        selectAll();
        return;
      }

      // Escape: Clear selection
      if (e.key === "Escape") {
        e.preventDefault();
        clearSelection();
        return;
      }

      // Delete/Backspace: Delete selected objects
      if (
        (e.key === "Delete" || e.key === "Backspace") &&
        selectedObjectIds.size > 0
      ) {
        e.preventDefault();
        // Delete all selected objects
        selectedObjectIds.forEach((id) => {
          deleteObject(id);
        });
        clearSelection();
        return;
      }

      // Ctrl/Cmd+D: Duplicate selected objects
      if (
        (e.ctrlKey || e.metaKey) &&
        e.key === "d" &&
        selectedObjectIds.size > 0 &&
        userId
      ) {
        e.preventDefault();
        // Duplicate all selected objects
        const duplicates = duplicateObjects(
          Array.from(selectedObjectIds),
          userId
        );

        // Sync duplicates to Firestore
        duplicates.forEach((duplicate) => {
          createObject(duplicate);
        });

        // Select the newly duplicated objects
        setSelectedObjectIds(new Set(duplicates.map((d) => d.id)));
        return;
      }

      // Ctrl/Cmd+C: Copy selected objects
      if (
        (e.ctrlKey || e.metaKey) &&
        e.key === "c" &&
        selectedObjectIds.size > 0
      ) {
        e.preventDefault();
        // Copy selected objects to internal clipboard
        const copies = copyObjects(Array.from(selectedObjectIds));
        setClipboard(copies);

        // Also try to use browser clipboard API for cross-tab support
        try {
          navigator.clipboard.writeText(JSON.stringify(copies));
        } catch (err) {
          console.warn("Failed to write to clipboard:", err);
        }
        return;
      }

      // Ctrl/Cmd+X: Cut selected objects
      if (
        (e.ctrlKey || e.metaKey) &&
        e.key === "x" &&
        selectedObjectIds.size > 0
      ) {
        e.preventDefault();
        // Copy to clipboard first
        const copies = copyObjects(Array.from(selectedObjectIds));
        setClipboard(copies);

        // Try to use browser clipboard API
        try {
          navigator.clipboard.writeText(JSON.stringify(copies));
        } catch (err) {
          console.warn("Failed to write to clipboard:", err);
        }

        // Delete selected objects
        selectedObjectIds.forEach((id) => {
          deleteObject(id);
        });
        clearSelection();
        return;
      }

      // Ctrl/Cmd+V: Paste objects from clipboard
      if ((e.ctrlKey || e.metaKey) && e.key === "v" && userId) {
        e.preventDefault();

        // Try internal clipboard first
        if (clipboard.length > 0) {
          const pasted = pasteObjects(clipboard, userId, 20, 20);

          // Sync pasted objects to Firestore
          pasted.forEach((obj) => {
            createObject(obj);
          });

          // Select the newly pasted objects
          setSelectedObjectIds(new Set(pasted.map((o) => o.id)));
        } else {
          // Try browser clipboard as fallback
          try {
            navigator.clipboard.readText().then((text) => {
              try {
                const parsedObjects = JSON.parse(text) as CanvasObject[];
                if (Array.isArray(parsedObjects) && parsedObjects.length > 0) {
                  const pasted = pasteObjects(parsedObjects, userId, 20, 20);

                  pasted.forEach((obj) => {
                    createObject(obj);
                  });

                  setSelectedObjectIds(new Set(pasted.map((o) => o.id)));
                }
              } catch (parseErr) {
                console.warn("Clipboard does not contain valid objects");
              }
            });
          } catch (err) {
            console.warn("Failed to read from clipboard:", err);
          }
        }
        return;
      }

      // Layer ordering shortcuts (only if objects are selected)
      if (selectedObjectIds.size > 0 && (e.ctrlKey || e.metaKey)) {
        // Ctrl/Cmd + Shift + ] : Bring to Front
        if (e.shiftKey && e.key === "]") {
          e.preventDefault();
          bringToFront();
          return;
        }

        // Ctrl/Cmd + Shift + [ : Send to Back
        if (e.shiftKey && e.key === "[") {
          e.preventDefault();
          sendToBack();
          return;
        }

        // Ctrl/Cmd + ] : Bring Forward
        if (!e.shiftKey && e.key === "]") {
          e.preventDefault();
          bringForward();
          return;
        }

        // Ctrl/Cmd + [ : Send Backward
        if (!e.shiftKey && e.key === "[") {
          e.preventDefault();
          sendBackward();
          return;
        }
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => {
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [
    selectedObjectIds,
    deleteObject,
    clearSelection,
    bringToFront,
    sendToBack,
    bringForward,
    sendBackward,
    duplicateObjects,
    copyObjects,
    pasteObjects,
    clipboard,
    userId,
    createObject,
    setSelectedObjectIds,
  ]);

  // Clipboard paste handler for images
  useEffect(() => {
    const handlePaste = async (e: ClipboardEvent) => {
      // Ignore if user is typing in an input field
      const target = e.target as HTMLElement;
      if (
        target.tagName === "INPUT" ||
        target.tagName === "TEXTAREA" ||
        target.isContentEditable
      ) {
        return;
      }

      // Check for image in clipboard
      const items = e.clipboardData?.items;
      if (!items) return;

      for (let i = 0; i < items.length; i++) {
        if (items[i].type.indexOf("image") !== -1) {
          e.preventDefault();

          if (!currentProject) {
            addToast(
              "Please save your project before uploading images",
              "error"
            );
            return;
          }
          if (!currentUser) {
            addToast("You must be logged in to upload images", "error");
            return;
          }

          const blob = items[i].getAsFile();
          if (!blob) continue;

          try {
            // Upload to Firebase Storage
            const result = await uploadImage({
              userId: currentUser.id,
              projectId: currentProject.metadata.id,
              file: blob,
              onProgress: (progress) => {
                console.log(`Upload progress: ${progress}%`);
              },
            });

            // Calculate display dimensions (max 400px width/height, maintain aspect ratio)
            const maxDisplaySize = 400;
            const aspectRatio = result.naturalWidth / result.naturalHeight;
            let displayWidth = maxDisplaySize;
            let displayHeight = maxDisplaySize;

            if (aspectRatio > 1) {
              displayHeight = maxDisplaySize / aspectRatio;
            } else {
              displayWidth = maxDisplaySize * aspectRatio;
            }

            // Create image object centered on canvas
            const imageObject: ImageObject = {
              id: crypto.randomUUID(),
              type: "image",
              src: result.url,
              thumbnailSrc: result.thumbnailBase64,
              x: 4000 - displayWidth / 2, // Center on 8000x8000 canvas
              y: 4000 - displayHeight / 2,
              width: displayWidth,
              height: displayHeight,
              naturalWidth: result.naturalWidth,
              naturalHeight: result.naturalHeight,
              fileSize: result.fileSize,
              mimeType: result.mimeType,
              opacity: 1,
              scaleX: 1,
              scaleY: 1,
              userId: currentUser.id,
              createdAt: new Date(),
              updatedAt: new Date(),
              zIndex: getNextZIndex(),
            };

            // Add to canvas
            addObject(imageObject);
            await createObject(imageObject);
            addToast("Pasted image from clipboard", "success");
          } catch (error) {
            console.error("Failed to paste image:", error);
            addToast(
              error instanceof Error ? error.message : "Failed to paste image",
              "error"
            );
          }
          break;
        }
      }
    };

    window.addEventListener("paste", handlePaste);
    return () => {
      window.removeEventListener("paste", handlePaste);
    };
  }, [
    currentProject,
    currentUser,
    addObject,
    getNextZIndex,
    createObject,
    addToast,
  ]);

  // Drag and drop handlers
  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(true);
  };

  const handleDragLeave = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(false);
  };

  const handleDrop = async (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(false);

    if (!currentProject) {
      addToast("Please save your project before uploading images", "error");
      return;
    }
    if (!currentUser) {
      addToast("You must be logged in to upload images", "error");
      return;
    }

    const files = e.dataTransfer.files;
    if (!files || files.length === 0) return;

    // Get drop position in canvas coordinates
    const stage = stageRef.current;
    if (!stage) return;

    const pointerPosition = stage.getPointerPosition();
    if (!pointerPosition) return;

    // Convert screen coordinates to canvas coordinates
    const dropX = (pointerPosition.x - position.x) / scale;
    const dropY = (pointerPosition.y - position.y) / scale;

    // Process each file
    const imageFiles = Array.from(files).filter((file) =>
      file.type.startsWith("image/")
    );

    if (imageFiles.length === 0) {
      addToast("No image files found in drop", "error");
      return;
    }

    for (let i = 0; i < imageFiles.length; i++) {
      const file = imageFiles[i];

      try {
        // Upload to Firebase Storage
        const result = await uploadImage({
          userId: currentUser.id,
          projectId: currentProject.metadata.id,
          file,
          onProgress: (progress) => {
            console.log(`Upload progress: ${progress}%`);
          },
        });

        // Calculate display dimensions (max 400px width/height, maintain aspect ratio)
        const maxDisplaySize = 400;
        const aspectRatio = result.naturalWidth / result.naturalHeight;
        let displayWidth = maxDisplaySize;
        let displayHeight = maxDisplaySize;

        if (aspectRatio > 1) {
          displayHeight = maxDisplaySize / aspectRatio;
        } else {
          displayWidth = maxDisplaySize * aspectRatio;
        }

        // Create image object at drop position (with offset for multiple images)
        const offsetX = i * 50;
        const offsetY = i * 50;

        const imageObject: ImageObject = {
          id: crypto.randomUUID(),
          type: "image",
          src: result.url,
          thumbnailSrc: result.thumbnailBase64,
          x: dropX - displayWidth / 2 + offsetX,
          y: dropY - displayHeight / 2 + offsetY,
          width: displayWidth,
          height: displayHeight,
          naturalWidth: result.naturalWidth,
          naturalHeight: result.naturalHeight,
          fileSize: result.fileSize,
          mimeType: result.mimeType,
          opacity: 1,
          scaleX: 1,
          scaleY: 1,
          userId: currentUser.id,
          createdAt: new Date(),
          updatedAt: new Date(),
          zIndex: getNextZIndex(),
        };

        // Add to canvas
        addObject(imageObject);
        await createObject(imageObject);
        addToast(`Imported ${file.name}`, "success");
      } catch (error) {
        console.error(`Failed to import ${file.name}:`, error);
        addToast(
          error instanceof Error
            ? error.message
            : `Failed to import ${file.name}`,
          "error"
        );
      }
    }

    if (imageFiles.length > 1) {
      addToast(`Successfully imported ${imageFiles.length} images`, "success");
    }
  };

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
        clearSelection();
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
          const newId = uuidv4();
          const textObject: CanvasObject = {
            id: newId,
            type: "text",
            x,
            y,
            text: "Enter text",
            fontSize: DEFAULT_TEXT_STYLE.fontSize,
            fontFamily: DEFAULT_TEXT_STYLE.fontFamily,
            fill: DEFAULT_TEXT_STYLE.fill,
            userId,
            createdAt: new Date(),
            zIndex: getNextZIndex(),
          };
          await createObject(textObject);

          // Auto-select the newly created object and switch to select mode
          clearSelection();
          addToSelection(newId);
          setTool("select");
        } else if (clickedOnBackground) {
          setIsPanning(true);
          setPanStart({ x: e.evt.clientX, y: e.evt.clientY });
        }
      } else if (tool === "pan") {
        // Pan mode: drag anywhere to pan
        setIsPanning(true);
        setPanStart({ x: e.evt.clientX, y: e.evt.clientY });
      } else if (tool === "select") {
        // Select mode: Start drag selection on canvas
        if (clickedOnCanvas) {
          setIsSelecting(true);
          setSelectionBox({
            startX: x,
            startY: y,
            currentX: x,
            currentY: y,
          });
        } else if (clickedOnBackground) {
          setIsPanning(true);
          setPanStart({ x: e.evt.clientX, y: e.evt.clientY });
        }
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
    } else if (isSelecting && selectionBox) {
      // Handle selection box drag
      const stage = stageRef.current;
      const point = stage.getPointerPosition();

      // Convert screen coordinates to canvas coordinates
      let x = (point.x - position.x) / scale;
      let y = (point.y - position.y) / scale;

      // Clamp coordinates to canvas bounds
      x = Math.max(0, Math.min(x, canvasSize.width));
      y = Math.max(0, Math.min(y, canvasSize.height));

      setSelectionBox({
        ...selectionBox,
        currentX: x,
        currentY: y,
      });
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

  // Helper function to check if object intersects with selection box
  const objectIntersectsBox = (
    obj: CanvasObject,
    boxX: number,
    boxY: number,
    boxWidth: number,
    boxHeight: number
  ): boolean => {
    switch (obj.type) {
      case "rectangle": {
        // Check if rectangles intersect
        return !(
          obj.x > boxX + boxWidth ||
          obj.x + obj.width < boxX ||
          obj.y > boxY + boxHeight ||
          obj.y + obj.height < boxY
        );
      }
      case "circle": {
        // Check if circle intersects with box
        // Find closest point on box to circle center
        const closestX = Math.max(boxX, Math.min(obj.x, boxX + boxWidth));
        const closestY = Math.max(boxY, Math.min(obj.y, boxY + boxHeight));
        const dx = obj.x - closestX;
        const dy = obj.y - closestY;
        return dx * dx + dy * dy <= obj.radius * obj.radius;
      }
      case "line": {
        // Check if line intersects with box
        const [x1, y1, x2, y2] = obj.points;
        // Check if either endpoint is inside box
        const point1Inside =
          x1 >= boxX &&
          x1 <= boxX + boxWidth &&
          y1 >= boxY &&
          y1 <= boxY + boxHeight;
        const point2Inside =
          x2 >= boxX &&
          x2 <= boxX + boxWidth &&
          y2 >= boxY &&
          y2 <= boxY + boxHeight;
        return point1Inside || point2Inside;
      }
      case "text": {
        // Check if text box intersects with selection box
        const textWidth = obj.width || 100; // Default width if not set
        const textHeight = obj.fontSize * 1.2; // Approximate height
        return !(
          obj.x > boxX + boxWidth ||
          obj.x + textWidth < boxX ||
          obj.y > boxY + boxHeight ||
          obj.y + textHeight < boxY
        );
      }
      default:
        return false;
    }
  };

  // Handle mouse up to finish drawing or panning
  const handleMouseUp = async () => {
    if (isPanning) {
      setIsPanning(false);
      setPanStart(null);
      return;
    }

    // Handle selection box completion
    if (isSelecting && selectionBox) {
      setIsSelecting(false);

      // Calculate selection box bounds
      const boxX = Math.min(selectionBox.startX, selectionBox.currentX);
      const boxY = Math.min(selectionBox.startY, selectionBox.currentY);
      const boxWidth = Math.abs(selectionBox.currentX - selectionBox.startX);
      const boxHeight = Math.abs(selectionBox.currentY - selectionBox.startY);

      // Find all objects that intersect with selection box
      const selectedIds = new Set<string>();
      objects.forEach((obj) => {
        if (objectIntersectsBox(obj, boxX, boxY, boxWidth, boxHeight)) {
          selectedIds.add(obj.id);
        }
      });

      // Update selection
      setSelectedObjectIds(selectedIds);
      setSelectionBox(null);
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
          const newId = uuidv4();
          const finalRect: CanvasObject = {
            id: newId,
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
            zIndex: getNextZIndex(),
          };

          await createObject(finalRect);

          // Auto-select the newly created object and switch to select mode
          clearSelection();
          addToSelection(newId);
          setTool("select");
        }
      }
      setNewRect(null);
    }

    // Create circle
    if (newCircle) {
      // Only create if circle is large enough (radius at least 5)
      if (newCircle.radius > 5) {
        const x = newCircle.x;
        const y = newCircle.y;
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
          const newId = uuidv4();
          const finalCircle: CanvasObject = {
            id: newId,
            type: "circle",
            x,
            y,
            radius,
            fill: DEFAULT_CIRCLE_STYLE.fill,
            stroke: DEFAULT_CIRCLE_STYLE.stroke,
            strokeWidth: DEFAULT_CIRCLE_STYLE.strokeWidth,
            userId,
            createdAt: new Date(),
            zIndex: getNextZIndex(),
          };

          await createObject(finalCircle);

          // Auto-select the newly created object and switch to select mode
          clearSelection();
          addToSelection(newId);
          setTool("select");
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
        const newId = uuidv4();
        const finalLine: CanvasObject = {
          id: newId,
          type: "line",
          points: newLine.points,
          stroke: DEFAULT_LINE_STYLE.stroke,
          strokeWidth: DEFAULT_LINE_STYLE.strokeWidth,
          userId,
          createdAt: new Date(),
          zIndex: getNextZIndex(),
        };

        await createObject(finalLine);

        // Auto-select the newly created object and switch to select mode
        clearSelection();
        addToSelection(newId);
        setTool("select");
      }
      setNewLine(null);
    }
  };

  // Handle group drag start
  const handleGroupDragStart = (draggedObjectId: string) => {
    // Only enable group drag if multiple objects are selected
    if (selectedObjectIds.size > 1 && selectedObjectIds.has(draggedObjectId)) {
      const startPositions = new Map<string, { x: number; y: number }>();

      selectedObjectIds.forEach((id) => {
        const obj = objects.get(id);
        if (obj) {
          if (
            obj.type === "rectangle" ||
            obj.type === "circle" ||
            obj.type === "text"
          ) {
            startPositions.set(id, { x: obj.x, y: obj.y });
          } else if (obj.type === "line") {
            // For lines, store the first point as reference
            startPositions.set(id, { x: obj.points[0], y: obj.points[1] });
          }
        }
      });

      setGroupDragStart(startPositions);
    }
  };

  // Handle group drag move
  const handleGroupDragMove = (
    draggedObjectId: string,
    newX: number,
    newY: number
  ) => {
    if (!groupDragStart || !groupDragStart.has(draggedObjectId)) return;

    const startPos = groupDragStart.get(draggedObjectId)!;
    const dx = newX - startPos.x;
    const dy = newY - startPos.y;

    // Apply the same offset to all selected objects
    selectedObjectIds.forEach((id) => {
      if (id === draggedObjectId) return; // Skip the dragged one, it's handled by Konva

      const startPosition = groupDragStart.get(id);
      if (!startPosition) return;

      const obj = objects.get(id);
      if (!obj) return;

      if (
        obj.type === "rectangle" ||
        obj.type === "circle" ||
        obj.type === "text"
      ) {
        updateObject(id, {
          x: startPosition.x + dx,
          y: startPosition.y + dy,
        });
      } else if (obj.type === "line") {
        const [x1, y1, x2, y2] = obj.points;
        updateObject(id, {
          points: [
            startPosition.x + dx,
            startPosition.y + dy,
            x2 - x1 + startPosition.x + dx,
            y2 - y1 + startPosition.y + dy,
          ] as [number, number, number, number],
        });
      }
    });
  };

  // Handle group drag end
  const handleGroupDragEnd = () => {
    if (!groupDragStart) return;

    // Sync all moved objects to Firestore (throttled updates)
    selectedObjectIds.forEach((id) => {
      const obj = objects.get(id);
      if (!obj) return;

      if (
        obj.type === "rectangle" ||
        obj.type === "circle" ||
        obj.type === "text"
      ) {
        updateObjectInFirestore(id, { x: obj.x, y: obj.y });
      } else if (obj.type === "line") {
        updateObjectInFirestore(id, { points: obj.points });
      }
    });

    setGroupDragStart(null);
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
    <div
      className="w-full h-full overflow-hidden bg-gray-50 relative"
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
    >
      {/* Drag-over overlay */}
      {isDragOver && (
        <div className="absolute inset-0 bg-blue-500 bg-opacity-10 border-4 border-dashed border-blue-500 z-50 flex items-center justify-center pointer-events-none">
          <div className="bg-white px-6 py-4 rounded-lg shadow-lg">
            <p className="text-lg font-semibold text-gray-800">
              Drop images here to import
            </p>
          </div>
        </div>
      )}
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
            selectedIds={selectedObjectIds}
            onlineUsers={onlineUsers}
            onObjectChange={handleObjectChange}
            onGroupDragStart={handleGroupDragStart}
            onGroupDragMove={handleGroupDragMove}
            onGroupDragEnd={handleGroupDragEnd}
            tool={tool}
            onDelete={deleteObject}
            onTextDoubleClick={handleTextDoubleClick}
            userId={userId}
            canvasId={canvasId}
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

          {/* Show selection box */}
          {selectionBox && <SelectionBox selectionBox={selectionBox} />}
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
