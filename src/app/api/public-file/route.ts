import { NextRequest, NextResponse } from "next/server";
import { getPublicFileUrl } from "@/lib/file-url-helper";

/**
 * Public file proxy endpoint - generates fresh signed URLs on-demand
 * This ensures URLs never expire from the user's perspective
 */
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const fileKey = searchParams.get('key');
    
    if (!fileKey) {
      return NextResponse.json({ error: "File key required" }, { status: 400 });
    }
    
    // Generate a fresh signed URL with 1 hour expiration
    const signedUrl = await getPublicFileUrl(fileKey, 3600);
    
    if (!signedUrl) {
      return NextResponse.json({ error: "Failed to generate URL" }, { status: 404 });
    }
    
    // Redirect to the signed URL
    return NextResponse.redirect(signedUrl);
  } catch (error) {
    console.error("Public file proxy error:", error);
    return NextResponse.json({ error: "Failed to access file" }, { status: 500 });
  }
}
