/**
 * Email Open Tracking API
 * GET - Track email opens via 1x1 pixel
 */

import { NextRequest, NextResponse } from "next/server";
import jwt from "jsonwebtoken";
import { handleTrackingEvent } from "@/lib/marketing/email-service";

const JWT_SECRET = process.env.NEXTAUTH_SECRET || "marketing-secret";

// 1x1 transparent GIF
const TRANSPARENT_GIF = Buffer.from(
  "R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7",
  "base64"
);

export async function GET(req: NextRequest) {
  try {
    const searchParams = req.nextUrl.searchParams;
    const token = searchParams.get("token");

    if (token) {
      try {
        const decoded = jwt.verify(token, JWT_SECRET) as {
          logId: string;
          action: string;
        };

        if (decoded.action === "open" && decoded.logId) {
          // Get user info from request headers
          const userAgent = req.headers.get("user-agent") || undefined;
          const ip = req.headers.get("x-forwarded-for") || 
                     req.headers.get("x-real-ip") || 
                     undefined;

          // Record the open event
          await handleTrackingEvent("open", decoded.logId, {
            userAgent,
            ip,
            openedAt: new Date().toISOString(),
          });
        }
      } catch (jwtError) {
        // Invalid token - silently fail (don't break email viewing)
        console.warn("Invalid tracking token:", jwtError);
      }
    }

    // Always return the tracking pixel
    return new NextResponse(TRANSPARENT_GIF, {
      status: 200,
      headers: {
        "Content-Type": "image/gif",
        "Content-Length": TRANSPARENT_GIF.length.toString(),
        "Cache-Control": "no-store, no-cache, must-revalidate, proxy-revalidate",
        "Pragma": "no-cache",
        "Expires": "0",
      },
    });
  } catch (error) {
    console.error("Open tracking error:", error);
    // Still return the pixel even on error
    return new NextResponse(TRANSPARENT_GIF, {
      status: 200,
      headers: {
        "Content-Type": "image/gif",
      },
    });
  }
}
