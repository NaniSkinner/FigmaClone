/**
 * Project Management - Integration Tests
 * Phase 6, Task 6.2: Integration Testing
 *
 * Tests complete workflows:
 * - Save project and load it back
 * - Switch between projects
 * - Auto-save flow
 * - Unsaved changes dialog
 * - Delete project
 */

import { useProjectStore } from "@/store/projectStore";
import { useCanvasStore } from "@/store/canvasStore";
import { useUserStore } from "@/store/userStore";
import * as projectOps from "@/lib/firebase/projects";
import { generateThumbnail } from "@/lib/thumbnails";
import { CanvasObject } from "@/types/canvas";
import { Project, ProjectListItem } from "@/types/project";

// Mock dependencies
jest.mock("@/lib/firebase/projects");
jest.mock("@/lib/thumbnails");

jest.mock("@/store/canvasStore", () => ({
  useCanvasStore: {
    getState: jest.fn(),
  },
}));

jest.mock("@/store/userStore", () => ({
  useUserStore: {
    getState: jest.fn(),
  },
}));

describe("Project Management - Integration Tests", () => {
  const mockUserId = "test-user-123";
  const mockThumbnail = "data:image/jpeg;base64,mockThumbnail";

  // Helper to create mock canvas objects
  const createMockObjects = (count: number, prefix: string): CanvasObject[] => {
    return Array.from({ length: count }, (_, i) => ({
      id: `${prefix}-obj-${i}`,
      type: "rectangle" as const,
      x: 100 + i * 50,
      y: 100 + i * 50,
      width: 100,
      height: 100,
      fill: `#${Math.floor(Math.random() * 16777215).toString(16)}`,
      stroke: "#000000",
      strokeWidth: 2,
      rotation: 0,
      opacity: 1,
      createdAt: new Date(),
      updatedAt: new Date(),
      createdBy: mockUserId,
      lockedBy: null,
    }));
  };

  beforeEach(() => {
    jest.clearAllMocks();

    // Setup default mocks
    (useUserStore.getState as jest.Mock).mockReturnValue({
      currentUser: { id: mockUserId },
    });

    (generateThumbnail as jest.Mock).mockResolvedValue(mockThumbnail);

    // Reset project store
    useProjectStore.getState().setCurrentProject(null);
    useProjectStore.getState().setIsDirty(false);
    useProjectStore.getState().setIsLoading(false);
    useProjectStore.getState().setIsSaving(false);
    useProjectStore.getState().setLastSaved(null);
  });

  describe("Complete Save → Load Flow", () => {
    it("should save project and load it back with all data intact", async () => {
      // Step 1: Create objects on canvas
      const mockObjects = createMockObjects(5, "project-a");

      (useCanvasStore.getState as jest.Mock).mockReturnValue({
        objects: new Map(mockObjects.map((obj) => [obj.id, obj])),
        clearCanvas: jest.fn(),
        batchCreateObjects: jest.fn(),
        setCurrentProjectId: jest.fn(),
        isDirty: false,
      });

      // Step 2: Save project with name
      const projectId = "project-a-123";
      (projectOps.createProject as jest.Mock).mockResolvedValue(projectId);
      (projectOps.loadProjects as jest.Mock).mockResolvedValue([
        {
          id: projectId,
          name: "Test Project A",
          thumbnail: mockThumbnail,
          updatedAt: new Date(),
          objectCount: 5,
        },
      ]);

      const savedProjectId = await useProjectStore
        .getState()
        .createProject("Test Project A");

      expect(savedProjectId).toBe(projectId);
      expect(projectOps.createProject).toHaveBeenCalledWith(
        mockUserId,
        "Test Project A",
        mockObjects,
        mockThumbnail
      );

      // Step 3: Clear canvas (simulate page refresh)
      const mockCanvasAfterClear = {
        objects: new Map(),
        clearCanvas: jest.fn(),
        batchCreateObjects: jest.fn(),
        setCurrentProjectId: jest.fn(),
        isDirty: false,
      };
      (useCanvasStore.getState as jest.Mock).mockReturnValue(
        mockCanvasAfterClear
      );

      useProjectStore.getState().setCurrentProject(null);

      // Step 4: Load project by ID
      const loadedProject: Project = {
        metadata: {
          id: projectId,
          name: "Test Project A",
          createdAt: new Date(),
          updatedAt: new Date(),
          thumbnail: mockThumbnail,
          objectCount: 5,
          ownerId: mockUserId,
          isShared: false,
          sharedWith: [],
        },
        objects: mockObjects,
      };

      (projectOps.loadProject as jest.Mock).mockResolvedValue(loadedProject);

      await useProjectStore.getState().loadProject(projectId);

      // Step 5: Verify objects match
      expect(mockCanvasAfterClear.batchCreateObjects).toHaveBeenCalledWith(
        mockObjects
      );
      expect(useProjectStore.getState().currentProject?.objects).toEqual(
        mockObjects
      );
      expect(useProjectStore.getState().currentProject?.metadata.name).toBe(
        "Test Project A"
      );
      expect(useProjectStore.getState().isDirty).toBe(false);
    });

    it("should maintain object properties through save/load cycle", async () => {
      // Create complex objects with various properties
      const complexObjects: CanvasObject[] = [
        {
          id: "rect-1",
          type: "rectangle",
          x: 100,
          y: 200,
          width: 300,
          height: 150,
          fill: "#ff0000",
          stroke: "#00ff00",
          strokeWidth: 5,
          rotation: 45,
          opacity: 0.7,
          createdAt: new Date("2024-01-01"),
          updatedAt: new Date("2024-01-02"),
          createdBy: mockUserId,
          lockedBy: null,
        },
        {
          id: "circle-1",
          type: "circle",
          x: 500,
          y: 500,
          radius: 75,
          fill: "#0000ff",
          stroke: "#000000",
          strokeWidth: 3,
          rotation: 0,
          opacity: 1,
          createdAt: new Date("2024-01-01"),
          updatedAt: new Date("2024-01-02"),
          createdBy: mockUserId,
          lockedBy: null,
        },
      ];

      (useCanvasStore.getState as jest.Mock).mockReturnValue({
        objects: new Map(complexObjects.map((obj) => [obj.id, obj])),
        clearCanvas: jest.fn(),
        batchCreateObjects: jest.fn(),
        setCurrentProjectId: jest.fn(),
        isDirty: false,
      });

      const projectId = "complex-project";
      (projectOps.createProject as jest.Mock).mockResolvedValue(projectId);
      (projectOps.loadProjects as jest.Mock).mockResolvedValue([]);

      await useProjectStore.getState().createProject("Complex Project");

      // Simulate loading back
      const loadedProject: Project = {
        metadata: {
          id: projectId,
          name: "Complex Project",
          createdAt: new Date(),
          updatedAt: new Date(),
          thumbnail: mockThumbnail,
          objectCount: 2,
          ownerId: mockUserId,
          isShared: false,
          sharedWith: [],
        },
        objects: complexObjects,
      };

      (projectOps.loadProject as jest.Mock).mockResolvedValue(loadedProject);
      await useProjectStore.getState().loadProject(projectId);

      const loadedObjects = useProjectStore.getState().currentProject?.objects;
      expect(loadedObjects).toHaveLength(2);
      expect(loadedObjects?.[0]).toMatchObject({
        id: "rect-1",
        rotation: 45,
        opacity: 0.7,
      });
      expect(loadedObjects?.[1]).toMatchObject({
        id: "circle-1",
        radius: 75,
      });
    });
  });

  describe("Project Switching Flow", () => {
    it("should switch between projects correctly", async () => {
      // Create Project A with rectangles
      const projectAObjects = createMockObjects(3, "project-a");
      const projectAId = "project-a-id";

      (useCanvasStore.getState as jest.Mock).mockReturnValue({
        objects: new Map(projectAObjects.map((obj) => [obj.id, obj])),
        clearCanvas: jest.fn(),
        batchCreateObjects: jest.fn(),
        setCurrentProjectId: jest.fn(),
        isDirty: false,
      });

      (projectOps.createProject as jest.Mock).mockResolvedValue(projectAId);
      (projectOps.loadProjects as jest.Mock).mockResolvedValue([]);

      await useProjectStore.getState().createProject("Project A");

      // Create Project B with different objects
      const projectBObjects = createMockObjects(5, "project-b");
      const projectBId = "project-b-id";

      (useCanvasStore.getState as jest.Mock).mockReturnValue({
        objects: new Map(projectBObjects.map((obj) => [obj.id, obj])),
        clearCanvas: jest.fn(),
        batchCreateObjects: jest.fn(),
        setCurrentProjectId: jest.fn(),
        isDirty: false,
      });

      (projectOps.createProject as jest.Mock).mockResolvedValue(projectBId);
      await useProjectStore.getState().createProject("Project B");

      // Load Project A
      const mockCanvasForLoad = {
        objects: new Map(),
        clearCanvas: jest.fn(),
        batchCreateObjects: jest.fn(),
        setCurrentProjectId: jest.fn(),
        isDirty: false,
      };
      (useCanvasStore.getState as jest.Mock).mockReturnValue(mockCanvasForLoad);

      const projectA: Project = {
        metadata: {
          id: projectAId,
          name: "Project A",
          createdAt: new Date(),
          updatedAt: new Date(),
          thumbnail: mockThumbnail,
          objectCount: 3,
          ownerId: mockUserId,
          isShared: false,
          sharedWith: [],
        },
        objects: projectAObjects,
      };

      (projectOps.loadProject as jest.Mock).mockResolvedValue(projectA);
      await useProjectStore.getState().loadProject(projectAId);

      expect(useProjectStore.getState().currentProject?.metadata.id).toBe(
        projectAId
      );
      expect(mockCanvasForLoad.batchCreateObjects).toHaveBeenCalledWith(
        projectAObjects
      );

      // Load Project B
      const projectB: Project = {
        metadata: {
          id: projectBId,
          name: "Project B",
          createdAt: new Date(),
          updatedAt: new Date(),
          thumbnail: mockThumbnail,
          objectCount: 5,
          ownerId: mockUserId,
          isShared: false,
          sharedWith: [],
        },
        objects: projectBObjects,
      };

      (projectOps.loadProject as jest.Mock).mockResolvedValue(projectB);
      await useProjectStore.getState().loadProject(projectBId);

      expect(useProjectStore.getState().currentProject?.metadata.id).toBe(
        projectBId
      );

      // Switch back to Project A
      (projectOps.loadProject as jest.Mock).mockResolvedValue(projectA);
      await useProjectStore.getState().loadProject(projectAId);

      expect(useProjectStore.getState().currentProject?.metadata.id).toBe(
        projectAId
      );
      expect(useProjectStore.getState().currentProject?.objects).toHaveLength(
        3
      );
    });

    it("should handle rapid project switching", async () => {
      const projects = ["p1", "p2", "p3"];

      for (const projectId of projects) {
        const project: Project = {
          metadata: {
            id: projectId,
            name: `Project ${projectId}`,
            createdAt: new Date(),
            updatedAt: new Date(),
            thumbnail: mockThumbnail,
            objectCount: 1,
            ownerId: mockUserId,
            isShared: false,
            sharedWith: [],
          },
          objects: createMockObjects(1, projectId),
        };

        (useCanvasStore.getState as jest.Mock).mockReturnValue({
          objects: new Map(),
          clearCanvas: jest.fn(),
          batchCreateObjects: jest.fn(),
          setCurrentProjectId: jest.fn(),
          isDirty: false,
        });

        (projectOps.loadProject as jest.Mock).mockResolvedValue(project);
        await useProjectStore.getState().loadProject(projectId);

        expect(useProjectStore.getState().currentProject?.metadata.id).toBe(
          projectId
        );
      }

      // Final state should be p3
      expect(useProjectStore.getState().currentProject?.metadata.id).toBe("p3");
    });
  });

  describe("Auto-Save Flow", () => {
    it("should auto-save after changes", async () => {
      // Setup: Create and load a project
      const projectId = "auto-save-project";
      const initialObjects = createMockObjects(3, "initial");

      const project: Project = {
        metadata: {
          id: projectId,
          name: "Auto-Save Test",
          createdAt: new Date(),
          updatedAt: new Date(),
          thumbnail: mockThumbnail,
          objectCount: 3,
          ownerId: mockUserId,
          isShared: false,
          sharedWith: [],
        },
        objects: initialObjects,
      };

      (useCanvasStore.getState as jest.Mock).mockReturnValue({
        objects: new Map(initialObjects.map((obj) => [obj.id, obj])),
        clearCanvas: jest.fn(),
        batchCreateObjects: jest.fn(),
        setCurrentProjectId: jest.fn(),
        isDirty: false,
      });

      useProjectStore.getState().setCurrentProject(project);

      // Make changes - mark as dirty
      useProjectStore.getState().setIsDirty(true);

      // Mock update operation
      (projectOps.updateProject as jest.Mock).mockResolvedValue(undefined);
      (projectOps.loadProjects as jest.Mock).mockResolvedValue([]);

      // Trigger save
      await useProjectStore.getState().saveCurrentProject();

      // Verify save was called
      expect(projectOps.updateProject).toHaveBeenCalledWith(
        mockUserId,
        projectId,
        initialObjects,
        mockThumbnail
      );
      expect(useProjectStore.getState().isDirty).toBe(false);
      expect(useProjectStore.getState().lastSaved).toBeInstanceOf(Date);
    });

    it("should not save if no changes", async () => {
      const project: Project = {
        metadata: {
          id: "no-changes",
          name: "No Changes",
          createdAt: new Date(),
          updatedAt: new Date(),
          thumbnail: mockThumbnail,
          objectCount: 0,
          ownerId: mockUserId,
          isShared: false,
          sharedWith: [],
        },
        objects: [],
      };

      (useCanvasStore.getState as jest.Mock).mockReturnValue({
        objects: new Map(),
        clearCanvas: jest.fn(),
        batchCreateObjects: jest.fn(),
        setCurrentProjectId: jest.fn(),
        isDirty: false,
      });

      useProjectStore.getState().setCurrentProject(project);
      useProjectStore.getState().setIsDirty(false);

      await useProjectStore.getState().saveCurrentProject();

      // Should not call update since not dirty
      expect(projectOps.updateProject).not.toHaveBeenCalled();
    });

    it("should handle multiple save calls gracefully", async () => {
      const project: Project = {
        metadata: {
          id: "multi-save",
          name: "Multi Save",
          createdAt: new Date(),
          updatedAt: new Date(),
          thumbnail: mockThumbnail,
          objectCount: 1,
          ownerId: mockUserId,
          isShared: false,
          sharedWith: [],
        },
        objects: createMockObjects(1, "multi"),
      };

      (useCanvasStore.getState as jest.Mock).mockReturnValue({
        objects: new Map(project.objects.map((obj) => [obj.id, obj])),
        clearCanvas: jest.fn(),
        batchCreateObjects: jest.fn(),
        setCurrentProjectId: jest.fn(),
        isDirty: false,
      });

      (projectOps.updateProject as jest.Mock).mockResolvedValue(undefined);
      (projectOps.loadProjects as jest.Mock).mockResolvedValue([]);

      useProjectStore.getState().setCurrentProject(project);
      useProjectStore.getState().setIsDirty(true);

      // Call save multiple times
      await Promise.all([
        useProjectStore.getState().saveCurrentProject(),
        useProjectStore.getState().saveCurrentProject(),
        useProjectStore.getState().saveCurrentProject(),
      ]);

      // Should have been called (exact count may vary due to isDirty checks)
      expect(projectOps.updateProject).toHaveBeenCalled();
    });
  });

  describe("Unsaved Changes Flow", () => {
    it("should detect unsaved changes when switching projects", async () => {
      // Load Project A
      const projectA: Project = {
        metadata: {
          id: "project-a",
          name: "Project A",
          createdAt: new Date(),
          updatedAt: new Date(),
          thumbnail: mockThumbnail,
          objectCount: 2,
          ownerId: mockUserId,
          isShared: false,
          sharedWith: [],
        },
        objects: createMockObjects(2, "a"),
      };

      (useCanvasStore.getState as jest.Mock).mockReturnValue({
        objects: new Map(projectA.objects.map((obj) => [obj.id, obj])),
        clearCanvas: jest.fn(),
        batchCreateObjects: jest.fn(),
        setCurrentProjectId: jest.fn(),
        isDirty: false,
      });

      useProjectStore.getState().setCurrentProject(projectA);

      // Make changes (don't save)
      useProjectStore.getState().setIsDirty(true);

      // Verify state shows unsaved changes
      expect(useProjectStore.getState().isDirty).toBe(true);
      expect(useProjectStore.getState().currentProject).not.toBeNull();
    });

    it("should allow save before switching", async () => {
      const projectA: Project = {
        metadata: {
          id: "project-a",
          name: "Project A",
          createdAt: new Date(),
          updatedAt: new Date(),
          thumbnail: mockThumbnail,
          objectCount: 2,
          ownerId: mockUserId,
          isShared: false,
          sharedWith: [],
        },
        objects: createMockObjects(2, "a"),
      };

      (useCanvasStore.getState as jest.Mock).mockReturnValue({
        objects: new Map(projectA.objects.map((obj) => [obj.id, obj])),
        clearCanvas: jest.fn(),
        batchCreateObjects: jest.fn(),
        setCurrentProjectId: jest.fn(),
        isDirty: false,
      });

      useProjectStore.getState().setCurrentProject(projectA);
      useProjectStore.getState().setIsDirty(true);

      // Save before switching
      (projectOps.updateProject as jest.Mock).mockResolvedValue(undefined);
      (projectOps.loadProjects as jest.Mock).mockResolvedValue([]);

      await useProjectStore.getState().saveCurrentProject();

      expect(useProjectStore.getState().isDirty).toBe(false);

      // Now can switch safely
      const projectB: Project = {
        metadata: {
          id: "project-b",
          name: "Project B",
          createdAt: new Date(),
          updatedAt: new Date(),
          thumbnail: mockThumbnail,
          objectCount: 3,
          ownerId: mockUserId,
          isShared: false,
          sharedWith: [],
        },
        objects: createMockObjects(3, "b"),
      };

      (projectOps.loadProject as jest.Mock).mockResolvedValue(projectB);
      await useProjectStore.getState().loadProject("project-b");

      expect(useProjectStore.getState().currentProject?.metadata.id).toBe(
        "project-b"
      );
    });

    it("should allow discarding changes", async () => {
      const projectA: Project = {
        metadata: {
          id: "project-a",
          name: "Project A",
          createdAt: new Date(),
          updatedAt: new Date(),
          thumbnail: mockThumbnail,
          objectCount: 2,
          ownerId: mockUserId,
          isShared: false,
          sharedWith: [],
        },
        objects: createMockObjects(2, "a"),
      };

      (useCanvasStore.getState as jest.Mock).mockReturnValue({
        objects: new Map(projectA.objects.map((obj) => [obj.id, obj])),
        clearCanvas: jest.fn(),
        batchCreateObjects: jest.fn(),
        setCurrentProjectId: jest.fn(),
        isDirty: false,
      });

      useProjectStore.getState().setCurrentProject(projectA);
      useProjectStore.getState().setIsDirty(true);

      // Discard changes by loading another project without saving
      const projectB: Project = {
        metadata: {
          id: "project-b",
          name: "Project B",
          createdAt: new Date(),
          updatedAt: new Date(),
          thumbnail: mockThumbnail,
          objectCount: 3,
          ownerId: mockUserId,
          isShared: false,
          sharedWith: [],
        },
        objects: createMockObjects(3, "b"),
      };

      (projectOps.loadProject as jest.Mock).mockResolvedValue(projectB);
      await useProjectStore.getState().loadProject("project-b");

      // Changes were discarded
      expect(projectOps.updateProject).not.toHaveBeenCalled();
      expect(useProjectStore.getState().currentProject?.metadata.id).toBe(
        "project-b"
      );
    });
  });

  describe("Delete Project Flow", () => {
    it("should delete project and remove all data", async () => {
      const projectId = "to-delete";

      // Create and load project first
      const mockObjects = createMockObjects(5, "delete");
      (useCanvasStore.getState as jest.Mock).mockReturnValue({
        objects: new Map(mockObjects.map((obj) => [obj.id, obj])),
        clearCanvas: jest.fn(),
        batchCreateObjects: jest.fn(),
        setCurrentProjectId: jest.fn(),
        isDirty: false,
      });

      (projectOps.createProject as jest.Mock).mockResolvedValue(projectId);
      (projectOps.loadProjects as jest.Mock).mockResolvedValue([
        {
          id: projectId,
          name: "To Delete",
          thumbnail: mockThumbnail,
          updatedAt: new Date(),
          objectCount: 5,
        },
      ]);

      await useProjectStore.getState().createProject("To Delete");

      // Verify project exists
      expect(useProjectStore.getState().projects).toHaveLength(1);

      // Delete project
      (projectOps.deleteProject as jest.Mock).mockResolvedValue(undefined);
      (projectOps.loadProjects as jest.Mock).mockResolvedValue([]);

      await useProjectStore.getState().deleteProject(projectId);

      // Verify removed from Firestore
      expect(projectOps.deleteProject).toHaveBeenCalledWith(
        mockUserId,
        projectId
      );

      // Verify removed from store
      expect(useProjectStore.getState().projects).toHaveLength(0);
    });

    it("should clear canvas when deleting current project", async () => {
      const projectId = "current-delete";
      const project: Project = {
        metadata: {
          id: projectId,
          name: "Current Delete",
          createdAt: new Date(),
          updatedAt: new Date(),
          thumbnail: mockThumbnail,
          objectCount: 3,
          ownerId: mockUserId,
          isShared: false,
          sharedWith: [],
        },
        objects: createMockObjects(3, "current"),
      };

      const mockCanvasFns = {
        objects: new Map(),
        clearCanvas: jest.fn(),
        batchCreateObjects: jest.fn(),
        setCurrentProjectId: jest.fn(),
        isDirty: false,
      };

      (useCanvasStore.getState as jest.Mock).mockReturnValue(mockCanvasFns);
      useProjectStore.getState().setCurrentProject(project);

      (projectOps.deleteProject as jest.Mock).mockResolvedValue(undefined);
      (projectOps.loadProjects as jest.Mock).mockResolvedValue([]);

      await useProjectStore.getState().deleteProject(projectId);

      expect(mockCanvasFns.clearCanvas).toHaveBeenCalled();
      expect(useProjectStore.getState().currentProject).toBeNull();
    });

    it("should not clear canvas when deleting different project", async () => {
      const currentProject: Project = {
        metadata: {
          id: "current-project",
          name: "Current",
          createdAt: new Date(),
          updatedAt: new Date(),
          thumbnail: mockThumbnail,
          objectCount: 2,
          ownerId: mockUserId,
          isShared: false,
          sharedWith: [],
        },
        objects: createMockObjects(2, "current"),
      };

      const mockCanvasFns = {
        objects: new Map(),
        clearCanvas: jest.fn(),
        batchCreateObjects: jest.fn(),
        setCurrentProjectId: jest.fn(),
        isDirty: false,
      };

      (useCanvasStore.getState as jest.Mock).mockReturnValue(mockCanvasFns);
      useProjectStore.getState().setCurrentProject(currentProject);

      (projectOps.deleteProject as jest.Mock).mockResolvedValue(undefined);
      (projectOps.loadProjects as jest.Mock).mockResolvedValue([]);

      await useProjectStore.getState().deleteProject("different-project");

      expect(mockCanvasFns.clearCanvas).not.toHaveBeenCalled();
      expect(useProjectStore.getState().currentProject).not.toBeNull();
    });
  });

  describe("Project List Management", () => {
    it("should load and display multiple projects", async () => {
      const mockProjects: ProjectListItem[] = [
        {
          id: "p1",
          name: "Project 1",
          thumbnail: mockThumbnail,
          updatedAt: new Date("2024-01-03"),
          objectCount: 5,
        },
        {
          id: "p2",
          name: "Project 2",
          thumbnail: mockThumbnail,
          updatedAt: new Date("2024-01-02"),
          objectCount: 10,
        },
        {
          id: "p3",
          name: "Project 3",
          thumbnail: mockThumbnail,
          updatedAt: new Date("2024-01-01"),
          objectCount: 3,
        },
      ];

      (projectOps.loadProjects as jest.Mock).mockResolvedValue(mockProjects);

      await useProjectStore.getState().loadProjects();

      expect(useProjectStore.getState().projects).toHaveLength(3);
      expect(useProjectStore.getState().projects[0].name).toBe("Project 1");
    });

    it("should handle empty project list", async () => {
      (projectOps.loadProjects as jest.Mock).mockResolvedValue([]);

      await useProjectStore.getState().loadProjects();

      expect(useProjectStore.getState().projects).toHaveLength(0);
      expect(useProjectStore.getState().isLoading).toBe(false);
    });

    it("should update project list after operations", async () => {
      // Initial load - 2 projects
      const initialProjects: ProjectListItem[] = [
        {
          id: "p1",
          name: "Project 1",
          thumbnail: mockThumbnail,
          updatedAt: new Date(),
          objectCount: 5,
        },
        {
          id: "p2",
          name: "Project 2",
          thumbnail: mockThumbnail,
          updatedAt: new Date(),
          objectCount: 3,
        },
      ];

      (projectOps.loadProjects as jest.Mock).mockResolvedValue(initialProjects);
      await useProjectStore.getState().loadProjects();

      expect(useProjectStore.getState().projects).toHaveLength(2);

      // Create new project - 3 projects
      const newProjects = [
        ...initialProjects,
        {
          id: "p3",
          name: "Project 3",
          thumbnail: mockThumbnail,
          updatedAt: new Date(),
          objectCount: 7,
        },
      ];

      (useCanvasStore.getState as jest.Mock).mockReturnValue({
        objects: new Map(),
        clearCanvas: jest.fn(),
        batchCreateObjects: jest.fn(),
        setCurrentProjectId: jest.fn(),
        isDirty: false,
      });

      (projectOps.createProject as jest.Mock).mockResolvedValue("p3");
      (projectOps.loadProjects as jest.Mock).mockResolvedValue(newProjects);

      await useProjectStore.getState().createProject("Project 3");

      expect(useProjectStore.getState().projects).toHaveLength(3);

      // Delete project - 2 projects
      (projectOps.deleteProject as jest.Mock).mockResolvedValue(undefined);
      (projectOps.loadProjects as jest.Mock).mockResolvedValue(initialProjects);

      await useProjectStore.getState().deleteProject("p3");

      expect(useProjectStore.getState().projects).toHaveLength(2);
    });
  });

  describe("Deletion Persistence", () => {
    it("should persist deleted objects after save and reload (Bug Fix)", async () => {
      // This test validates the fix for the deletion persistence bug
      // Steps: Create project → Save → Delete object → Save → Reload

      // Step 1: Create project with 5 objects
      const initialObjects = createMockObjects(5, "initial");

      (useCanvasStore.getState as jest.Mock).mockReturnValue({
        objects: new Map(initialObjects.map((obj) => [obj.id, obj])),
        clearCanvas: jest.fn(),
        batchCreateObjects: jest.fn(),
        setCurrentProjectId: jest.fn(),
        isDirty: false,
      });

      const projectId = "deletion-test";
      (projectOps.createProject as jest.Mock).mockResolvedValue(projectId);
      (projectOps.loadProjects as jest.Mock).mockResolvedValue([]);

      await useProjectStore.getState().createProject("Deletion Test");

      // Step 2: Simulate deleting one object (4 objects remain)
      const remainingObjects = initialObjects.slice(0, 4);

      (useCanvasStore.getState as jest.Mock).mockReturnValue({
        objects: new Map(remainingObjects.map((obj) => [obj.id, obj])),
        clearCanvas: jest.fn(),
        batchCreateObjects: jest.fn(),
        setCurrentProjectId: jest.fn(),
        isDirty: true, // Canvas is dirty after deletion
      });

      useProjectStore.getState().setCurrentProject({
        metadata: {
          id: projectId,
          name: "Deletion Test",
          createdAt: new Date(),
          updatedAt: new Date(),
          thumbnail: "data:image/jpeg;base64,test",
          objectCount: 5,
          ownerId: mockUserId,
          isShared: false,
          sharedWith: [],
        },
        objects: initialObjects,
      });

      // Step 3: Save with deleted object
      (projectOps.updateProject as jest.Mock).mockResolvedValue(undefined);
      (projectOps.loadProjects as jest.Mock).mockResolvedValue([]);

      await useProjectStore.getState().saveCurrentProject();

      // Verify updateProject was called with only 4 objects
      expect(projectOps.updateProject).toHaveBeenCalledWith(
        mockUserId,
        projectId,
        remainingObjects,
        expect.any(String)
      );

      // Step 4: Load project back
      const loadedProject = {
        metadata: {
          id: projectId,
          name: "Deletion Test",
          createdAt: new Date(),
          updatedAt: new Date(),
          thumbnail: "data:image/jpeg;base64,test",
          objectCount: 4,
          ownerId: mockUserId,
          isShared: false,
          sharedWith: [],
        },
        objects: remainingObjects,
      };

      (useCanvasStore.getState as jest.Mock).mockReturnValue({
        objects: new Map(),
        clearCanvas: jest.fn(),
        batchCreateObjects: jest.fn(),
        setCurrentProjectId: jest.fn(),
        isDirty: false,
      });

      (projectOps.loadProject as jest.Mock).mockResolvedValue(loadedProject);
      await useProjectStore.getState().loadProject(projectId);

      // Step 5: Verify only 4 objects loaded
      const currentProject = useProjectStore.getState().currentProject;
      expect(currentProject?.objects).toHaveLength(4);
      expect(currentProject?.metadata.objectCount).toBe(4);
    });
  });

  describe("Error Recovery", () => {
    it("should handle save failures gracefully", async () => {
      const project: Project = {
        metadata: {
          id: "error-project",
          name: "Error Project",
          createdAt: new Date(),
          updatedAt: new Date(),
          thumbnail: mockThumbnail,
          objectCount: 1,
          ownerId: mockUserId,
          isShared: false,
          sharedWith: [],
        },
        objects: createMockObjects(1, "error"),
      };

      (useCanvasStore.getState as jest.Mock).mockReturnValue({
        objects: new Map(project.objects.map((obj) => [obj.id, obj])),
        clearCanvas: jest.fn(),
        batchCreateObjects: jest.fn(),
        setCurrentProjectId: jest.fn(),
        isDirty: false,
      });

      useProjectStore.getState().setCurrentProject(project);
      useProjectStore.getState().setIsDirty(true);

      (projectOps.updateProject as jest.Mock).mockRejectedValue(
        new Error("Network error")
      );

      await expect(
        useProjectStore.getState().saveCurrentProject()
      ).rejects.toThrow("Network error");

      // Should still be dirty
      expect(useProjectStore.getState().isDirty).toBe(true);
      expect(useProjectStore.getState().isSaving).toBe(false);
    });

    it("should handle load failures gracefully", async () => {
      (projectOps.loadProject as jest.Mock).mockRejectedValue(
        new Error("Project not found")
      );

      (useCanvasStore.getState as jest.Mock).mockReturnValue({
        objects: new Map(),
        clearCanvas: jest.fn(),
        batchCreateObjects: jest.fn(),
        setCurrentProjectId: jest.fn(),
        isDirty: false,
      });

      await expect(
        useProjectStore.getState().loadProject("nonexistent")
      ).rejects.toThrow("Project not found");

      expect(useProjectStore.getState().isLoading).toBe(false);
    });
  });
});
