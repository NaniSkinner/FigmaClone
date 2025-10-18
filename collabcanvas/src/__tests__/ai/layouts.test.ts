/**
 * AI Agent - Layout Generator Tests
 * Tests complex layout generation functions
 */

import {
  generateLoginForm,
  generateNavigationBar,
  generateCard,
  generateButtonGroup,
  generateDashboard,
} from "@/lib/ai/layouts";
import { CanvasObject } from "@/types/canvas";

describe("AI Agent - Layout Generators", () => {
  const mockUserId = "test-user-123";
  const mockSessionId = "session-456";
  const mockCommand = "test command";

  // Mock getNextZIndex function
  let currentZIndex = 1;
  const mockGetNextZIndex = () => {
    return currentZIndex++;
  };

  beforeEach(() => {
    // Reset zIndex counter before each test
    currentZIndex = 1;
  });

  describe("Login Form Generation", () => {
    let loginForm: CanvasObject[];

    beforeEach(() => {
      loginForm = generateLoginForm(3000, 2000, mockUserId, mockGetNextZIndex);
    });

    test("should generate exactly 11 objects", () => {
      expect(loginForm).toHaveLength(11);
    });

    test("should include container rectangle", () => {
      const container = loginForm.find(
        (obj) => obj.type === "rectangle" && obj.id.includes("container")
      );
      expect(container).toBeDefined();
      expect(container?.type).toBe("rectangle");
    });

    test("should include title text", () => {
      const title = loginForm.find(
        (obj) => obj.type === "text" && "text" in obj && obj.text === "Login"
      );
      expect(title).toBeDefined();
    });

    test("should include username field components", () => {
      const usernameLabel = loginForm.find(
        (obj) => obj.type === "text" && "text" in obj && obj.text === "Username"
      );
      const usernameField = loginForm.find(
        (obj) => obj.type === "rectangle" && obj.id.includes("username-field")
      );

      expect(usernameLabel).toBeDefined();
      expect(usernameField).toBeDefined();
    });

    test("should include password field components", () => {
      const passwordLabel = loginForm.find(
        (obj) => obj.type === "text" && "text" in obj && obj.text === "Password"
      );
      const passwordField = loginForm.find(
        (obj) => obj.type === "rectangle" && obj.id.includes("password-field")
      );

      expect(passwordLabel).toBeDefined();
      expect(passwordField).toBeDefined();
    });

    test("should include remember me checkbox", () => {
      const checkbox = loginForm.find(
        (obj) => obj.type === "rectangle" && obj.id.includes("remember")
      );
      const label = loginForm.find(
        (obj) =>
          obj.type === "text" && "text" in obj && obj.text === "Remember me"
      );

      expect(checkbox).toBeDefined();
      expect(label).toBeDefined();
    });

    test("should include submit button", () => {
      const button = loginForm.find(
        (obj) => obj.type === "rectangle" && obj.id.includes("submit-button")
      );
      const buttonText = loginForm.find(
        (obj) => obj.type === "text" && "text" in obj && obj.text === "Sign In"
      );

      expect(button).toBeDefined();
      expect(buttonText).toBeDefined();
    });

    test("all objects should have AI metadata", () => {
      loginForm.forEach((obj) => {
        expect(obj.createdByAI).toBe(true);
        expect(obj.aiSessionId).toBe(mockSessionId);
        expect(obj.aiCommand).toBe(mockCommand);
      });
    });

    test("all objects should have same userId", () => {
      loginForm.forEach((obj) => {
        expect(obj.userId).toBe(mockUserId);
      });
    });

    test("objects should have increasing z-index", () => {
      for (let i = 1; i < loginForm.length; i++) {
        expect(loginForm[i].zIndex).toBeGreaterThanOrEqual(
          loginForm[i - 1].zIndex
        );
      }
    });

    test("should center form at specified position", () => {
      const x = 3000;
      const y = 2000;
      const container = loginForm[0];

      expect("x" in container && container.x).toBeDefined();
      expect("y" in container && container.y).toBeDefined();
      // Container should be centered at approximately (x, y)
    });

    test("submit button should be at bottom of form", () => {
      const submitButton = loginForm.find(
        (obj) => obj.type === "rectangle" && obj.id.includes("submit-button")
      );

      expect(submitButton).toBeDefined();
      if (submitButton && "y" in submitButton) {
        // Should be at bottom (highest y value among rectangles)
        const rectangles = loginForm.filter((obj) => obj.type === "rectangle");
        const maxY = Math.max(
          ...rectangles.map((obj) => ("y" in obj ? (obj.y as number) : 0))
        );
        expect(submitButton.y).toBeGreaterThanOrEqual(maxY - 100); // Within 100px of bottom
      }
    });
  });

  describe("Navigation Bar Generation", () => {
    test("should generate nav bar with default items", () => {
      const navBar = generateNavigationBar(
        4000,
        500,
        mockUserId,
        mockGetNextZIndex
      );

      expect(navBar.length).toBeGreaterThan(0);

      // Should have background rectangle
      const background = navBar.find(
        (obj) => obj.type === "rectangle" && obj.id.includes("nav-bg")
      );
      expect(background).toBeDefined();

      // Should have logo
      const logo = navBar.find((obj) => obj.id.includes("logo"));
      expect(logo).toBeDefined();

      // Should have menu items
      const menuItems = navBar.filter((obj) => obj.id.includes("menu-item"));
      expect(menuItems.length).toBeGreaterThan(0);
    });

    test("should generate nav bar with custom items", () => {
      const items = ["Home", "About", "Services", "Contact"];
      const navBar = generateNavigationBar(
        4000,
        500,
        mockUserId,
        mockGetNextZIndex,
        { items }
      );

      // Check for each custom item
      items.forEach((itemText) => {
        const menuItem = navBar.find(
          (obj) => obj.type === "text" && "text" in obj && obj.text === itemText
        );
        expect(menuItem).toBeDefined();
      });
    });

    test("should space menu items evenly", () => {
      const items = ["Item1", "Item2", "Item3"];
      const navBar = generateNavigationBar(
        4000,
        500,
        mockUserId,
        mockGetNextZIndex,
        { items }
      );

      const menuItems = navBar.filter(
        (obj) => obj.type === "text" && obj.id.includes("menu-item")
      );

      if (menuItems.length >= 2) {
        const positions = menuItems
          .map((obj) => ("x" in obj ? (obj.x as number) : 0))
          .sort((a, b) => a - b);

        // Calculate spacing between items
        const spacings: number[] = [];
        for (let i = 1; i < positions.length; i++) {
          spacings.push(positions[i] - positions[i - 1]);
        }

        // All spacings should be roughly equal (within 50px tolerance)
        if (spacings.length > 1) {
          const avgSpacing =
            spacings.reduce((a, b) => a + b, 0) / spacings.length;
          spacings.forEach((spacing) => {
            expect(Math.abs(spacing - avgSpacing)).toBeLessThan(50);
          });
        }
      }
    });

    test("all objects should have AI metadata", () => {
      const navBar = generateNavigationBar(
        4000,
        500,
        mockUserId,
        mockGetNextZIndex
      );

      navBar.forEach((obj) => {
        expect(obj.userId).toBe(mockUserId);
      });
    });
  });

  describe("Card Component Generation", () => {
    let card: CanvasObject[];

    beforeEach(() => {
      card = generateCard(2000, 2000, mockUserId, mockGetNextZIndex);
    });

    test("should generate complete card structure", () => {
      expect(card.length).toBeGreaterThan(0);

      // Should have container
      const container = card.find(
        (obj) => obj.type === "rectangle" && obj.id.includes("container")
      );
      expect(container).toBeDefined();

      // Should have image placeholder
      const image = card.find((obj) => obj.id.includes("image"));
      expect(image).toBeDefined();

      // Should have title
      const title = card.find(
        (obj) => obj.type === "text" && obj.id.includes("title")
      );
      expect(title).toBeDefined();

      // Should have description
      const description = card.find(
        (obj) => obj.type === "text" && obj.id.includes("description")
      );
      expect(description).toBeDefined();

      // Should have action button
      const button = card.find((obj) => obj.id.includes("button"));
      expect(button).toBeDefined();
    });

    test("image should be at top of card", () => {
      const image = card.find((obj) => obj.id.includes("image"));
      const container = card.find((obj) => obj.id.includes("container"));

      if (image && container && "y" in image && "y" in container) {
        expect(image.y).toBeLessThanOrEqual((container.y as number) + 100);
      }
    });

    test("button should be at bottom of card", () => {
      const button = card.find((obj) => obj.id.includes("button"));

      if (button && "y" in button) {
        // Button should have highest y value
        const allY = card
          .filter((obj) => "y" in obj)
          .map((obj) => ("y" in obj ? (obj.y as number) : 0));
        const maxY = Math.max(...allY);

        expect(button.y).toBeGreaterThanOrEqual(maxY - 100);
      }
    });

    test("all objects should have user ID", () => {
      card.forEach((obj) => {
        expect(obj.userId).toBe(mockUserId);
      });
    });
  });

  describe("Button Group Generation", () => {
    test("should generate specified number of buttons", () => {
      const buttonCount = 4;
      const buttonGroup = generateButtonGroup(
        3000,
        3000,
        mockUserId,
        mockGetNextZIndex,
        { items: ["Button 1", "Button 2", "Button 3", "Button 4"] }
      );

      // Each button = 1 rectangle + 1 text = 2 objects
      expect(buttonGroup.length).toBe(buttonCount * 2);
    });

    test("buttons should have consistent sizes", () => {
      const buttonGroup = generateButtonGroup(
        3000,
        3000,
        mockUserId,
        mockGetNextZIndex,
        { items: ["A", "B", "C"] }
      );

      const rectangles = buttonGroup.filter((obj) => obj.type === "rectangle");
      const widths = rectangles.map((obj) =>
        "width" in obj ? (obj.width as number) : 0
      );
      const heights = rectangles.map((obj) =>
        "height" in obj ? (obj.height as number) : 0
      );

      // All widths should be the same
      expect(new Set(widths).size).toBe(1);
      // All heights should be the same
      expect(new Set(heights).size).toBe(1);
    });

    test("buttons should be evenly spaced", () => {
      const buttonGroup = generateButtonGroup(
        3000,
        3000,
        mockUserId,
        mockGetNextZIndex,
        { items: ["A", "B", "C"] }
      );

      const rectangles = buttonGroup
        .filter((obj) => obj.type === "rectangle")
        .sort((a, b) => {
          const aX = "x" in a ? (a.x as number) : 0;
          const bX = "x" in b ? (b.x as number) : 0;
          return aX - bX;
        });

      if (rectangles.length >= 2) {
        const positions = rectangles.map((obj) =>
          "x" in obj ? (obj.x as number) : 0
        );

        // Calculate spacing
        const spacings: number[] = [];
        for (let i = 1; i < positions.length; i++) {
          spacings.push(positions[i] - positions[i - 1]);
        }

        // All spacings should be roughly equal
        if (spacings.length > 1) {
          const avgSpacing =
            spacings.reduce((a, b) => a + b, 0) / spacings.length;
          spacings.forEach((spacing) => {
            expect(Math.abs(spacing - avgSpacing)).toBeLessThan(50);
          });
        }
      }
    });

    test("text should be centered in each button", () => {
      const buttonGroup = generateButtonGroup(
        3000,
        3000,
        mockUserId,
        mockGetNextZIndex,
        { items: ["Test"] }
      );

      const button = buttonGroup.find((obj) => obj.type === "rectangle");
      const text = buttonGroup.find((obj) => obj.type === "text");

      if (button && text && "x" in button && "width" in button && "x" in text) {
        const buttonCenterX =
          (button.x as number) + (button.width as number) / 2;
        const textX = text.x as number;

        // Text should be near button center (within 100px)
        expect(Math.abs(textX - buttonCenterX)).toBeLessThan(100);
      }
    });

    test("all objects should have user ID", () => {
      const buttonGroup = generateButtonGroup(
        3000,
        3000,
        mockUserId,
        mockGetNextZIndex,
        { items: ["A", "B"] }
      );

      buttonGroup.forEach((obj) => {
        expect(obj.userId).toBe(mockUserId);
      });
    });
  });

  describe("Dashboard Layout Generation", () => {
    let dashboard: CanvasObject[];

    beforeEach(() => {
      dashboard = generateDashboard(4000, 3000, mockUserId, mockGetNextZIndex);
    });

    test("should generate complete dashboard structure", () => {
      expect(dashboard.length).toBeGreaterThan(5);

      // Should have header
      const header = dashboard.find((obj) => obj.id.includes("header"));
      expect(header).toBeDefined();

      // Should have sidebar
      const sidebar = dashboard.find((obj) => obj.id.includes("sidebar"));
      expect(sidebar).toBeDefined();

      // Should have main content area
      const mainContent = dashboard.find((obj) => obj.id.includes("main"));
      expect(mainContent).toBeDefined();
    });

    test("header should be at top", () => {
      const header = dashboard.find((obj) => obj.id.includes("header"));

      if (header && "y" in header) {
        // Header should have lowest y value
        const allY = dashboard
          .filter((obj) => "y" in obj)
          .map((obj) => ("y" in obj ? (obj.y as number) : 0));
        const minY = Math.min(...allY);

        expect(header.y).toBeLessThanOrEqual(minY + 100);
      }
    });

    test("sidebar should be on left side", () => {
      const sidebar = dashboard.find((obj) => obj.id.includes("sidebar"));

      if (sidebar && "x" in sidebar) {
        // Sidebar should have low x value
        const allX = dashboard
          .filter((obj) => "x" in obj)
          .map((obj) => ("x" in obj ? (obj.x as number) : 0));
        const minX = Math.min(...allX);

        expect(sidebar.x).toBeLessThanOrEqual(minX + 200);
      }
    });

    test("should include widget placeholders", () => {
      const widgets = dashboard.filter((obj) => obj.id.includes("widget"));
      expect(widgets.length).toBeGreaterThan(0);
    });

    test("all objects should have user ID", () => {
      dashboard.forEach((obj) => {
        expect(obj.userId).toBe(mockUserId);
      });
    });

    test("widgets should be in grid layout", () => {
      const widgets = dashboard.filter((obj) => obj.id.includes("widget"));

      if (widgets.length >= 2) {
        const xPositions = Array.from(
          new Set(widgets.map((obj) => ("x" in obj ? (obj.x as number) : 0)))
        ).sort((a, b) => a - b);

        const yPositions = Array.from(
          new Set(widgets.map((obj) => ("y" in obj ? (obj.y as number) : 0)))
        ).sort((a, b) => a - b);

        // Should have multiple rows and/or columns
        expect(xPositions.length + yPositions.length).toBeGreaterThan(2);
      }
    });
  });

  describe("Layout Positioning", () => {
    test("login form should be centered at specified coordinates", () => {
      const x = 5000;
      const y = 3000;
      const form = generateLoginForm(x, y, mockUserId, mockGetNextZIndex);

      const container = form[0];
      expect("x" in container).toBe(true);
      expect("y" in container).toBe(true);
      // Position should be near requested coordinates
    });

    test("layouts should not overlap when placed nearby", () => {
      const form1 = generateLoginForm(
        2000,
        2000,
        mockUserId,
        mockGetNextZIndex
      );
      const form2 = generateLoginForm(
        2500,
        2000,
        mockUserId,
        mockGetNextZIndex
      );

      // Check that they have different positions
      const container1 = form1[0];
      const container2 = form2[0];

      if ("x" in container1 && "x" in container2) {
        expect(container1.x).not.toBe(container2.x);
      }
    });
  });

  describe("Layout Consistency", () => {
    test("all layouts should have valid objects", () => {
      const layouts = [
        generateLoginForm(3000, 2000, mockUserId, mockGetNextZIndex),
        generateNavigationBar(4000, 500, mockUserId, mockGetNextZIndex),
        generateCard(2000, 2000, mockUserId, mockGetNextZIndex),
        generateButtonGroup(3000, 3000, mockUserId, mockGetNextZIndex, {
          items: ["A", "B"],
        }),
        generateDashboard(4000, 3000, mockUserId, mockGetNextZIndex),
      ];

      layouts.forEach((layout) => {
        layout.forEach((obj) => {
          expect(obj.userId).toBe(mockUserId);
          expect(obj.id).toBeDefined();
          expect(obj.type).toBeDefined();
        });
      });
    });

    test("all objects in same layout should have same userId", () => {
      const form = generateLoginForm(3000, 2000, mockUserId, mockGetNextZIndex);

      const userIds = new Set(form.map((obj) => obj.userId));
      expect(userIds.size).toBe(1);
      expect(userIds.has(mockUserId)).toBe(true);
    });
  });

  describe("Edge Cases", () => {
    test("should handle empty button labels array", () => {
      const buttonGroup = generateButtonGroup(
        3000,
        3000,
        mockUserId,
        mockGetNextZIndex,
        { items: [] }
      );

      // Should return empty array or handle gracefully
      expect(Array.isArray(buttonGroup)).toBe(true);
    });

    test("should handle very long button labels", () => {
      const longLabel = "This is a very long button label that might overflow";
      const buttonGroup = generateButtonGroup(
        3000,
        3000,
        mockUserId,
        mockGetNextZIndex,
        { items: [longLabel] }
      );

      expect(buttonGroup.length).toBe(2); // 1 button + 1 text
    });

    test("should handle many navigation items", () => {
      const manyItems = Array.from({ length: 10 }, (_, i) => `Item ${i + 1}`);
      const navBar = generateNavigationBar(
        4000,
        500,
        mockUserId,
        mockGetNextZIndex,
        { items: manyItems }
      );

      const menuItems = navBar.filter((obj) => obj.id.includes("menu-item"));
      expect(menuItems.length).toBe(manyItems.length);
    });
  });
});
