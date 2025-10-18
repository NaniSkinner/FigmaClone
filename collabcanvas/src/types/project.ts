import { CanvasObject } from "./canvas";

/**
 * Project Metadata stored in Firestore
 * Located at: users/{userId}/projects/{projectId}
 */
export interface ProjectMetadata {
  id: string;
  name: string;
  createdAt: Date;
  updatedAt: Date;
  thumbnail: string; // base64 data URL (256x256 JPEG)
  objectCount: number;
  ownerId: string;
  isShared: boolean;
  sharedWith: string[]; // for future sharing feature
}

/**
 * Full project with metadata and objects
 * Objects are loaded on demand from subcollection
 */
export interface Project {
  metadata: ProjectMetadata;
  objects: CanvasObject[]; // loaded from users/{userId}/projects/{projectId}/objects/{objectId}
}

/**
 * Lightweight project list item for project browser
 * Used for displaying project cards without loading all objects
 */
export interface ProjectListItem {
  id: string;
  name: string;
  thumbnail: string;
  updatedAt: Date;
  objectCount: number;
  // Shared project metadata
  isSharedWithMe?: boolean; // True if this project is shared with current user
  ownerId?: string; // Owner's user ID (needed for loading shared projects)
  ownerName?: string; // Owner's display name
}
