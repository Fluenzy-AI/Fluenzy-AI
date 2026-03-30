/**
 * File Access Control for FluenzyAI
 * Enforces ownership and visibility rules for file operations
 */

import prisma from "./prisma";

export type AccessResult =
  | { ok: true; file: NonNullable<Awaited<ReturnType<typeof prisma.fileRecord.findUnique>>> }
  | { ok: false; status: 403 | 404; error: string };

/**
 * Check if a user can read/download a file
 * 
 * Access Rules:
 * - Owner can always read their own files (even deleted/private)
 * - Public visitors can only read files where isPublic=true AND isDeleted=false
 */
export async function checkReadAccess(
  fileId: string,
  requestingUserId?: string
): Promise<AccessResult> {
  const file = await prisma.fileRecord.findUnique({
    where: { id: fileId },
  });

  if (!file) {
    return { ok: false, status: 404, error: "File not found" };
  }

  const isOwner = file.userId === requestingUserId;

  // Owner can always read their own files (even deleted/private)
  if (isOwner) {
    return { ok: true, file };
  }

  // Public visitors: file must be public and not deleted
  if (!file.isPublic) {
    return { ok: false, status: 403, error: "This file is private" };
  }
  
  if (file.isDeleted) {
    return { ok: false, status: 404, error: "File not found" };
  }

  return { ok: true, file };
}

/**
 * Check if a user can mutate (delete/update) a file
 * 
 * Access Rules:
 * - Only the file owner can modify/delete files
 * - Admin users can modify any file (optional - not implemented yet)
 */
export async function checkWriteAccess(
  fileId: string,
  userId: string
): Promise<AccessResult> {
  const file = await prisma.fileRecord.findUnique({
    where: { id: fileId },
  });

  if (!file) {
    return { ok: false, status: 404, error: "File not found" };
  }

  // CRITICAL: Verify ownership
  if (file.userId !== userId) {
    return { ok: false, status: 403, error: "Forbidden" };
  }

  return { ok: true, file };
}

/**
 * Get user's files with access control
 */
export async function getUserFiles(
  userId: string,
  options?: {
    fileType?: string;
    includeDeleted?: boolean;
  }
) {
  const { fileType, includeDeleted = false } = options || {};

  return prisma.fileRecord.findMany({
    where: {
      userId,
      ...(fileType && { fileType }),
      ...(! includeDeleted && { isDeleted: false }),
    },
    orderBy: { createdAt: "desc" },
  });
}

/**
 * Get public files for a user (for public profile)
 */
export async function getPublicUserFiles(
  userId: string,
  fileType?: string
) {
  return prisma.fileRecord.findMany({
    where: {
      userId,
      isPublic: true,
      isDeleted: false,
      ...(fileType && { fileType }),
    },
    orderBy: { createdAt: "desc" },
  });
}
