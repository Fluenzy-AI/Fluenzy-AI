/**
 * Document Service — Generate Once, Serve from CDN Forever
 * 
 * Central service for all PDF document operations.
 * Every PDF endpoint should call `getOrGenerateDocument()` instead of
 * directly invoking Puppeteer.
 * 
 * Flow:
 * 1. Check FileRecord cache by (documentType, documentId)
 * 2. Cache hit → return CDN URL immediately (zero Puppeteer)
 * 3. Cache miss → call generatePdf() → upload to R2 → create FileRecord → return CDN URL
 * 4. forceRegenerate → delete old → regenerate → update FileRecord
 * 
 * IMPORTANT: This module NEVER imports Puppeteer directly.
 * The caller provides a `generatePdf()` function that encapsulates PDF generation.
 */

import { createHash } from "crypto";
import prisma from "./prisma";
import { uploadToR2, getPublicUrl, deleteFromR2 } from "./r2-service";
import { isR2Configured } from "./r2";
import { cdnUrl } from "./cdn";
import {
  type DocumentType,
  buildDocumentFileName,
  buildDocumentStorageKey,
  buildCertificateFileName,
} from "./document-types";

// ── Types ────────────────────────────────────────────────────────────────────

export interface GetOrGenerateDocumentOptions {
  /** Type of document (determines R2 folder and naming) */
  documentType: DocumentType;

  /** Primary key of the source record (certificate ID, payment ID, etc.) */
  documentId: string;

  /** Owner of the document (userId, orgId, collegeAdminId) */
  ownerId: string;

  /**
   * Lazy PDF generator — only called on cache miss.
   * Must return a Buffer containing the PDF bytes.
   */
  generatePdf: () => Promise<Buffer>;

  /**
   * Deterministic file name for the PDF.
   * If not provided, one is auto-generated from documentType + documentId.
   */
  fileName?: string;

  /** If true, force regeneration even if cached */
  forceRegenerate?: boolean;

  /** Optional metadata to store alongside the FileRecord */
  metadata?: Record<string, unknown>;
}

export interface DocumentResult {
  /** Public CDN URL for the document */
  cdnUrl: string;

  /** R2 storage key */
  fileKey: string;

  /** Whether the result came from cache */
  cached: boolean;

  /** PDF buffer (only available on cache miss or when explicitly requested) */
  pdfBuffer?: Buffer;

  /** File size in bytes */
  fileSize: number;
}

// ── Core Service ─────────────────────────────────────────────────────────────

/**
 * Get an existing document from cache or generate + cache a new one.
 * 
 * This is the ONLY function that PDF endpoints should call.
 * 
 * @example
 * // In a certificate PDF route:
 * const result = await getOrGenerateDocument({
 *   documentType: "certificate",
 *   documentId: certificate.id,
 *   ownerId: hrStaffId,
 *   fileName: buildCertificateFileName(certificate.certificateNumber),
 *   generatePdf: async () => generateCertificatePdfBuffer(certData),
 * });
 * 
 * // Redirect to CDN
 * return NextResponse.redirect(result.cdnUrl);
 */
export async function getOrGenerateDocument(
  options: GetOrGenerateDocumentOptions
): Promise<DocumentResult> {
  const {
    documentType,
    documentId,
    ownerId,
    generatePdf,
    forceRegenerate = false,
    metadata,
  } = options;

  const fileName =
    options.fileName ||
    buildDocumentFileName(documentType, documentId);

  const storageKey = buildDocumentStorageKey(documentType, ownerId, fileName);

  // ── Step 1: Check cache (unless forceRegenerate) ─────────────────────────
  if (!forceRegenerate) {
    const cached = await findCachedDocument(documentType, documentId, ownerId);
    if (cached) {
      // Update access stats asynchronously (fire-and-forget)
      updateAccessStats(cached.id).catch(() => {});

      const url = cdnUrl(cached.fileKey);
      if (url) {
        console.info(
          `[DOC-SERVICE] Cache HIT: ${documentType}/${documentId} → ${url}`
        );
        return {
          cdnUrl: url,
          fileKey: cached.fileKey,
          cached: true,
          fileSize: cached.fileSize,
        };
      }
    }
  }

  // ── Step 2: Generate PDF ─────────────────────────────────────────────────
  console.info(
    `[DOC-SERVICE] Cache MISS: generating ${documentType}/${documentId}...`
  );
  const startTime = Date.now();
  const pdfBuffer = await generatePdf();
  const generationDurationMs = Date.now() - startTime;

  console.info(
    `[DOC-SERVICE] Generated ${documentType}/${documentId} in ${generationDurationMs}ms (${pdfBuffer.byteLength} bytes)`
  );

  // ── Step 3: Upload to R2 ─────────────────────────────────────────────────
  if (!isR2Configured()) {
    console.warn("[DOC-SERVICE] R2 not configured — returning PDF buffer directly");
    return {
      cdnUrl: "",
      fileKey: storageKey,
      cached: false,
      pdfBuffer,
      fileSize: pdfBuffer.byteLength,
    };
  }

  // If force regenerating, delete old file first
  if (forceRegenerate) {
    await cleanupOldDocument(documentType, documentId, ownerId);
  }

  // Upload with immutable cache headers
  await uploadToR2(storageKey, pdfBuffer, "application/pdf");

  // Compute hash for dedup/integrity
  const pdfHash = createHash("sha256").update(pdfBuffer).digest("hex");

  // ── Step 4: Create/Update FileRecord ─────────────────────────────────────
  const now = new Date();

  // Upsert: update if exists (forceRegenerate), create if not
  try {
    const existingRecord = await prisma.fileRecord.findFirst({
      where: {
        fileType: documentType,
        metadata: {
          path: ["documentId"],
          equals: documentId,
        },
      },
    });

    if (existingRecord) {
      await prisma.fileRecord.update({
        where: { id: existingRecord.id },
        data: {
          fileKey: storageKey,
          originalFileName: fileName,
          fileSize: pdfBuffer.byteLength,
          mimeType: "application/pdf",
          isPublic: true,
          metadata: {
            documentId,
            documentType,
            pdfHash,
            pdfVersion: ((existingRecord.metadata as any)?.pdfVersion || 0) + 1,
            pdfGeneratedAt: now.toISOString(),
            generationDurationMs,
            storageProvider: "cloudflare-r2",
            ...(metadata || {}),
          },
          updatedAt: now,
        },
      });
    } else {
      await prisma.fileRecord.create({
        data: {
          userId: ownerId.length === 24 ? ownerId : undefined,
          fileType: documentType,
          fileKey: storageKey,
          originalFileName: fileName,
          fileSize: pdfBuffer.byteLength,
          mimeType: "application/pdf",
          isPublic: true,
          metadata: {
            documentId,
            documentType,
            pdfHash,
            pdfVersion: 1,
            pdfGeneratedAt: now.toISOString(),
            generationDurationMs,
            storageProvider: "cloudflare-r2",
            lastAccessedAt: now.toISOString(),
            accessCount: 0,
            ...(metadata || {}),
          },
        },
      });
    }
  } catch (dbError) {
    // Non-fatal — PDF is already in R2, just log the error
    console.error("[DOC-SERVICE] FileRecord save failed:", dbError);
  }

  const resultUrl = cdnUrl(storageKey) || "";
  console.info(`[DOC-SERVICE] Cached to R2: ${resultUrl}`);

  return {
    cdnUrl: resultUrl,
    fileKey: storageKey,
    cached: false,
    pdfBuffer,
    fileSize: pdfBuffer.byteLength,
  };
}

// ── Helper: Find cached document ─────────────────────────────────────────────

async function findCachedDocument(
  documentType: DocumentType,
  documentId: string,
  ownerId: string
): Promise<{ id: string; fileKey: string; fileSize: number } | null> {
  try {
    const record = await prisma.fileRecord.findFirst({
      where: {
        fileType: documentType,
        isDeleted: false,
        metadata: {
          path: ["documentId"],
          equals: documentId,
        },
      },
      select: {
        id: true,
        fileKey: true,
        fileSize: true,
      },
    });

    return record;
  } catch {
    return null;
  }
}

// ── Helper: Update access stats ──────────────────────────────────────────────

async function updateAccessStats(fileRecordId: string): Promise<void> {
  try {
    const existing = await prisma.fileRecord.findUnique({
      where: { id: fileRecordId },
      select: { metadata: true },
    });

    const meta = (existing?.metadata as any) || {};

    await prisma.fileRecord.update({
      where: { id: fileRecordId },
      data: {
        metadata: {
          ...meta,
          lastAccessedAt: new Date().toISOString(),
          accessCount: (meta.accessCount || 0) + 1,
        },
      },
    });
  } catch {
    // Non-fatal
  }
}

// ── Helper: Cleanup old document ─────────────────────────────────────────────

async function cleanupOldDocument(
  documentType: DocumentType,
  documentId: string,
  ownerId: string
): Promise<void> {
  try {
    const existing = await prisma.fileRecord.findFirst({
      where: {
        fileType: documentType,
        isDeleted: false,
        metadata: {
          path: ["documentId"],
          equals: documentId,
        },
      },
    });

    if (existing) {
      // Delete from R2
      try {
        await deleteFromR2(existing.fileKey);
      } catch {
        // R2 deletion failure is non-fatal
      }

      // Soft-delete the FileRecord
      await prisma.fileRecord.update({
        where: { id: existing.id },
        data: {
          isDeleted: true,
          deletedAt: new Date(),
        },
      });

      console.info(`[DOC-SERVICE] Cleaned up old document: ${existing.fileKey}`);
    }
  } catch {
    // Non-fatal
  }
}

// ── Convenience: Get cached document URL or null ─────────────────────────────

/**
 * Check if a document is already cached. Returns CDN URL if yes, null if not.
 * Does NOT trigger generation — use getOrGenerateDocument() for that.
 */
export async function getCachedDocumentUrl(
  documentType: DocumentType,
  documentId: string,
  ownerId: string
): Promise<string | null> {
  const cached = await findCachedDocument(documentType, documentId, ownerId);
  if (!cached) return null;
  return cdnUrl(cached.fileKey);
}

/**
 * Get the PDF buffer for a cached document.
 * Useful for email attachments where you need the buffer, not a URL.
 * 
 * Returns the buffer from R2, or null if not cached.
 */
export async function getCachedDocumentBuffer(
  documentType: DocumentType,
  documentId: string,
  ownerId: string
): Promise<Buffer | null> {
  const cached = await findCachedDocument(documentType, documentId, ownerId);
  if (!cached) return null;

  try {
    // Fetch from CDN (which is backed by R2)
    const url = cdnUrl(cached.fileKey);
    if (!url) return null;

    const response = await fetch(url);
    if (!response.ok) return null;

    const arrayBuffer = await response.arrayBuffer();
    return Buffer.from(arrayBuffer);
  } catch {
    return null;
  }
}

/**
 * Invalidate a cached document (marks as deleted, optionally removes from R2).
 * Use when the source data changes (e.g., profile updated → resume needs regeneration).
 */
export async function invalidateDocument(
  documentType: DocumentType,
  documentId: string,
  ownerId: string
): Promise<void> {
  await cleanupOldDocument(documentType, documentId, ownerId);
}
