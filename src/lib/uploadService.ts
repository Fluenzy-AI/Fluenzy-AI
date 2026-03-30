/**
 * Upload Service for FluenzyAI
 * Handles PDF uploads to R2 public-assets bucket with lifetime CDN caching
 */

import {
  S3Client,
  PutObjectCommand,
  DeleteObjectCommand,
  HeadObjectCommand,
} from "@aws-sdk/client-s3";
import { randomUUID } from "crypto";
import { buildFileKey, type FileType } from "./cdn";

// ─── R2 Client Configuration ────────────────────────────────────────────────

export const r2 = new S3Client({
  region: "auto",
  endpoint: process.env.R2_ENDPOINT!, // https://<account_id>.r2.cloudflarestorage.com
  credentials: {
    accessKeyId: process.env.R2_ACCESS_KEY_ID!,
    secretAccessKey: process.env.R2_SECRET_ACCESS_KEY!,
  },
});

// Use existing private bucket for now
// In production, create separate "public-assets" bucket
export const PUBLIC_BUCKET = process.env.R2_BUCKET_NAME || "fluenzy-storage";

// ─── Upload Result Interface ────────────────────────────────────────────────

export interface UploadResult {
  fileKey: string;  // ← Store ONLY this in DB (never the full URL)
  fileSize: number;
  mimeType: string;
}

// ─── Upload Function ────────────────────────────────────────────────────────

/**
 * Upload a PDF file to R2 with lifetime caching
 * 
 * @param buffer - File buffer
 * @param type - File type (determines folder structure)
 * @param userId - User ID (for organization and access control)
 * @param fileName - Original filename (for download dialog)
 * @returns Upload result with fileKey
 */
export async function uploadPDF(
  buffer: Buffer,
  type: FileType,
  userId: string,
  fileName: string
): Promise<UploadResult> {
  // Validate it's actually a PDF (check magic bytes: %PDF)
  if (!isPDF(buffer)) {
    throw new Error("File is not a valid PDF");
  }

  const uuid = randomUUID();
  const fileKey = buildFileKey(type, userId, uuid);

  await r2.send(
    new PutObjectCommand({
      Bucket: PUBLIC_BUCKET,
      Key: fileKey,
      Body: buffer,
      ContentType: "application/pdf",
      // Lifetime cache — UUID key means content never changes
      CacheControl: "public, max-age=31536000, immutable",
      // Inline for preview, attach original name for download dialog
      ContentDisposition: `inline; filename="${sanitizeFilename(fileName)}"`,
      // Metadata for audit (optional)
      Metadata: {
        "uploaded-by": userId,
        "file-type": type.toLowerCase(),
        "original-name": fileName,
      },
    })
  );

  return {
    fileKey,
    fileSize: buffer.length,
    mimeType: "application/pdf",
  };
}

// ─── Upload Image (for certificates, profile images) ───────────────────────

export async function uploadImage(
  buffer: Buffer,
  type: FileType,
  userId: string,
  fileName: string,
  mimeType: string
): Promise<UploadResult> {
  const ext = getExtensionFromMime(mimeType);
  const uuid = randomUUID();
  const fileKey = buildFileKey(type, userId, uuid, ext);

  await r2.send(
    new PutObjectCommand({
      Bucket: PUBLIC_BUCKET,
      Key: fileKey,
      Body: buffer,
      ContentType: mimeType,
      CacheControl: "public, max-age=31536000, immutable",
      ContentDisposition: `inline; filename="${sanitizeFilename(fileName)}"`,
      Metadata: {
        "uploaded-by": userId,
        "file-type": type.toLowerCase(),
      },
    })
  );

  return {
    fileKey,
    fileSize: buffer.length,
    mimeType,
  };
}

// ─── Delete from R2 (Hard delete) ───────────────────────────────────────────

/**
 * Permanently delete a file from R2 storage
 * WARNING: This cannot be undone. Use soft delete in DB for safety.
 */
export async function deleteFromR2(fileKey: string): Promise<void> {
  try {
    await r2.send(
      new DeleteObjectCommand({
        Bucket: PUBLIC_BUCKET,
        Key: fileKey,
      })
    );
  } catch (error: any) {
    // If file doesn't exist, that's okay (idempotent)
    if (error.name !== "NoSuchKey") {
      throw error;
    }
  }
}

// ─── Check if file exists in R2 ─────────────────────────────────────────────

export async function fileExistsInR2(fileKey: string): Promise<boolean> {
  try {
    await r2.send(
      new HeadObjectCommand({
        Bucket: PUBLIC_BUCKET,
        Key: fileKey,
      })
    );
    return true;
  } catch {
    return false;
  }
}

// ─── Helper Functions ───────────────────────────────────────────────────────

/**
 * Validate PDF magic bytes (%PDF)
 */
function isPDF(buffer: Buffer): boolean {
  return (
    buffer.length >= 4 &&
    buffer[0] === 0x25 && // %
    buffer[1] === 0x50 && // P
    buffer[2] === 0x44 && // D
    buffer[3] === 0x46    // F
  );
}

/**
 * Sanitize filename for safe download
 */
function sanitizeFilename(name: string): string {
  return name
    .replace(/[^\w\s.\-]/g, "")
    .trim()
    .slice(0, 200);
}

/**
 * Get file extension from MIME type
 */
function getExtensionFromMime(mimeType: string): string {
  const map: Record<string, string> = {
    "application/pdf": "pdf",
    "image/jpeg": "jpg",
    "image/jpg": "jpg",
    "image/png": "png",
    "image/webp": "webp",
    "image/gif": "gif",
  };
  return map[mimeType] || "bin";
}

// ─── Export types ───────────────────────────────────────────────────────────

export type { FileType } from "./cdn";
