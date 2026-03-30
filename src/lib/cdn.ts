/**
 * Core CDN utility for FluenzyAI
 * Builds permanent lifetime CDN URLs from file keys
 * 
 * GOLDEN RULES:
 * 1. Never call getSignedUrl() for public files
 * 2. Never store the output of cdnUrl() in the database
 * 3. Always store only fileKey in DB, build URL at runtime
 */

const CDN_BASE = process.env.NEXT_PUBLIC_CDN_BASE ?? "https://cdn.fluenzyai.app";

/**
 * Build a permanent lifetime CDN URL from a file key.
 * 
 * @param fileKey - R2 file key (e.g., "resumes/user123/uuid.pdf")
 * @returns Full CDN URL or null if invalid
 * 
 * @example
 * cdnUrl("resumes/abc123/uuid.pdf")
 * // → "https://cdn.fluenzyai.app/resumes/abc123/uuid.pdf"
 */
export function cdnUrl(fileKey: string | null | undefined): string | null {
  if (!fileKey || fileKey.trim() === "") return null;
  
  // Guard: reject if someone accidentally passed a full URL
  if (fileKey.startsWith("http")) {
    console.error("[cdn] cdnUrl() received a full URL instead of a fileKey:", fileKey);
    return fileKey; // degrade gracefully
  }
  
  return `${CDN_BASE}/${fileKey}`;
}

/**
 * File types supported by the system
 */
export type FileType = "RESUME" | "CERTIFICATE" | "REPORT" | "PROFILE_CERT" | "OFFER_LETTER" | "PAYMENT_RECEIPT";

/**
 * Get the R2 folder prefix for a file type
 */
export function getFileFolder(type: FileType): string {
  const map: Record<FileType, string> = {
    RESUME:           "resumes",
    CERTIFICATE:      "certificates",
    REPORT:           "reports",
    PROFILE_CERT:     "profile-certs",
    OFFER_LETTER:     "offer-letters",
    PAYMENT_RECEIPT:  "payment-receipts",
  };
  return map[type];
}

/**
 * Build a structured file key for R2 storage
 * 
 * @param type - File type (determines folder)
 * @param userId - User ID (for organization)
 * @param uuid - Unique filename (prevents collisions)
 * @param extension - File extension (default: pdf)
 * @returns Structured file key
 * 
 * @example
 * buildFileKey("RESUME", "user_abc123", "uuid-here")
 * // → "resumes/user_abc123/uuid-here.pdf"
 */
export function buildFileKey(
  type: FileType,
  userId: string,
  uuid: string,
  extension: string = "pdf"
): string {
  return `${getFileFolder(type)}/${userId}/${uuid}.${extension}`;
}

/**
 * Validate if a file key is safe (prevents path traversal)
 */
export function isValidFileKey(fileKey: string): boolean {
  if (!fileKey || fileKey.includes("..") || fileKey.startsWith("/")) {
    return false;
  }
  return true;
}

/**
 * Extract file type from file key
 */
export function getFileTypeFromKey(fileKey: string): FileType | null {
  if (fileKey.startsWith("resumes/")) return "RESUME";
  if (fileKey.startsWith("certificates/")) return "CERTIFICATE";
  if (fileKey.startsWith("reports/")) return "REPORT";
  if (fileKey.startsWith("profile-certs/")) return "PROFILE_CERT";
  if (fileKey.startsWith("offer-letters/")) return "OFFER_LETTER";
  if (fileKey.startsWith("payment-receipts/")) return "PAYMENT_RECEIPT";
  return null;
}
