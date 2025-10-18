import {
  collection,
  collectionGroup,
  doc,
  getDoc,
  getDocs,
  setDoc,
  updateDoc,
  deleteDoc,
  writeBatch,
  query,
  orderBy,
  where,
  limit,
  serverTimestamp,
  Timestamp,
} from "firebase/firestore";
import { db } from "@/lib/firebase";
import { CanvasObject } from "@/types/canvas";
import { Project, ProjectMetadata, ProjectListItem } from "@/types/project";
import { User } from "@/types/user";

/**
 * Create a new project with metadata and objects
 * @param userId - Owner user ID
 * @param name - Project name
 * @param objects - Canvas objects to save
 * @param thumbnail - Base64 thumbnail image
 * @param ownerName - Owner's display name (for shared project display)
 * @returns Created project ID
 */
export async function createProject(
  userId: string,
  name: string,
  objects: CanvasObject[],
  thumbnail: string,
  ownerName?: string
): Promise<string> {
  const projectId = crypto.randomUUID();
  const projectRef = doc(db, `users/${userId}/projects/${projectId}`);

  // Save metadata
  await setDoc(projectRef, {
    id: projectId,
    name,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
    thumbnail,
    objectCount: objects.length,
    ownerId: userId,
    ownerName: ownerName || "Unknown",
    isShared: false,
    sharedWith: [],
  });

  // Batch save objects
  const batch = writeBatch(db);
  objects.forEach((obj) => {
    const objRef = doc(
      db,
      `users/${userId}/projects/${projectId}/objects/${obj.id}`
    );
    // Convert dates to timestamps for Firestore
    const firestoreObj = {
      ...obj,
      createdAt:
        obj.createdAt instanceof Date
          ? Timestamp.fromDate(obj.createdAt)
          : serverTimestamp(),
      updatedAt:
        obj.updatedAt instanceof Date
          ? Timestamp.fromDate(obj.updatedAt)
          : serverTimestamp(),
    };
    batch.set(objRef, firestoreObj);
  });
  await batch.commit();

  return projectId;
}

/**
 * Load all projects for a user (metadata only)
 * @param userId - User ID
 * @returns Array of project list items
 */
export async function loadProjects(userId: string): Promise<ProjectListItem[]> {
  try {
    const projectsRef = collection(db, `users/${userId}/projects`);
    const q = query(projectsRef, orderBy("updatedAt", "desc"));
    const snapshot = await getDocs(q);

    return snapshot.docs.map((doc) => {
      const data = doc.data();
      return {
        id: data.id,
        name: data.name,
        thumbnail: data.thumbnail,
        updatedAt: data.updatedAt?.toDate() || new Date(),
        objectCount: data.objectCount || 0,
      } as ProjectListItem;
    });
  } catch (error) {
    console.error("Failed to load projects:", error);
    return [];
  }
}

/**
 * Load a single project with all its objects
 * @param userId - User ID
 * @param projectId - Project ID
 * @returns Project with metadata and objects
 */
export async function loadProject(
  userId: string,
  projectId: string
): Promise<Project> {
  // Load metadata
  const metadataRef = doc(db, `users/${userId}/projects/${projectId}`);
  const metadataSnap = await getDoc(metadataRef);

  if (!metadataSnap.exists()) {
    throw new Error("Project not found");
  }

  // Load objects
  const objectsRef = collection(
    db,
    `users/${userId}/projects/${projectId}/objects`
  );
  const objectsSnap = await getDocs(objectsRef);
  const objects = objectsSnap.docs.map((doc) => {
    const data = doc.data();
    // Convert Firestore timestamps back to Date objects
    return {
      ...data,
      createdAt: data.createdAt?.toDate() || new Date(),
      updatedAt: data.updatedAt?.toDate() || new Date(),
    } as CanvasObject;
  });

  const metadata = metadataSnap.data();
  return {
    metadata: {
      ...metadata,
      createdAt: metadata.createdAt?.toDate() || new Date(),
      updatedAt: metadata.updatedAt?.toDate() || new Date(),
    } as ProjectMetadata,
    objects,
  };
}

/**
 * Update an existing project (save changes)
 * @param userId - User ID
 * @param projectId - Project ID
 * @param objects - Updated canvas objects
 * @param thumbnail - Updated thumbnail
 */
export async function updateProject(
  userId: string,
  projectId: string,
  objects: CanvasObject[],
  thumbnail: string
): Promise<void> {
  // Update metadata
  const projectRef = doc(db, `users/${userId}/projects/${projectId}`);
  await updateDoc(projectRef, {
    updatedAt: serverTimestamp(),
    objectCount: objects.length,
    thumbnail,
  });

  // Delta sync: For simplicity, delete all and re-save
  // In production, you might want to implement true delta sync
  const objectsRef = collection(
    db,
    `users/${userId}/projects/${projectId}/objects`
  );
  const existingSnap = await getDocs(objectsRef);

  const batch = writeBatch(db);

  // Delete old objects
  existingSnap.docs.forEach((doc) => batch.delete(doc.ref));

  // Add current objects
  objects.forEach((obj) => {
    const objRef = doc(
      db,
      `users/${userId}/projects/${projectId}/objects/${obj.id}`
    );
    // Convert dates to timestamps
    const firestoreObj = {
      ...obj,
      createdAt:
        obj.createdAt instanceof Date
          ? Timestamp.fromDate(obj.createdAt)
          : serverTimestamp(),
      updatedAt:
        obj.updatedAt instanceof Date
          ? Timestamp.fromDate(obj.updatedAt)
          : serverTimestamp(),
    };
    batch.set(objRef, firestoreObj);
  });

  await batch.commit();
}

/**
 * Delete a project and all its objects
 * @param userId - User ID
 * @param projectId - Project ID
 */
export async function deleteProject(
  userId: string,
  projectId: string
): Promise<void> {
  // Delete all objects first
  const objectsRef = collection(
    db,
    `users/${userId}/projects/${projectId}/objects`
  );
  const objectsSnap = await getDocs(objectsRef);

  const batch = writeBatch(db);
  objectsSnap.docs.forEach((doc) => batch.delete(doc.ref));

  // Delete project metadata
  const projectRef = doc(db, `users/${userId}/projects/${projectId}`);
  batch.delete(projectRef);

  await batch.commit();
}

/**
 * Rename a project
 * @param userId - User ID
 * @param projectId - Project ID
 * @param newName - New project name
 */
export async function renameProject(
  userId: string,
  projectId: string,
  newName: string
): Promise<void> {
  const projectRef = doc(db, `users/${userId}/projects/${projectId}`);
  await updateDoc(projectRef, {
    name: newName,
    updatedAt: serverTimestamp(),
  });
}

/**
 * Share a project with other users
 * @param userId - Owner user ID
 * @param projectId - Project ID
 * @param userIdsToShare - Array of user IDs to share with
 */
export async function shareProject(
  userId: string,
  projectId: string,
  userIdsToShare: string[]
): Promise<void> {
  const projectRef = doc(db, `users/${userId}/projects/${projectId}`);
  await updateDoc(projectRef, {
    isShared: userIdsToShare.length > 0,
    sharedWith: userIdsToShare,
    updatedAt: serverTimestamp(),
  });
}

/**
 * Get all projects shared with current user (across all owners)
 * @param currentUserId - Current user ID
 * @returns Array of shared projects
 */
export async function getSharedProjects(
  currentUserId: string
): Promise<ProjectListItem[]> {
  try {
    // Use collection group query to search across ALL users' projects
    const projectsQuery = query(
      collectionGroup(db, "projects"),
      where("sharedWith", "array-contains", currentUserId),
      orderBy("updatedAt", "desc")
    );

    const snapshot = await getDocs(projectsQuery);

    return snapshot.docs.map((doc) => {
      const data = doc.data();
      return {
        id: data.id,
        name: data.name,
        thumbnail: data.thumbnail,
        updatedAt: data.updatedAt?.toDate() || new Date(),
        objectCount: data.objectCount || 0,
        isSharedWithMe: true, // Mark as shared
        ownerId: data.ownerId, // Store owner ID for loading
        ownerName: data.ownerName || "Unknown", // Owner's name
      } as ProjectListItem;
    });
  } catch (error) {
    console.error("Failed to load shared projects:", error);
    return [];
  }
}

/**
 * Look up a user by their email address
 * @param email - User's email address
 * @returns User object if found, null otherwise
 */
export async function getUserByEmail(email: string): Promise<User | null> {
  try {
    const normalizedEmail = email.trim().toLowerCase();
    const usersRef = collection(db, "users");
    const q = query(usersRef, where("email", "==", normalizedEmail), limit(1));
    const snapshot = await getDocs(q);

    if (snapshot.empty) {
      return null;
    }

    const userData = snapshot.docs[0].data();
    return {
      id: userData.id,
      name: userData.name,
      email: userData.email,
      color: userData.color,
      isAnonymous: userData.isAnonymous || false,
      createdAt: userData.createdAt?.toDate(),
    } as User;
  } catch (error) {
    console.error("Error looking up user by email:", error);
    throw error;
  }
}
