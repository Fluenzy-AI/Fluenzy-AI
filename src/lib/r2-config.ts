/**
 * Production-Ready R2 Configuration
 * 
 * Architecture:
 * - Private files: Use signed URLs (1 hour expiry) via proxy endpoint
 * - Public files: Use CDN URLs (lifetime access) for public profiles
 */

export const R2_CONFIG = {
  // Private bucket for secure files (resumes, certificates, interview recordings)
  PRIVATE_BUCKET: process.env.R2_BUCKET_NAME || "fluenzy-storage",
  
  // Public CDN domain (if configured)
  // Set this to your custom domain: cdn.fluenzyai.app
  PUBLIC_CDN_DOMAIN: process.env.R2_PUBLIC_CDN_DOMAIN || null,
  
  // Public bucket name (if using separate bucket for public assets)
  PUBLIC_BUCKET: process.env.R2_PUBLIC_BUCKET_NAME || null,
  
  // Default signed URL expiry (1 hour for private files)
  PRIVATE_URL_EXPIRY: 3600, // 1 hour
  
  // File type to storage mapping
  FILE_STORAGE_RULES: {
    // Private files (require signed URLs)
    "resume": { bucket: "private", requiresAuth: true, expiry: 3600 },
    "certificate": { bucket: "private", requiresAuth: false, expiry: 3600 },
    "offer-letter": { bucket: "private", requiresAuth: true, expiry: 3600 },
    "audit-pdf": { bucket: "private", requiresAuth: true, expiry: 3600 },
    "job-resume": { bucket: "private", requiresAuth: true, expiry: 3600 },
    "payment-receipt": { bucket: "private", requiresAuth: true, expiry: 3600 },
    "ats-resume": { bucket: "private", requiresAuth: true, expiry: 3600 },
    
    // Public files (can use CDN)
    "profile-cert": { bucket: "public", requiresAuth: false, expiry: null },
    "profile-image": { bucket: "public", requiresAuth: false, expiry: null },
  } as const,
} as const;

/**
 * Check if a file type should use public CDN
 */
export function shouldUsePublicCDN(fileType: string): boolean {
  const rule = R2_CONFIG.FILE_STORAGE_RULES[fileType as keyof typeof R2_CONFIG.FILE_STORAGE_RULES];
  return rule?.bucket === "public" && !!R2_CONFIG.PUBLIC_CDN_DOMAIN;
}

/**
 * Check if a file requires authentication
 */
export function requiresAuth(fileType: string): boolean {
  const rule = R2_CONFIG.FILE_STORAGE_RULES[fileType as keyof typeof R2_CONFIG.FILE_STORAGE_RULES];
  return rule?.requiresAuth ?? true;
}

/**
 * Get expiry time for a file type
 */
export function getExpiryTime(fileType: string): number | null {
  const rule = R2_CONFIG.FILE_STORAGE_RULES[fileType as keyof typeof R2_CONFIG.FILE_STORAGE_RULES];
  return rule?.expiry ?? R2_CONFIG.PRIVATE_URL_EXPIRY;
}
