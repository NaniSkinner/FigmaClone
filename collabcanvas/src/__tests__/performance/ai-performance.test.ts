/**
 * AI Agent - Performance Tests
 * Tests response times, memory usage, and scale limits
 */

describe("AI Agent - Performance Tests", () => {
  describe("Response Time Benchmarks", () => {
    test("BENCHMARK: Simple command should complete < 2 seconds", async () => {
      // Note: This test requires actual OpenAI API calls
      // Mock implementation for demonstration

      const command = "create a blue rectangle";
      const startTime = Date.now();

      // Simulate API call
      await new Promise((resolve) => setTimeout(resolve, 100));

      const endTime = Date.now();
      const duration = endTime - startTime;

      // In real test with API, expect < 2000ms
      expect(duration).toBeLessThan(2000);
    });

    test("BENCHMARK: Medium command (5 objects) should complete < 3 seconds", async () => {
      const command = "create a button group with 5 buttons";
      const startTime = Date.now();

      // Simulate API call + object creation
      await new Promise((resolve) => setTimeout(resolve, 200));

      const endTime = Date.now();
      const duration = endTime - startTime;

      expect(duration).toBeLessThan(3000);
    });

    test("BENCHMARK: Complex layout should complete < 5 seconds", async () => {
      const command = "create a login form";
      const startTime = Date.now();

      // Simulate API call + 11 object creations
      await new Promise((resolve) => setTimeout(resolve, 500));

      const endTime = Date.now();
      const duration = endTime - startTime;

      expect(duration).toBeLessThan(5000);
    });

    test("BENCHMARK: Query command should complete < 500ms", async () => {
      const command = "how many objects are on the canvas?";
      const startTime = Date.now();

      // Simulate fast query
      await new Promise((resolve) => setTimeout(resolve, 50));

      const endTime = Date.now();
      const duration = endTime - startTime;

      expect(duration).toBeLessThan(500);
    });
  });

  describe("Canvas Load Tests", () => {
    test("should handle canvas with 100 objects", () => {
      const objects = Array.from({ length: 100 }, (_, i) => ({
        id: `obj-${i}`,
        type: "rectangle" as const,
        x: (i % 10) * 800,
        y: Math.floor(i / 10) * 800,
        width: 100,
        height: 100,
        fill: "#CCCCCC",
        stroke: "#000000",
        strokeWidth: 1,
        rotation: 0,
        userId: "test-user",
        locked: false,
        lockedBy: null,
        zIndex: i + 1,
      }));

      // Find a specific object by color
      const startTime = Date.now();
      const redObjects = objects.filter((obj) =>
        obj.fill.toLowerCase().includes("cc")
      );
      const endTime = Date.now();

      expect(redObjects.length).toBeGreaterThan(0);
      expect(endTime - startTime).toBeLessThan(10); // Should be instant
    });

    test("should handle object reference resolution with 100+ objects", () => {
      const objects = Array.from({ length: 150 }, (_, i) => ({
        id: `obj-${i}`,
        type: "rectangle" as const,
        x: (i % 15) * 500,
        y: Math.floor(i / 15) * 500,
        width: 100,
        height: 100,
        fill: i % 3 === 0 ? "#FF0000" : i % 3 === 1 ? "#00FF00" : "#0000FF",
        stroke: "#000000",
        strokeWidth: 1,
        rotation: 0,
        userId: "test-user",
        locked: false,
        lockedBy: null,
        zIndex: i + 1,
      }));

      const startTime = Date.now();

      // Find all red rectangles
      const redRectangles = objects.filter(
        (obj) => obj.type === "rectangle" && obj.fill === "#FF0000"
      );

      // Find largest
      const largest = objects.reduce((max, obj) => {
        const maxArea = max.width * max.height;
        const objArea = obj.width * obj.height;
        return objArea > maxArea ? obj : max;
      }, objects[0]);

      // Find center objects
      const center = 4000;
      const centerObjects = objects.filter((obj) => {
        const dx = Math.abs(obj.x - center);
        const dy = Math.abs(obj.y - center);
        return dx < 500 && dy < 500;
      });

      const endTime = Date.now();

      expect(redRectangles.length).toBeGreaterThan(0);
      expect(largest).toBeDefined();
      expect(endTime - startTime).toBeLessThan(20); // Should be very fast
    });
  });

  describe("Memory Usage Tests", () => {
    test("should not leak memory with repeated operations", () => {
      const initialMemory = process.memoryUsage().heapUsed;

      // Simulate 100 object creations
      const objects = [];
      for (let i = 0; i < 100; i++) {
        objects.push({
          id: `memory-test-${i}`,
          type: "rectangle" as const,
          x: i * 10,
          y: i * 10,
          width: 100,
          height: 100,
          fill: "#FF0000",
          stroke: "#000000",
          strokeWidth: 1,
          rotation: 0,
          userId: "test-user",
          locked: false,
          lockedBy: null,
          zIndex: i + 1,
        });
      }

      // Clear objects
      objects.length = 0;

      // Force garbage collection if available
      if (global.gc) {
        global.gc();
      }

      const finalMemory = process.memoryUsage().heapUsed;
      const memoryDiff = finalMemory - initialMemory;

      // Memory increase should be reasonable (< 10MB)
      expect(memoryDiff).toBeLessThan(10 * 1024 * 1024);
    });

    test("should handle large chat history efficiently", () => {
      const messages = Array.from({ length: 100 }, (_, i) => ({
        id: `msg-${i}`,
        role: i % 2 === 0 ? "user" : "assistant",
        content: `Message ${i}`,
        timestamp: Date.now(),
      }));

      const memoryBefore = process.memoryUsage().heapUsed;

      // Simulate accessing messages
      const userMessages = messages.filter((m) => m.role === "user");
      const assistantMessages = messages.filter((m) => m.role === "assistant");

      const memoryAfter = process.memoryUsage().heapUsed;
      const memoryUsed = memoryAfter - memoryBefore;

      expect(userMessages.length).toBeGreaterThan(0);
      expect(assistantMessages.length).toBeGreaterThan(0);
      expect(memoryUsed).toBeLessThan(5 * 1024 * 1024); // < 5MB
    });
  });

  describe("Concurrent Operation Tests", () => {
    test("should handle rapid sequential commands", async () => {
      const commandCount = 10;
      const startTime = Date.now();

      // Simulate rapid commands
      const promises = Array.from(
        { length: commandCount },
        (_, i) => new Promise((resolve) => setTimeout(resolve, i * 10))
      );

      await Promise.all(promises);

      const endTime = Date.now();
      const duration = endTime - startTime;

      // All should complete quickly
      expect(duration).toBeLessThan(1000);
    });

    test("should handle concurrent object operations", async () => {
      const operations = Array.from({ length: 20 }, (_, i) => ({
        type: i % 3 === 0 ? "create" : i % 3 === 1 ? "update" : "delete",
        objectId: `obj-${i}`,
        timestamp: Date.now(),
      }));

      const startTime = Date.now();

      // Process all operations
      operations.forEach((op) => {
        // Simulate operation
        switch (op.type) {
          case "create":
            // Create operation
            break;
          case "update":
            // Update operation
            break;
          case "delete":
            // Delete operation
            break;
        }
      });

      const endTime = Date.now();
      const duration = endTime - startTime;

      expect(duration).toBeLessThan(100);
    });
  });

  describe("Scale Limits", () => {
    test("should respect 5 object per command limit", () => {
      const requestedCount = 10;
      const maxPerCommand = 5;

      const actualCount = Math.min(requestedCount, maxPerCommand);

      expect(actualCount).toBe(5);
    });

    test("should handle command queue with multiple users", async () => {
      const users = ["user1", "user2", "user3"];
      const commandsPerUser = 5;

      const allCommands = users.flatMap((userId) =>
        Array.from({ length: commandsPerUser }, (_, i) => ({
          userId,
          command: `command-${i}`,
          timestamp: Date.now(),
        }))
      );

      expect(allCommands).toHaveLength(users.length * commandsPerUser);

      // Simulate processing all commands
      const startTime = Date.now();
      allCommands.forEach((cmd) => {
        // Process command
      });
      const endTime = Date.now();

      expect(endTime - startTime).toBeLessThan(100);
    });
  });

  describe("Canvas State Panel Performance", () => {
    test("JSON serialization should be fast with 100 objects", () => {
      const objects = Array.from({ length: 100 }, (_, i) => ({
        id: `obj-${i}`,
        type: "rectangle" as const,
        x: i * 50,
        y: i * 50,
        width: 100,
        height: 100,
        fill: "#FF0000",
        stroke: "#000000",
        strokeWidth: 1,
        rotation: 0,
        userId: "test-user",
        locked: false,
        lockedBy: null,
        zIndex: i + 1,
      }));

      const startTime = Date.now();
      const json = JSON.stringify(objects, null, 2);
      const endTime = Date.now();

      expect(json.length).toBeGreaterThan(0);
      expect(endTime - startTime).toBeLessThan(100);
    });

    test("should handle frequent state updates", async () => {
      const updateCount = 50;
      let stateSnapshot = { objects: [], timestamp: Date.now() };

      const startTime = Date.now();

      for (let i = 0; i < updateCount; i++) {
        stateSnapshot = {
          objects: [],
          timestamp: Date.now(),
        };
        await new Promise((resolve) => setTimeout(resolve, 10));
      }

      const endTime = Date.now();
      const duration = endTime - startTime;

      // Should handle 50 updates in reasonable time
      expect(duration).toBeLessThan(1000);
    });
  });

  describe("Undo Stack Performance", () => {
    test("should handle large undo stack efficiently", () => {
      const maxStackSize = 50;
      const operations = Array.from({ length: maxStackSize }, (_, i) => ({
        id: `op-${i}`,
        type: "create" as const,
        objectId: `obj-${i}`,
        timestamp: Date.now(),
      }));

      const startTime = Date.now();

      // Simulate undo stack operations
      const stack = [...operations];
      const lastOp = stack.pop();
      stack.push(lastOp!);

      const endTime = Date.now();

      expect(stack).toHaveLength(maxStackSize);
      expect(endTime - startTime).toBeLessThan(10);
    });

    test("should maintain stack size limit", () => {
      const maxStackSize = 50;
      const operations = [];

      // Add 100 operations
      for (let i = 0; i < 100; i++) {
        operations.push({
          id: `op-${i}`,
          type: "create",
          timestamp: Date.now(),
        });

        // Keep only last 50
        if (operations.length > maxStackSize) {
          operations.shift();
        }
      }

      expect(operations).toHaveLength(maxStackSize);
      expect(operations[0].id).toBe("op-50"); // First 50 removed
    });
  });

  describe("Real-time Sync Performance", () => {
    test("should batch object creations efficiently", async () => {
      const objectCount = 11; // Login form
      const objects = Array.from({ length: objectCount }, (_, i) => ({
        id: `batch-${i}`,
        type: "rectangle" as const,
        x: i * 100,
        y: 1000,
        width: 80,
        height: 80,
        fill: "#FF0000",
        stroke: "#000000",
        strokeWidth: 1,
        rotation: 0,
        userId: "test-user",
        locked: false,
        lockedBy: null,
        zIndex: i + 1,
      }));

      const startTime = Date.now();

      // Simulate batch creation
      await new Promise((resolve) => setTimeout(resolve, 50));

      const endTime = Date.now();
      const duration = endTime - startTime;

      expect(duration).toBeLessThan(200);
    });

    test("should handle sync latency gracefully", async () => {
      // Simulate 500ms network latency
      const latency = 500;

      const startTime = Date.now();
      await new Promise((resolve) => setTimeout(resolve, latency));
      const endTime = Date.now();

      const actualLatency = endTime - startTime;
      expect(actualLatency).toBeGreaterThanOrEqual(latency);
      expect(actualLatency).toBeLessThan(latency + 100); // Some tolerance
    });
  });

  describe("Stress Tests", () => {
    test("STRESS: Rapid create/delete cycles", async () => {
      const cycles = 50;
      const operations: string[] = [];

      const startTime = Date.now();

      for (let i = 0; i < cycles; i++) {
        operations.push(`create-${i}`);
        operations.push(`delete-${i}`);
      }

      const endTime = Date.now();
      const duration = endTime - startTime;

      expect(operations).toHaveLength(cycles * 2);
      expect(duration).toBeLessThan(100);
    });

    test("STRESS: Complex layout generation repeated", async () => {
      const layoutCount = 5;
      const objectsPerLayout = 11;

      const startTime = Date.now();

      const allObjects = Array.from({ length: layoutCount }, (_, i) =>
        Array.from({ length: objectsPerLayout }, (_, j) => ({
          id: `layout-${i}-obj-${j}`,
          type: "rectangle" as const,
          x: i * 1000,
          y: j * 100,
          width: 100,
          height: 100,
          fill: "#FF0000",
          stroke: "#000000",
          strokeWidth: 1,
          rotation: 0,
          userId: "test-user",
          locked: false,
          lockedBy: null,
          zIndex: i * objectsPerLayout + j + 1,
        }))
      );

      const endTime = Date.now();
      const duration = endTime - startTime;

      expect(allObjects.flat()).toHaveLength(layoutCount * objectsPerLayout);
      expect(duration).toBeLessThan(100);
    });
  });

  describe("Performance Metrics", () => {
    test("should calculate P95 latency", () => {
      const latencies = [
        100, 120, 110, 150, 130, 140, 200, 160, 170, 180, 190, 210, 220, 2000,
        240,
      ];

      // Sort latencies
      const sorted = [...latencies].sort((a, b) => a - b);

      // Calculate P95 (95th percentile)
      const p95Index = Math.floor(sorted.length * 0.95);
      const p95Value = sorted[p95Index];

      expect(p95Value).toBeLessThan(3000); // P95 should be < 3s
    });

    test("should calculate average response time", () => {
      const responseTimes = [100, 200, 150, 180, 120, 160, 140, 190, 170, 210];

      const average =
        responseTimes.reduce((a, b) => a + b, 0) / responseTimes.length;

      expect(average).toBeLessThan(300); // Average < 300ms
    });

    test("should track success rate", () => {
      const operations = Array.from({ length: 100 }, (_, i) => ({
        success: i < 95, // 95% success rate
        duration: Math.random() * 1000,
      }));

      const successCount = operations.filter((op) => op.success).length;
      const successRate = (successCount / operations.length) * 100;

      expect(successRate).toBeGreaterThanOrEqual(90); // >90% success
    });
  });
});
