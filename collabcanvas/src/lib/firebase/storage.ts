import {
  ref,
  uploadBytes,
  getDownloadURL,
  deleteObject,
} from "firebase/storage";
import { storage } from "@/lib/firebase";

export interface UploadImageOptions {
  userId: string;
  projectId: string;
  file: File;
  onProgress?: (progress: number) => void;
}

export interface UploadImageResult {
  url: string;
  thumbnailBase64: string;
  naturalWidth: number;
  naturalHeight: number;
  fileSize: number;
  mimeType: string;
}

// Supported image formats
const SUPPORTED_IMAGE_TYPES = [
  "image/jpeg",
  "image/jpg",
  "image/png",
  "image/webp",
  "image/gif",
];

const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB

/**
 * Validates an image file
 * @throws Error if validation fails
 */
export function validateImageFile(file: File): void {
  // Check file type
  if (!SUPPORTED_IMAGE_TYPES.includes(file.type)) {
    throw new Error(
      `Invalid file type: ${file.type}. Supported formats: JPEG, PNG, WebP, GIF`
    );
  }

  // Check file size
  if (file.size > MAX_FILE_SIZE) {
    const sizeMB = (file.size / (1024 * 1024)).toFixed(1);
    throw new Error(
      `File too large: ${sizeMB}MB. Maximum size is 10MB. Try compressing your image first.`
    );
  }
}

/**
 * Generates a thumbnail from an image file
 * @param file - The image file
 * @returns Promise with thumbnail data
 */
export async function generateThumbnail(file: File): Promise<{
  thumbnailBase64: string;
  naturalWidth: number;
  naturalHeight: number;
}> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    const reader = new FileReader();

    reader.onload = (e) => {
      const result = e.target?.result;
      if (typeof result === "string") {
        img.src = result;
      } else {
        reject(new Error("Failed to read file"));
      }
    };

    img.onload = () => {
      try {
        // Target size: 256x256 (maintains aspect ratio)
        const MAX_SIZE = 256;
        const aspectRatio = img.width / img.height;

        let thumbWidth = MAX_SIZE;
        let thumbHeight = MAX_SIZE;

        if (aspectRatio > 1) {
          // Landscape
          thumbHeight = MAX_SIZE / aspectRatio;
        } else {
          // Portrait
          thumbWidth = MAX_SIZE * aspectRatio;
        }

        // Create canvas
        const canvas = document.createElement("canvas");
        canvas.width = thumbWidth;
        canvas.height = thumbHeight;
        const ctx = canvas.getContext("2d");

        if (!ctx) {
          reject(new Error("Canvas context not available"));
          return;
        }

        // Draw resized image
        ctx.drawImage(img, 0, 0, thumbWidth, thumbHeight);

        // Export as JPEG (smaller than PNG)
        const thumbnailBase64 = canvas.toDataURL("image/jpeg", 0.7);

        resolve({
          thumbnailBase64,
          naturalWidth: img.width,
          naturalHeight: img.height,
        });
      } catch (error) {
        reject(error);
      }
    };

    img.onerror = () => reject(new Error("Failed to load image"));
    reader.onerror = () => reject(new Error("Failed to read file"));

    reader.readAsDataURL(file);
  });
}

/**
 * Uploads an image to Firebase Storage
 * @param options - Upload options
 * @returns Promise with upload result
 */
export async function uploadImage(
  options: UploadImageOptions
): Promise<UploadImageResult> {
  const { userId, projectId, file, onProgress } = options;

  // 1. Validate
  validateImageFile(file);
  onProgress?.(10); // Validation complete

  // 2. Generate filename (timestamp-based for uniqueness)
  const timestamp = Date.now();
  const extension = file.name.split(".").pop() || "jpg";
  const filename = `${timestamp}.${extension}`;
  const storagePath = `users/${userId}/projects/${projectId}/images/${filename}`;

  // 3. Upload to Firebase Storage
  const storageRef = ref(storage, storagePath);

  try {
    await uploadBytes(storageRef, file, {
      contentType: file.type,
      customMetadata: {
        originalName: file.name,
        uploadedAt: new Date().toISOString(),
      },
    });

    onProgress?.(50); // Upload complete

    // 4. Get download URL
    const url = await getDownloadURL(storageRef);
    onProgress?.(60); // Got URL

    // 5. Generate thumbnail
    const { thumbnailBase64, naturalWidth, naturalHeight } =
      await generateThumbnail(file);
    onProgress?.(100); // Complete

    return {
      url,
      thumbnailBase64,
      naturalWidth,
      naturalHeight,
      fileSize: file.size,
      mimeType: file.type,
    };
  } catch (error) {
    console.error("Upload error:", error);
    throw new Error(
      `Upload failed: ${
        error instanceof Error ? error.message : "Unknown error"
      }`
    );
  }
}

/**
 * Deletes an image from Firebase Storage
 * @param imageUrl - The Firebase Storage URL
 */
export async function deleteImage(imageUrl: string): Promise<void> {
  try {
    // Extract storage path from URL
    const url = new URL(imageUrl);
    const pathMatch = url.pathname.match(/\/o\/(.+)$/);

    if (!pathMatch) {
      console.error("Could not extract storage path from URL:", imageUrl);
      return;
    }

    const storagePath = decodeURIComponent(pathMatch[1]);
    const storageRef = ref(storage, storagePath);

    await deleteObject(storageRef);
    console.log("Image deleted from storage:", storagePath);
  } catch (error) {
    console.error("Failed to delete image from storage:", error);
    // Don't throw - deletion failures shouldn't block the UI
  }
}
