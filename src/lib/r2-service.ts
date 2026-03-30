/**
 * R2 Storage Service
 * Provides upload, download (CDN/signed URL), and delete operations for Cloudflare R2
 * 
 * IMPORTANT: For public files (resumes, certificates, etc), use getPublicUrl() which returns
 * lifetime CDN URLs. Only use getSignedUrl() for truly private/temporary access.
 */

import {
  PutObjectCommand,
  GetObjectCommand,
  DeleteObjectCommand,
  HeadObjectCommand,
} from "@aws-sdk/client-s3";
import { getSignedUrl as awsGetSignedUrl } from "@aws-sdk/s3-request-presigner";
import { r2Client, R2_BUCKET, isR2Configured } from "./r2";
import { v4 as uuidv4 } from "uuid";
import { cdnUrl } from "./cdn";

export type FileType =
  | "resume"
  | "certificate"
  | "offer-letter"
  | "profile-cert"
  | "audit-pdf"
  | "job-resume"
  | "payment-receipt"
  | "ats-resume";

/**
 * Build a unique file key for R2 storage
 */
export function buildFileKey(
  fileType: FileType,
  id: string,
  originalName?: string,
  jobSlug?: string
): string {
  const uid = uuidv4();
  const ext = originalName?.split(".").pop()?.toLowerCase() || "pdf";

  const prefixMap: Record<FileType, string> = {
    resume: `resumes/${id}_${uid}.${ext}`,
    certificate: `certificates/${id}_${uid}.pdf`,
    "offer-letter": `offer-letters/${id}_${uid}.pdf`,
    "profile-cert": `profile-certs/${id}_${uid}.pdf`,
    "audit-pdf": `audit-pdfs/${id}_${uid}.pdf`,
    "job-resume": `job-resumes/${id}_${jobSlug || "apply"}_${uid}.pdf`,
    "payment-receipt": `receipts/${id}_${uid}.pdf`,
    "ats-resume": `ats-resumes/${id}_${uid}.${ext}`,
  };

  return prefixMap[fileType] ?? `misc/${id}_${uid}.${ext}`;
}

/**
 * Upload a file buffer to R2
 */
export async function uploadToR2(
  fileKey: string,
  buffer: Buffer,
  mimeType: string
): Promise<string> {
  if (!isR2Configured()) {
    console.error("[R2] Not configured! Missing env vars:", {
      hasEndpoint: !!process.env.R2_ENDPOINT,
      hasAccessKey: !!process.env.R2_ACCESS_KEY_ID,
      hasSecretKey: !!process.env.R2_SECRET_ACCESS_KEY,
      hasBucket: !!process.env.R2_BUCKET_NAME,
      bucketName: process.env.R2_BUCKET_NAME,
    });
    throw new Error("R2 is not configured. Check environment variables.");
  }

  console.info(`[R2] Uploading to bucket: ${R2_BUCKET}, key: ${fileKey}`);
  
  try {
    await r2Client.send(
      new PutObjectCommand({
        Bucket: R2_BUCKET,
        Key: fileKey,
        Body: buffer,
        ContentType: mimeType,
      })
    );

    console.info(`[R2] Upload SUCCESS: ${fileKey} (${buffer.length} bytes)`);
    return fileKey;
  } catch (error: unknown) {
    const err = error as Error & { Code?: string; $metadata?: { httpStatusCode?: number } };
    console.error(`[R2] Upload FAILED:`, {
      fileKey,
      bucket: R2_BUCKET,
      errorName: err.name,
      errorMessage: err.message,
      errorCode: err.Code,
      httpStatus: err.$metadata?.httpStatusCode,
    });
    throw error;
  }
}

/**
 * Get public CDN URL for a file (LIFETIME ACCESS - recommended for public files)
 * 
 * Use this for:
 * - Job application resumes
 * - Public profile resumes/certificates
 * - Any file that should be publicly accessible long-term
 * 
 * @param fileKey - R2 file key (e.g., "resumes/userId/uuid.pdf")
 * @returns Lifetime CDN URL or null if invalid
 */
export function getPublicUrl(fileKey: string): string | null {
  return cdnUrl(fileKey);
}

/**
 * Generate a pre-signed URL for downloading a file (TEMPORARY ACCESS)
 * Default expiration: 5 minutes (300 seconds)
 * 
 * IMPORTANT: Only use this for truly private/temporary files.
 * For public files (resumes, certificates), use getPublicUrl() instead.
 */
export async function getSignedUrl(
  fileKey: string,
  expiresInSeconds: number = 300
): Promise<string> {
  if (!isR2Configured()) {
    throw new Error("R2 is not configured. Check environment variables.");
  }

  const command = new GetObjectCommand({
    Bucket: R2_BUCKET,
    Key: fileKey,
  });

  const url = await awsGetSignedUrl(r2Client, command, {
    expiresIn: expiresInSeconds,
  });

  return url;
}

/**
 * Delete a file from R2
 */
export async function deleteFromR2(fileKey: string): Promise<void> {
  if (!isR2Configured()) {
    throw new Error("R2 is not configured. Check environment variables.");
  }

  await r2Client.send(
    new DeleteObjectCommand({
      Bucket: R2_BUCKET,
      Key: fileKey,
    })
  );

  console.info(`[R2] Deleted: ${fileKey}`);
}

/**
 * Check if a file exists in R2
 */
export async function fileExistsInR2(fileKey: string): Promise<boolean> {
  if (!isR2Configured()) {
    return false;
  }

  try {
    await r2Client.send(
      new HeadObjectCommand({
        Bucket: R2_BUCKET,
        Key: fileKey,
      })
    );
    return true;
  } catch {
    return false;
  }
}

/**
 * Upload PDF buffer and return the file key
 * Convenience wrapper for PDF uploads
 */
export async function uploadPdfToR2(
  fileType: FileType,
  id: string,
  pdfBuffer: Buffer,
  originalName?: string,
  jobSlug?: string
): Promise<string> {
  const fileKey = buildFileKey(fileType, id, originalName, jobSlug);
  await uploadToR2(fileKey, pdfBuffer, "application/pdf");
  return fileKey;
}
