/**
 * Project Store Unit Tests
 * Phase 6: Testing & Quality Assurance
 *
 * Tests all project store actions:
 * - createProject
 * - loadProjects
 * - loadProject
 * - saveCurrentProject
 * - deleteProject
 * - renameProject
 * - shareProject
 */

import { useProjectStore } from "@/store/projectStore";
import { useCanvasStore } from "@/store/canvasStore";
import { useUserStore } from "@/store/userStore";
import * as projectOps from "@/lib/firebase/projects";
import { generateThumbnail } from "@/lib/thumbnails";
import { CanvasObject } from "@/types/canvas";
import { ProjectListItem, Project } from "@/types/project";

// Mock Firebase operations
jest.mock("@/lib/firebase/projects");
jest.mock("@/lib/thumbnails");

// Mock stores
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

describe("ProjectStore", () => {
  // Mock data
  const mockUserId = "test-user-123";
  const mockProjectId = "test-project-456";
  const mockThumbnail = "data:image/jpeg;base64,mockThumbnailData";

  const mockCanvasObjects: CanvasObject[] = [
    {
      id: "obj-1",
      type: "rectangle",
      x: 100,
      y: 100,
      width: 200,
      height: 150,
      fill: "#ff0000",
      stroke: "#000000",
      strokeWidth: 2,
      rotation: 0,
      userId: mockUserId,
      createdAt: new Date(),
      updatedAt: new Date(),
      zIndex: 1,
      visible: true,
      locked: false,
    },
    {
      id: "obj-2",
      type: "circle",
      x: 400,
      y: 300,
      radius: 75,
      fill: "#00ff00",
      stroke: "#000000",
      strokeWidth: 2,
      rotation: 0,
      userId: mockUserId,
      createdAt: new Date(),
      updatedAt: new Date(),
      zIndex: 2,
      visible: true,
      locked: false,
    },
  ];

  const mockProjectListItem: ProjectListItem = {
    id: mockProjectId,
    name: "Test Project",
    thumbnail: mockThumbnail,
    updatedAt: new Date(),
    objectCount: 2,
  };

  const mockProject: Project = {
    metadata: {
      id: mockProjectId,
      name: "Test Project",
      createdAt: new Date(),
      updatedAt: new Date(),
      thumbnail: mockThumbnail,
      objectCount: 2,
      ownerId: mockUserId,
      isShared: false,
      sharedWith: [],
    },
    objects: mockCanvasObjects,
  };

  beforeEach(() => {
    // Reset all mocks before each test
    jest.clearAllMocks();

    // Setup default mock implementations
    (useUserStore.getState as jest.Mock).mockReturnValue({
      currentUser: { id: mockUserId },
    });

    (useCanvasStore.getState as jest.Mock).mockReturnValue({
      objects: new Map(mockCanvasObjects.map((obj) => [obj.id, obj])),
      clearCanvas: jest.fn(),
      batchCreateObjects: jest.fn(),
      setCurrentProjectId: jest.fn(),
      isDirty: false,
    });

    (generateThumbnail as jest.Mock).mockResolvedValue(mockThumbnail);

    // Reset store state directly (Zustand stores can be accessed without renderHook)
    useProjectStore.getState().setCurrentProject(null);
    useProjectStore.getState().setIsDirty(false);
    useProjectStore.getState().setIsLoading(false);
    useProjectStore.getState().setIsSaving(false);
    useProjectStore.getState().setLastSaved(null);
  });

  describe("Initial State", () => {
    it("should have correct initial state after reset", () => {
      const state = useProjectStore.getState();

      expect(state.projects).toBeDefined();
      expect(state.currentProject).toBeNull();
      expect(state.isLoading).toBe(false);
      expect(state.isSaving).toBe(false);
      expect(state.isDirty).toBe(false);
      expect(state.lastSaved).toBeNull();
    });
  });

  describe("createProject", () => {
    it("should create project with valid name", async () => {
      (projectOps.createProject as jest.Mock).mockResolvedValue(mockProjectId);
      (projectOps.loadProjects as jest.Mock).mockResolvedValue([
        mockProjectListItem,
      ]);

      const projectId = await useProjectStore
        .getState()
        .createProject("Test Project");

      expect(projectId).toBe(mockProjectId);
      expect(projectOps.createProject).toHaveBeenCalledWith(
        mockUserId,
        "Test Project",
        mockCanvasObjects,
        mockThumbnail
      );

      const state = useProjectStore.getState();
      expect(state.currentProject).toBeTruthy();
      expect(state.currentProject?.metadata.name).toBe("Test Project");
      expect(state.isDirty).toBe(false);
      expect(state.isSaving).toBe(false);
    });

    it("should generate thumbnail during creation", async () => {
      (projectOps.createProject as jest.Mock).mockResolvedValue(mockProjectId);
      (projectOps.loadProjects as jest.Mock).mockResolvedValue([]);

      await useProjectStore.getState().createProject("Test Project");

      expect(generateThumbnail).toHaveBeenCalledWith(mockCanvasObjects);
    });

    it("should save to Firestore", async () => {
      (projectOps.createProject as jest.Mock).mockResolvedValue(mockProjectId);
      (projectOps.loadProjects as jest.Mock).mockResolvedValue([]);

      await useProjectStore.getState().createProject("My Design");

      expect(projectOps.createProject).toHaveBeenCalledWith(
        mockUserId,
        "My Design",
        mockCanvasObjects,
        mockThumbnail
      );
    });

    it("should update local store after creation", async () => {
      (projectOps.createProject as jest.Mock).mockResolvedValue(mockProjectId);
      (projectOps.loadProjects as jest.Mock).mockResolvedValue([
        mockProjectListItem,
      ]);

      await useProjectStore.getState().createProject("Test Project");

      const state = useProjectStore.getState();
      expect(state.projects).toHaveLength(1);
      expect(state.currentProject).not.toBeNull();
      expect(state.lastSaved).toBeInstanceOf(Date);
    });

    it("should throw error if not authenticated", async () => {
      (useUserStore.getState as jest.Mock).mockReturnValue({
        currentUser: null,
      });

      await expect(
        useProjectStore.getState().createProject("Test Project")
      ).rejects.toThrow("Not authenticated");
    });

    it("should handle creation failure", async () => {
      (projectOps.createProject as jest.Mock).mockRejectedValue(
        new Error("Firestore error")
      );

      await expect(
        useProjectStore.getState().createProject("Test Project")
      ).rejects.toThrow("Firestore error");

      expect(useProjectStore.getState().isSaving).toBe(false);
    });
  });

  describe("loadProjects", () => {
    it("should load all user projects", async () => {
      const mockProjects: ProjectListItem[] = [
        mockProjectListItem,
        {
          id: "project-2",
          name: "Project 2",
          thumbnail: mockThumbnail,
          updatedAt: new Date(),
          objectCount: 5,
        },
      ];

      (projectOps.loadProjects as jest.Mock).mockResolvedValue(mockProjects);

      await useProjectStore.getState().loadProjects();

      expect(projectOps.loadProjects).toHaveBeenCalledWith(mockUserId);
      const state = useProjectStore.getState();
      expect(state.projects).toEqual(mockProjects);
      expect(state.projects).toHaveLength(2);
      expect(state.isLoading).toBe(false);
    });

    it("should sort by updated date", async () => {
      const project1: ProjectListItem = {
        ...mockProjectListItem,
        id: "1",
        updatedAt: new Date("2024-01-01"),
      };
      const project2: ProjectListItem = {
        ...mockProjectListItem,
        id: "2",
        updatedAt: new Date("2024-01-02"),
      };

      (projectOps.loadProjects as jest.Mock).mockResolvedValue([
        project2,
        project1,
      ]);

      await useProjectStore.getState().loadProjects();

      // Projects should be sorted by loadProjects (most recent first)
      const state = useProjectStore.getState();
      expect(state.projects[0].id).toBe("2");
      expect(state.projects[1].id).toBe("1");
    });

    it("should handle empty list", async () => {
      (projectOps.loadProjects as jest.Mock).mockResolvedValue([]);

      await useProjectStore.getState().loadProjects();

      const state = useProjectStore.getState();
      expect(state.projects).toEqual([]);
      expect(state.isLoading).toBe(false);
    });

    it("should handle load failure", async () => {
      (projectOps.loadProjects as jest.Mock).mockRejectedValue(
        new Error("Network error")
      );

      await useProjectStore.getState().loadProjects();

      // Should not throw, but set loading to false
      expect(useProjectStore.getState().isLoading).toBe(false);
    });

    it("should not load if no user ID", async () => {
      (useUserStore.getState as jest.Mock).mockReturnValue({
        currentUser: null,
      });

      await useProjectStore.getState().loadProjects();

      expect(projectOps.loadProjects).not.toHaveBeenCalled();
    });
  });

  describe("loadProject", () => {
    it("should load project metadata", async () => {
      (projectOps.loadProject as jest.Mock).mockResolvedValue(mockProject);

      await useProjectStore.getState().loadProject(mockProjectId);

      expect(projectOps.loadProject).toHaveBeenCalledWith(
        mockUserId,
        mockProjectId
      );
      const state = useProjectStore.getState();
      expect(state.currentProject?.metadata).toEqual(mockProject.metadata);
    });

    it("should load all objects", async () => {
      (projectOps.loadProject as jest.Mock).mockResolvedValue(mockProject);

      await useProjectStore.getState().loadProject(mockProjectId);

      const state = useProjectStore.getState();
      expect(state.currentProject?.objects).toEqual(mockProject.objects);
      expect(state.currentProject?.objects).toHaveLength(2);
    });

    it("should update canvas store", async () => {
      const mockCanvasStoreFns = {
        clearCanvas: jest.fn(),
        batchCreateObjects: jest.fn(),
        setCurrentProjectId: jest.fn(),
        objects: new Map(),
        isDirty: false,
      };

      (useCanvasStore.getState as jest.Mock).mockReturnValue(
        mockCanvasStoreFns
      );
      (projectOps.loadProject as jest.Mock).mockResolvedValue(mockProject);

      await useProjectStore.getState().loadProject(mockProjectId);

      expect(mockCanvasStoreFns.clearCanvas).toHaveBeenCalled();
      expect(mockCanvasStoreFns.batchCreateObjects).toHaveBeenCalledWith(
        mockProject.objects
      );
      expect(mockCanvasStoreFns.setCurrentProjectId).toHaveBeenCalledWith(
        mockProjectId,
        "Test Project"
      );
    });

    it("should handle project not found", async () => {
      (projectOps.loadProject as jest.Mock).mockRejectedValue(
        new Error("Project not found")
      );

      await expect(
        useProjectStore.getState().loadProject("nonexistent-id")
      ).rejects.toThrow("Project not found");

      expect(useProjectStore.getState().isLoading).toBe(false);
    });

    it("should clear isDirty after loading", async () => {
      (projectOps.loadProject as jest.Mock).mockResolvedValue(mockProject);

      // Set dirty first
      useProjectStore.getState().setIsDirty(true);

      await useProjectStore.getState().loadProject(mockProjectId);

      expect(useProjectStore.getState().isDirty).toBe(false);
    });
  });

  describe("saveCurrentProject", () => {
    it("should update Firestore", async () => {
      (projectOps.updateProject as jest.Mock).mockResolvedValue(undefined);
      (projectOps.loadProjects as jest.Mock).mockResolvedValue([]);

      // Set project and mark dirty
      useProjectStore.getState().setCurrentProject(mockProject);
      useProjectStore.getState().setIsDirty(true);

      await useProjectStore.getState().saveCurrentProject();

      expect(projectOps.updateProject).toHaveBeenCalledWith(
        mockUserId,
        mockProjectId,
        mockCanvasObjects,
        mockThumbnail
      );
    });

    it("should regenerate thumbnail", async () => {
      (projectOps.updateProject as jest.Mock).mockResolvedValue(undefined);
      (projectOps.loadProjects as jest.Mock).mockResolvedValue([]);

      useProjectStore.getState().setCurrentProject(mockProject);
      useProjectStore.getState().setIsDirty(true);

      await useProjectStore.getState().saveCurrentProject();

      expect(generateThumbnail).toHaveBeenCalledWith(mockCanvasObjects);
    });

    it("should clear isDirty flag", async () => {
      (projectOps.updateProject as jest.Mock).mockResolvedValue(undefined);
      (projectOps.loadProjects as jest.Mock).mockResolvedValue([]);

      useProjectStore.getState().setCurrentProject(mockProject);
      useProjectStore.getState().setIsDirty(true);

      await useProjectStore.getState().saveCurrentProject();

      expect(useProjectStore.getState().isDirty).toBe(false);
      expect(useProjectStore.getState().lastSaved).toBeInstanceOf(Date);
    });

    it("should not save if no current project", async () => {
      useProjectStore.getState().setCurrentProject(null);
      useProjectStore.getState().setIsDirty(true);

      await useProjectStore.getState().saveCurrentProject();

      expect(projectOps.updateProject).not.toHaveBeenCalled();
    });

    it("should not save if not dirty", async () => {
      useProjectStore.getState().setCurrentProject(mockProject);
      useProjectStore.getState().setIsDirty(false);

      await useProjectStore.getState().saveCurrentProject();

      expect(projectOps.updateProject).not.toHaveBeenCalled();
    });

    it("should handle save failure", async () => {
      (projectOps.updateProject as jest.Mock).mockRejectedValue(
        new Error("Network error")
      );

      useProjectStore.getState().setCurrentProject(mockProject);
      useProjectStore.getState().setIsDirty(true);

      await expect(
        useProjectStore.getState().saveCurrentProject()
      ).rejects.toThrow("Network error");

      expect(useProjectStore.getState().isSaving).toBe(false);
    });
  });

  describe("deleteProject", () => {
    it("should delete project and remove from Firestore", async () => {
      (projectOps.deleteProject as jest.Mock).mockResolvedValue(undefined);
      (projectOps.loadProjects as jest.Mock).mockResolvedValue([]);

      await useProjectStore.getState().deleteProject(mockProjectId);

      expect(projectOps.deleteProject).toHaveBeenCalledWith(
        mockUserId,
        mockProjectId
      );
    });

    it("should remove from store", async () => {
      (projectOps.deleteProject as jest.Mock).mockResolvedValue(undefined);
      (projectOps.loadProjects as jest.Mock).mockResolvedValue([
        mockProjectListItem,
      ]);

      await useProjectStore.getState().loadProjects();
      expect(useProjectStore.getState().projects).toHaveLength(1);

      // Delete and reload
      (projectOps.loadProjects as jest.Mock).mockResolvedValue([]);
      await useProjectStore.getState().deleteProject(mockProjectId);

      expect(useProjectStore.getState().projects).toHaveLength(0);
    });

    it("should clear canvas if current project deleted", async () => {
      const mockCanvasStoreFns = {
        clearCanvas: jest.fn(),
        setCurrentProjectId: jest.fn(),
        objects: new Map(),
        isDirty: false,
      };

      (useCanvasStore.getState as jest.Mock).mockReturnValue(
        mockCanvasStoreFns
      );
      (projectOps.deleteProject as jest.Mock).mockResolvedValue(undefined);
      (projectOps.loadProjects as jest.Mock).mockResolvedValue([]);

      useProjectStore.getState().setCurrentProject(mockProject);

      await useProjectStore.getState().deleteProject(mockProjectId);

      expect(mockCanvasStoreFns.clearCanvas).toHaveBeenCalled();
      expect(mockCanvasStoreFns.setCurrentProjectId).toHaveBeenCalledWith(
        null,
        ""
      );
      expect(useProjectStore.getState().currentProject).toBeNull();
    });

    it("should not clear canvas if different project deleted", async () => {
      const mockCanvasStoreFns = {
        clearCanvas: jest.fn(),
        setCurrentProjectId: jest.fn(),
        objects: new Map(),
        isDirty: false,
      };

      (useCanvasStore.getState as jest.Mock).mockReturnValue(
        mockCanvasStoreFns
      );
      (projectOps.deleteProject as jest.Mock).mockResolvedValue(undefined);
      (projectOps.loadProjects as jest.Mock).mockResolvedValue([]);

      useProjectStore.getState().setCurrentProject(mockProject);

      await useProjectStore.getState().deleteProject("different-project-id");

      expect(mockCanvasStoreFns.clearCanvas).not.toHaveBeenCalled();
      expect(useProjectStore.getState().currentProject).not.toBeNull();
    });
  });

  describe("renameProject", () => {
    it("should update name in Firestore", async () => {
      (projectOps.renameProject as jest.Mock).mockResolvedValue(undefined);
      (projectOps.loadProjects as jest.Mock).mockResolvedValue([]);

      await useProjectStore.getState().renameProject(mockProjectId, "New Name");

      expect(projectOps.renameProject).toHaveBeenCalledWith(
        mockUserId,
        mockProjectId,
        "New Name"
      );
    });

    it("should update local store", async () => {
      (projectOps.renameProject as jest.Mock).mockResolvedValue(undefined);
      (projectOps.loadProjects as jest.Mock).mockResolvedValue([
        { ...mockProjectListItem, name: "New Name" },
      ]);

      await useProjectStore.getState().renameProject(mockProjectId, "New Name");

      expect(projectOps.loadProjects).toHaveBeenCalled();
    });

    it("should update current project if renamed", async () => {
      (projectOps.renameProject as jest.Mock).mockResolvedValue(undefined);
      (projectOps.loadProjects as jest.Mock).mockResolvedValue([]);

      useProjectStore.getState().setCurrentProject(mockProject);

      await useProjectStore
        .getState()
        .renameProject(mockProjectId, "Renamed Project");

      expect(useProjectStore.getState().currentProject?.metadata.name).toBe(
        "Renamed Project"
      );
    });
  });

  describe("shareProject", () => {
    it("should update sharing in Firestore", async () => {
      const userIdsToShare = ["user-2", "user-3"];

      (projectOps.shareProject as jest.Mock).mockResolvedValue(undefined);
      (projectOps.loadProjects as jest.Mock).mockResolvedValue([]);

      await useProjectStore
        .getState()
        .shareProject(mockProjectId, userIdsToShare);

      expect(projectOps.shareProject).toHaveBeenCalledWith(
        mockUserId,
        mockProjectId,
        userIdsToShare
      );
    });

    it("should update current project sharing status", async () => {
      const userIdsToShare = ["user-2"];

      (projectOps.shareProject as jest.Mock).mockResolvedValue(undefined);
      (projectOps.loadProjects as jest.Mock).mockResolvedValue([]);

      useProjectStore.getState().setCurrentProject(mockProject);

      await useProjectStore
        .getState()
        .shareProject(mockProjectId, userIdsToShare);

      expect(useProjectStore.getState().currentProject?.metadata.isShared).toBe(
        true
      );
      expect(
        useProjectStore.getState().currentProject?.metadata.sharedWith
      ).toEqual(userIdsToShare);
    });

    it("should handle unsharing (empty array)", async () => {
      (projectOps.shareProject as jest.Mock).mockResolvedValue(undefined);
      (projectOps.loadProjects as jest.Mock).mockResolvedValue([]);

      useProjectStore.getState().setCurrentProject({
        ...mockProject,
        metadata: {
          ...mockProject.metadata,
          isShared: true,
          sharedWith: ["user-2"],
        },
      });

      await useProjectStore.getState().shareProject(mockProjectId, []);

      expect(useProjectStore.getState().currentProject?.metadata.isShared).toBe(
        false
      );
      expect(
        useProjectStore.getState().currentProject?.metadata.sharedWith
      ).toEqual([]);
    });
  });

  describe("Basic Setters", () => {
    it("should set isDirty", () => {
      useProjectStore.getState().setIsDirty(true);
      expect(useProjectStore.getState().isDirty).toBe(true);

      useProjectStore.getState().setIsDirty(false);
      expect(useProjectStore.getState().isDirty).toBe(false);
    });

    it("should set currentProject", () => {
      useProjectStore.getState().setCurrentProject(mockProject);
      expect(useProjectStore.getState().currentProject).toEqual(mockProject);
    });

    it("should set isLoading", () => {
      useProjectStore.getState().setIsLoading(true);
      expect(useProjectStore.getState().isLoading).toBe(true);
    });

    it("should set isSaving", () => {
      useProjectStore.getState().setIsSaving(true);
      expect(useProjectStore.getState().isSaving).toBe(true);
    });

    it("should set lastSaved", () => {
      const now = new Date();
      useProjectStore.getState().setLastSaved(now);
      expect(useProjectStore.getState().lastSaved).toEqual(now);
    });
  });
});
