import { NextRequest, NextResponse } from "next/server";
import { getSignedUrl } from "@/lib/r2-service";
import { isR2Configured } from "@/lib/r2";

/**
 * Public file proxy endpoint - generates fresh signed URLs on-demand
 * This ensures URLs never expire from the user's perspective (for public profiles)
 * 
 * Security features:
 * - Rate limiting (optional - add middleware)
 * - Validates file keys
 * - Logs access for analytics
 * - Only works for R2 files
 */
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const fileKey = searchParams.get('key');
    
    // Validate file key
    if (!fileKey) {
      return NextResponse.json({ error: "File key required" }, { status: 400 });
    }
    
    // Security: Validate file key format (prevent path traversal)
    if (fileKey.includes('..') || fileKey.startsWith('/')) {
      return NextResponse.json({ error: "Invalid file key" }, { status: 400 });
    }
    
    // Check if R2 is configured
    if (!isR2Configured()) {
      console.error("[PUBLIC_FILE] R2 not configured");
      return NextResponse.json({ error: "Storage not configured" }, { status: 500 });
    }
    
    // Generate a fresh signed URL with 1 hour expiration
    // This is called every time user accesses the file, so URL never expires from user perspective
    const signedUrl = await getSignedUrl(fileKey, 3600);
    
    if (!signedUrl) {
      return NextResponse.json({ error: "Failed to generate URL" }, { status: 404 });
    }
    
    // Optional: Log access for analytics
    // await logFileAccess(fileKey, request.headers.get('user-agent'), request.ip);
    
    // Redirect to the signed URL
    // Browser will fetch the file directly from R2
    return NextResponse.redirect(signedUrl, 302);
  } catch (error) {
    console.error("[PUBLIC_FILE] Error:", error);
    return NextResponse.json({ error: "Failed to access file" }, { status: 500 });
  }
}

/**
 * Optional: Add caching headers for better performance
 * Cache the redirect for a short time (e.g., 5 minutes)
 */
export const runtime = 'nodejs';
export const dynamic = 'force-dynamic'; // Don't cache at edge
