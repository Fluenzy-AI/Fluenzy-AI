import { getSignedUrl as getR2SignedUrl } from "@/lib/r2-service";
import { isR2Configured } from "@/lib/r2";

/**
 * Converts a stored fileUrl/fileKey to a publicly accessible URL
 * 
 * @param fileUrl - Can be:
 *   - R2 key: "resumes/userId_timestamp.pdf"
 *   - Filesystem path: "/uploads/resumes/userId/file.pdf"
 *   - Already a full URL: "https://..."
 * @param expiresInSeconds - Optional expiration time in seconds (default: 7 days)
 * 
 * @returns Public URL that can be used to access the file
 */
export async function getPublicFileUrl(fileUrl: string | null | undefined, expiresInSeconds: number = 604800): Promise<string | null> {
  if (!fileUrl) return null;
  
  // Already a full URL (http/https)
  if (fileUrl.startsWith('http://') || fileUrl.startsWith('https://')) {
    return fileUrl;
  }
  
  // Check if it's an R2 key (doesn't start with /)
  const isR2File = !fileUrl.startsWith('/');
  
  if (isR2File && isR2Configured()) {
    try {
      // Generate signed URL from R2 with configurable expiry (default: 7 days for public profiles)
      const signedUrl = await getR2SignedUrl(fileUrl, expiresInSeconds);
      return signedUrl;
    } catch (error) {
      console.error(`[FILE_URL] Failed to get R2 signed URL for ${fileUrl}:`, error);
      
      // Fallback: return a URL through our /resumes/ route
      const filename = fileUrl.split('/').pop();
      if (filename) {
        return `/resumes/${filename}`;
      }
    }
  }
  
  // Filesystem path - return as-is (will be served from public folder or our route)
  if (fileUrl.startsWith('/uploads/resumes/') || fileUrl.startsWith('/resumes/')) {
    return fileUrl;
  }
  
  // Unknown format - try to extract filename and use our route
  const filename = fileUrl.split('/').pop();
  if (filename && filename.endsWith('.pdf')) {
    return `/resumes/${filename}`;
  }
  
  return fileUrl;
}

/**
 * Batch version of getPublicFileUrl for better performance
 */
export async function getPublicFileUrls(fileUrls: (string | null | undefined)[], expiresInSeconds?: number): Promise<(string | null)[]> {
  return Promise.all(fileUrls.map(url => getPublicFileUrl(url, expiresInSeconds)));
}
