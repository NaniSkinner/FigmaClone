"use client";

/**
 * AIChatPanel Component
 *
 * AI-powered chat interface for canvas manipulation via natural language.
 * Features:
 * - Draggable positioning
 * - Message history with user/assistant distinction
 * - Command input with example suggestions
 * - Real-time AI processing with visual feedback
 * - Typing indicators
 * - Error handling with retry options
 *
 * Reference: aiPRD.md Section 4.2 - AI Canvas Agent UI
 * Reference: aiTasks.md Task 8 - Chat UI Component
 */

import { useState, useEffect, useRef, useCallback } from "react";
import { CanvasAIAgent } from "@/lib/ai/agent";
import { useCanvasContext } from "@/hooks/useCanvasContext";
import { useCanvasStore } from "@/store/canvasStore";
import { AIChatMessage } from "@/types/ai";
import { CanvasObject } from "@/types/canvas";

interface AIChatPanelProps {
  userId: string;
  canvasId?: string; // Optional canvas ID for operation logging
  onCreateObject: (object: CanvasObject) => void;
  onUpdateObject: (id: string, updates: Partial<CanvasObject>) => void;
  onDeleteObject: (id: string) => void;
  onRecordCreate?: (
    objectIdsOrObjects: string[] | CanvasObject[],
    source?: "ai" | "manual",
    aiOperationId?: string
  ) => void;
  onRecordUpdate?: (
    objectIds: string[],
    previousStates: CanvasObject[],
    source?: "ai" | "manual",
    aiOperationId?: string
  ) => void;
  onRecordDelete?: (
    deletedObjects: CanvasObject[],
    source?: "ai" | "manual",
    aiOperationId?: string
  ) => void;
}

// Example commands by category
const EXAMPLE_COMMANDS = {
  basic: [
    "Create a blue rectangle at the center",
    "Add text that says 'Hello World'",
    "Create a red circle with radius 80",
  ],
  manipulation: [
    "Move the blue rectangle to 500, 300",
    "Rotate the circle by 45 degrees",
    "Resize the rectangle to 200x150",
  ],
  complex: [
    "Create a login form",
    "Build a navigation bar with Home, About, Contact",
    "Design a card component",
  ],
  layout: [
    "Arrange all rectangles horizontally",
    "Create a grid of 3x3 circles",
    "Space all objects evenly",
  ],
};

export function AIChatPanel({
  userId,
  canvasId,
  onCreateObject,
  onUpdateObject,
  onDeleteObject,
  onRecordCreate,
  onRecordUpdate,
  onRecordDelete,
}: AIChatPanelProps) {
  const { getCanvasContext, findObjectByDescription } = useCanvasContext();
  const getNextZIndex = useCanvasStore((state) => state.getNextZIndex);

  // Set userId globally for API authentication
  // This allows the APIRouteClient to access it
  if (typeof window !== "undefined") {
    (globalThis as any).__userId = userId;
  }

  // Panel state
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<AIChatMessage[]>([]);
  const [input, setInput] = useState("");
  const [isProcessing, setIsProcessing] = useState(false);
  const [showExamples, setShowExamples] = useState(true);

  // Dragging state
  const [position, setPosition] = useState({
    x: 20,
    y: window.innerHeight - 520,
  });
  const [isDragging, setIsDragging] = useState(false);
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });

  const panelRef = useRef<HTMLDivElement>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const agentRef = useRef<CanvasAIAgent | null>(null);

  // Store latest callbacks in refs to avoid stale closures
  const callbacksRef = useRef({
    onCreateObject,
    onUpdateObject,
    onDeleteObject,
    onRecordCreate,
    onRecordUpdate,
    onRecordDelete,
    getCanvasContext,
    findObjectByDescription,
    getNextZIndex,
  });

  // Update refs whenever callbacks change
  useEffect(() => {
    callbacksRef.current = {
      onCreateObject,
      onUpdateObject,
      onDeleteObject,
      onRecordCreate,
      onRecordUpdate,
      onRecordDelete,
      getCanvasContext,
      findObjectByDescription,
      getNextZIndex,
    };
  }, [
    onCreateObject,
    onUpdateObject,
    onDeleteObject,
    onRecordCreate,
    onRecordUpdate,
    onRecordDelete,
    getCanvasContext,
    findObjectByDescription,
    getNextZIndex,
  ]);

  // Initialize AI Agent
  // Only recreate when userId or canvasId changes (new session = new sessionId)
  useEffect(() => {
    agentRef.current = new CanvasAIAgent({
      userId,
      canvasId,
      // Use wrapper functions that call the latest callbacks from refs
      onCreateObject: (obj) => callbacksRef.current.onCreateObject(obj),
      onUpdateObject: (id, updates) =>
        callbacksRef.current.onUpdateObject(id, updates),
      onDeleteObject: (id) => callbacksRef.current.onDeleteObject(id),
      getCanvasContext: () => callbacksRef.current.getCanvasContext(),
      findObjectByDescription: (desc) =>
        callbacksRef.current.findObjectByDescription(desc),
      getNextZIndex: () => callbacksRef.current.getNextZIndex(),
      // Undo recording callbacks
      onRecordCreate: (objectIdsOrObjects, source, aiOperationId) => {
        callbacksRef.current.onRecordCreate?.(
          objectIdsOrObjects,
          source,
          aiOperationId
        );
      },
      onRecordUpdate: (objectIds, previousStates, source, aiOperationId) => {
        callbacksRef.current.onRecordUpdate?.(
          objectIds,
          previousStates,
          source,
          aiOperationId
        );
      },
      onRecordDelete: (deletedObjects, source, aiOperationId) => {
        callbacksRef.current.onRecordDelete?.(
          deletedObjects,
          source,
          aiOperationId
        );
      },
    });
  }, [userId, canvasId]); // Only depend on userId and canvasId

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // Focus input when panel opens
  useEffect(() => {
    if (isOpen && inputRef.current) {
      inputRef.current.focus();
    }
  }, [isOpen]);

  // Handle drag start
  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    if ((e.target as HTMLElement).closest("button")) return;
    if ((e.target as HTMLElement).closest("textarea")) return;
    if ((e.target as HTMLElement).closest("input")) return;

    const rect = panelRef.current?.getBoundingClientRect();
    if (!rect) return;

    setIsDragging(true);
    setDragOffset({
      x: e.clientX - rect.left,
      y: e.clientY - rect.top,
    });
  }, []);

  // Handle dragging
  useEffect(() => {
    if (!isDragging) return;

    const handleMouseMove = (e: MouseEvent) => {
      const newX = e.clientX - dragOffset.x;
      const newY = e.clientY - dragOffset.y;

      const maxX = window.innerWidth - 420;
      const maxY = window.innerHeight - 520;

      setPosition({
        x: Math.max(0, Math.min(newX, maxX)),
        y: Math.max(0, Math.min(newY, maxY)),
      });
    };

    const handleMouseUp = () => {
      setIsDragging(false);
    };

    document.addEventListener("mousemove", handleMouseMove);
    document.addEventListener("mouseup", handleMouseUp);

    return () => {
      document.removeEventListener("mousemove", handleMouseMove);
      document.removeEventListener("mouseup", handleMouseUp);
    };
  }, [isDragging, dragOffset]);

  // Handle command submission
  const handleSubmit = async () => {
    if (!input.trim() || isProcessing || !agentRef.current) return;

    const userMessage: AIChatMessage = {
      id: crypto.randomUUID(),
      role: "user",
      content: input.trim(),
      timestamp: new Date(),
      status: "success",
    };

    setMessages((prev) => [...prev, userMessage]);
    setInput("");
    setIsProcessing(true);
    setShowExamples(false);

    // Add "thinking" message
    const thinkingMessage: AIChatMessage = {
      id: crypto.randomUUID(),
      role: "assistant",
      content: "AI is thinking...",
      timestamp: new Date(),
      status: "pending",
    };
    setMessages((prev) => [...prev, thinkingMessage]);

    try {
      // Process command with AI agent
      const response = await agentRef.current.processCommand(
        userMessage.content
      );

      // Remove thinking message and add real response
      setMessages((prev) => {
        const filtered = prev.filter((m) => m.id !== thinkingMessage.id);

        // Generate user-friendly error message based on error type
        let displayMessage = response.message;
        let messageStatus: "success" | "error" | "info" = response.success
          ? "success"
          : "error";

        if (!response.success && response.errorType) {
          switch (response.errorType) {
            case "timeout":
              displayMessage =
                "⏱️ Request timed out. The AI service took too long to respond. Please try again or simplify your command.";
              break;
            case "rate_limit":
              displayMessage =
                "🚦 Rate limit reached. You've made too many requests. Please wait a moment (30-60 seconds) before trying again.";
              break;
            case "server_error":
              displayMessage =
                "🔧 AI service is temporarily unavailable. The service is experiencing issues. Please try again in a few minutes.";
              break;
            default:
              displayMessage = `❌ ${
                response.message ||
                "An unexpected error occurred. Please try again."
              }`;
          }
        } else if (response.success) {
          // Detect clarification questions (not errors, just asking for more info)
          const isQuestion =
            displayMessage.includes("?") ||
            displayMessage.startsWith("Could you") ||
            displayMessage.startsWith("Please provide") ||
            displayMessage.startsWith("Please specify") ||
            displayMessage.startsWith("Which") ||
            displayMessage.startsWith("Where would you like") ||
            displayMessage.startsWith("What") ||
            displayMessage.includes("clarification") ||
            displayMessage.includes("more information");

          if (
            isQuestion &&
            (!response.actions || response.actions.length === 0)
          ) {
            messageStatus = "info";
          }
        }

        return [
          ...filtered,
          {
            id: crypto.randomUUID(),
            role: "assistant",
            content: displayMessage,
            timestamp: new Date(),
            status: messageStatus,
            actions: response.actions,
          },
        ];
      });
    } catch (error) {
      // Remove thinking message and add error
      setMessages((prev) => {
        const filtered = prev.filter((m) => m.id !== thinkingMessage.id);
        return [
          ...filtered,
          {
            id: crypto.randomUUID(),
            role: "assistant",
            content: `❌ Sorry, I encountered an unexpected error: ${
              error instanceof Error ? error.message : "Unknown error"
            }. Please try again.`,
            timestamp: new Date(),
            status: "error",
          },
        ];
      });
    } finally {
      setIsProcessing(false);
    }
  };

  // Handle Enter key (Shift+Enter for new line)
  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
  };

  // Handle example command click
  const handleExampleClick = (command: string) => {
    setInput(command);
    inputRef.current?.focus();
  };

  // Clear chat history
  const handleClearChat = () => {
    setMessages([]);
    setShowExamples(true);
  };

  // Format timestamp
  const formatTime = (date: Date) => {
    return date.toLocaleTimeString("en-US", {
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  if (!isOpen) {
    return (
      <button
        onClick={() => setIsOpen(true)}
        className="fixed bottom-6 left-6 z-40 w-28 h-28 bg-gradient-to-br from-green-500 to-purple-500 hover:from-green-600 hover:to-purple-600 text-white rounded-full shadow-lg flex items-center justify-center text-6xl transition-all duration-300 hover:scale-110 animate-pulse"
        title="Open AI Chat"
      >
        🤖
      </button>
    );
  }

  return (
    <div
      ref={panelRef}
      className={`fixed z-40 bg-white rounded-lg shadow-2xl border-2 border-gray-200 flex flex-col transition-all duration-300 ${
        isDragging ? "cursor-grabbing" : "cursor-grab"
      }`}
      style={{
        left: `${position.x}px`,
        top: `${position.y}px`,
        width: "420px",
        height: "520px",
      }}
      onMouseDown={handleMouseDown}
    >
      {/* Header */}
      <div className="bg-gradient-to-r from-green-500 to-purple-500 text-white px-4 py-3 rounded-t-lg flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="text-xl">🤖</span>
          <div>
            <h3 className="font-bold text-sm">Matchi AI Assistant</h3>
            <p className="text-xs opacity-90">
              {isProcessing ? "Processing..." : "Ready to help"}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={handleClearChat}
            className="px-2 py-1 bg-white/20 hover:bg-white/30 rounded text-xs font-medium transition-colors"
            title="Clear chat"
          >
            Clear
          </button>
          <button
            onClick={() => setIsOpen(false)}
            className="w-6 h-6 flex items-center justify-center hover:bg-white/20 rounded transition-colors"
            title="Close"
          >
            ✕
          </button>
        </div>
      </div>

      {/* Messages Area */}
      <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-gray-50">
        {messages.length === 0 && (
          <div className="text-center text-gray-500 py-8">
            <div className="text-4xl mb-2">👋</div>
            <p className="text-sm font-medium">
              Hi! I&apos;m Matchi your AI helper
            </p>
            <p className="text-xs mt-1">
              Try the examples below or type your own command!
            </p>
          </div>
        )}

        {messages.map((message) => (
          <div
            key={message.id}
            className={`flex ${
              message.role === "user" ? "justify-end" : "justify-start"
            }`}
          >
            <div
              className={`max-w-[85%] rounded-lg px-3 py-2 ${
                message.role === "user"
                  ? "bg-green-500 text-white"
                  : message.status === "error"
                  ? "bg-red-100 text-red-800 border border-red-300"
                  : message.status === "pending"
                  ? "bg-gray-200 text-gray-600 animate-pulse"
                  : message.status === "info"
                  ? "bg-blue-50 text-blue-900 border border-blue-200"
                  : "bg-white text-gray-800 border border-gray-200"
              }`}
            >
              <p className="text-sm whitespace-pre-wrap break-words">
                {message.content}
              </p>
              {message.actions && message.actions.length > 0 && (
                <div className="mt-2 pt-2 border-t border-gray-300 space-y-1">
                  {message.actions.map((action, idx) => (
                    <div key={idx} className="text-xs flex items-start gap-1">
                      <span>{action.success ? "✓" : "✗"}</span>
                      <span>{action.message}</span>
                    </div>
                  ))}
                </div>
              )}
              <p className="text-xs opacity-70 mt-1">
                {formatTime(message.timestamp)}
              </p>
            </div>
          </div>
        ))}
        <div ref={messagesEndRef} />
      </div>

      {/* Example Commands */}
      {showExamples && messages.length === 0 && (
        <div className="px-4 py-2 border-t border-gray-200 bg-gray-50">
          <p className="text-xs font-medium text-gray-600 mb-2">
            Try these commands:
          </p>
          <div className="space-y-1">
            {EXAMPLE_COMMANDS.basic.slice(0, 3).map((cmd, idx) => (
              <button
                key={idx}
                onClick={() => handleExampleClick(cmd)}
                className="w-full text-left text-xs px-2 py-1.5 bg-white hover:bg-gray-100 border border-gray-200 rounded transition-colors"
              >
                {cmd}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Input Area */}
      <div className="p-3 border-t border-gray-200 bg-white rounded-b-lg">
        <div className="flex gap-2">
          <textarea
            ref={inputRef}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Type your command... (Enter to send, Shift+Enter for new line)"
            className="flex-1 px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent resize-none"
            rows={2}
            disabled={isProcessing}
          />
          <button
            onClick={handleSubmit}
            disabled={!input.trim() || isProcessing}
            className="px-4 py-2 bg-gradient-to-r from-green-500 to-purple-500 hover:from-green-600 hover:to-purple-600 text-white rounded-lg font-medium text-sm disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 hover:scale-105"
          >
            {isProcessing ? "..." : "Send"}
          </button>
        </div>
        <p className="text-xs text-gray-500 mt-1">
          💡 Tip: Try &quot;help&quot; to see all available commands
        </p>
      </div>
    </div>
  );
}
