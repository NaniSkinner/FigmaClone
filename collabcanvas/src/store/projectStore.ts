import { create } from "zustand";
import { Project, ProjectMetadata, ProjectListItem } from "@/types/project";
import * as projectOps from "@/lib/firebase/projects";
import { generateThumbnail } from "@/lib/thumbnails";
import { useCanvasStore } from "./canvasStore";
import { useUserStore } from "./userStore";

/**
 * Project Store for Multi-Project Management
 *
 * Manages project state including:
 * - List of user projects (metadata only)
 * - Currently loaded project (with full objects)
 * - Save/load state tracking
 * - Dirty flag for unsaved changes
 */
interface ProjectStore {
  // State
  projects: ProjectListItem[];
  currentProject: Project | null;
  isLoading: boolean;
  isSaving: boolean;
  isDirty: boolean;
  lastSaved: Date | null;

  // Actions
  loadProjects: () => Promise<void>;
  createProject: (name: string) => Promise<string>;
  loadProject: (projectId: string) => Promise<void>;
  saveCurrentProject: () => Promise<void>;
  updateProjectMetadata: (
    projectId: string,
    updates: Partial<ProjectMetadata>
  ) => Promise<void>;
  deleteProject: (projectId: string) => Promise<void>;
  renameProject: (projectId: string, newName: string) => Promise<void>;
  shareProject: (projectId: string, userIds: string[]) => Promise<void>;
  startNewCanvas: () => void;
  setIsDirty: (dirty: boolean) => void;
  setCurrentProject: (project: Project | null) => void;
  setIsLoading: (loading: boolean) => void;
  setIsSaving: (saving: boolean) => void;
  setLastSaved: (date: Date | null) => void;
}

export const useProjectStore = create<ProjectStore>((set, get) => ({
  // Initial state
  projects: [],
  currentProject: null,
  isLoading: false,
  isSaving: false,
  isDirty: false,
  lastSaved: null,

  // Basic setters
  setIsDirty: (dirty) => set({ isDirty: dirty }),

  setCurrentProject: (project) => set({ currentProject: project }),

  setIsLoading: (loading) => set({ isLoading: loading }),

  setIsSaving: (saving) => set({ isSaving: saving }),

  setLastSaved: (date) => set({ lastSaved: date }),

  // Load all projects for current user (owned + shared)
  loadProjects: async () => {
    const userId = useUserStore.getState().currentUser?.id;
    if (!userId) {
      console.error("No user ID available");
      return;
    }

    set({ isLoading: true });
    try {
      // Load both owned projects AND projects shared with me
      const [ownedProjects, sharedProjects] = await Promise.all([
        projectOps.loadProjects(userId),
        projectOps.getSharedProjects(userId),
      ]);

      // Merge both lists (shared projects already have isSharedWithMe flag)
      const allProjects = [...ownedProjects, ...sharedProjects];

      // Sort by updatedAt (most recent first)
      allProjects.sort((a, b) => b.updatedAt.getTime() - a.updatedAt.getTime());

      set({ projects: allProjects, isLoading: false });
    } catch (error) {
      console.error("Failed to load projects:", error);
      set({ isLoading: false });
    }
  },

  createProject: async (name: string) => {
    const currentUser = useUserStore.getState().currentUser;
    const userId = currentUser?.id;
    const objects = Array.from(useCanvasStore.getState().objects.values());

    if (!userId || !currentUser) {
      throw new Error("Not authenticated");
    }

    set({ isSaving: true });
    try {
      // Generate thumbnail from current canvas
      const thumbnail = await generateThumbnail(objects);

      // Create project in Firestore
      const projectId = await projectOps.createProject(
        userId,
        name,
        objects,
        thumbnail,
        currentUser.name // Pass owner's name for shared project display
      );

      // Reload projects list
      await get().loadProjects();

      // Set as current project
      set({
        currentProject: {
          metadata: {
            id: projectId,
            name,
            createdAt: new Date(),
            updatedAt: new Date(),
            thumbnail,
            objectCount: objects.length,
            ownerId: userId,
            isShared: false,
            sharedWith: [],
          },
          objects,
        },
        isSaving: false,
        isDirty: false,
        lastSaved: new Date(),
      });

      // Update canvas store
      useCanvasStore.getState().setCurrentProjectId(projectId, name);
      useCanvasStore.getState().isDirty = false;

      return projectId;
    } catch (error) {
      set({ isSaving: false });
      throw error;
    }
  },

  loadProject: async (projectId: string) => {
    const userId = useUserStore.getState().currentUser?.id;
    if (!userId) {
      console.error("No user ID available");
      return;
    }

    set({ isLoading: true });
    try {
      // Find project in list to check if it's shared
      const projectInList = get().projects.find((p) => p.id === projectId);

      // For shared projects, use the owner's ID; otherwise use current user's ID
      const ownerUserId = projectInList?.isSharedWithMe
        ? projectInList.ownerId!
        : userId;

      // Load project from Firestore (from owner's path)
      const project = await projectOps.loadProject(ownerUserId, projectId);

      set({
        currentProject: project,
        isLoading: false,
        isDirty: false,
      });

      // Update canvas store
      useCanvasStore
        .getState()
        .setCurrentProjectId(projectId, project.metadata.name);

      // Clear canvas and load project objects
      useCanvasStore.getState().clearCanvas();
      useCanvasStore.getState().batchCreateObjects(project.objects);

      // Reset dirty flag after loading
      useCanvasStore.getState().isDirty = false;
    } catch (error) {
      console.error("Failed to load project:", error);
      set({ isLoading: false });
      throw error;
    }
  },

  saveCurrentProject: async () => {
    const { currentProject, isDirty } = get();
    const userId = useUserStore.getState().currentUser?.id;
    const canvasState = useCanvasStore.getState();
    const objects = Array.from(canvasState.objects.values());
    const canvasIsDirty = canvasState.isDirty;

    // Check if either store has unsaved changes
    if (!userId || !currentProject || (!isDirty && !canvasIsDirty)) {
      return;
    }

    set({ isSaving: true });
    try {
      // Generate updated thumbnail
      const thumbnail = await generateThumbnail(objects);

      // For shared projects, save to owner's path; otherwise save to current user's path
      const ownerUserId = currentProject.metadata.ownerId;

      // Update project in Firestore (using owner's path)
      await projectOps.updateProject(
        ownerUserId,
        currentProject.metadata.id,
        objects,
        thumbnail
      );

      set({
        isSaving: false,
        isDirty: false,
        lastSaved: new Date(),
      });

      // Reset canvas dirty flag
      useCanvasStore.getState().isDirty = false;

      // Reload projects list to update metadata
      await get().loadProjects();
    } catch (error) {
      console.error("Failed to save project:", error);
      set({ isSaving: false });
      throw error;
    }
  },

  updateProjectMetadata: async (
    projectId: string,
    updates: Partial<ProjectMetadata>
  ) => {
    // This is a generic update method, currently not used
    // Individual operations like rename use specific methods
    console.log("updateProjectMetadata:", projectId, updates);
  },

  deleteProject: async (projectId: string) => {
    const userId = useUserStore.getState().currentUser?.id;
    const { currentProject } = get();

    if (!userId) {
      console.error("No user ID available");
      return;
    }

    try {
      // Delete from Firestore
      await projectOps.deleteProject(userId, projectId);

      // If deleting current project, clear canvas
      if (currentProject?.metadata.id === projectId) {
        set({ currentProject: null, isDirty: false });
        useCanvasStore.getState().clearCanvas();
        useCanvasStore.getState().setCurrentProjectId(null, "");
        useCanvasStore.getState().isDirty = false;
      }

      // Reload projects list
      await get().loadProjects();
    } catch (error) {
      console.error("Failed to delete project:", error);
      throw error;
    }
  },

  renameProject: async (projectId: string, newName: string) => {
    const userId = useUserStore.getState().currentUser?.id;
    if (!userId) {
      console.error("No user ID available");
      return;
    }

    try {
      // Update name in Firestore
      await projectOps.renameProject(userId, projectId, newName);

      // Update current project if renamed
      const { currentProject } = get();
      if (currentProject?.metadata.id === projectId) {
        set({
          currentProject: {
            ...currentProject,
            metadata: { ...currentProject.metadata, name: newName },
          },
        });
        useCanvasStore.getState().setCurrentProjectId(projectId, newName);
      }

      // Reload projects list
      await get().loadProjects();
    } catch (error) {
      console.error("Failed to rename project:", error);
      throw error;
    }
  },

  shareProject: async (projectId: string, userIds: string[]) => {
    const userId = useUserStore.getState().currentUser?.id;
    if (!userId) {
      console.error("No user ID available");
      return;
    }

    try {
      // Update sharing in Firestore
      await projectOps.shareProject(userId, projectId, userIds);

      // Update current project if it's the one being shared
      const { currentProject } = get();
      if (currentProject?.metadata.id === projectId) {
        set({
          currentProject: {
            ...currentProject,
            metadata: {
              ...currentProject.metadata,
              isShared: userIds.length > 0,
              sharedWith: userIds,
            },
          },
        });
      }

      // Reload projects list
      await get().loadProjects();
    } catch (error) {
      console.error("Failed to share project:", error);
      throw error;
    }
  },

  startNewCanvas: () => {
    // Clear current project state
    set({
      currentProject: null,
      isDirty: false,
      lastSaved: null,
    });

    // Clear canvas store
    useCanvasStore.getState().clearCanvas();
    useCanvasStore.getState().setCurrentProjectId(null, "");
    useCanvasStore.getState().isDirty = false;
  },
}));
