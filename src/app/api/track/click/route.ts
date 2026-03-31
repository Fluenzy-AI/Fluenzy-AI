/**
 * Email Click Tracking API
 * GET - Track link clicks and redirect to actual URL
 */

import { NextRequest, NextResponse } from "next/server";
import jwt from "jsonwebtoken";
import { handleTrackingEvent } from "@/lib/marketing/email-service";

const JWT_SECRET = process.env.NEXTAUTH_SECRET || "marketing-secret";

export async function GET(req: NextRequest) {
  try {
    const searchParams = req.nextUrl.searchParams;
    const token = searchParams.get("token");
    const fallbackUrl = searchParams.get("url");

    // Default redirect URL if everything fails
    let redirectUrl = fallbackUrl || "https://www.fluenzyai.app";

    if (token) {
      try {
        const decoded = jwt.verify(token, JWT_SECRET) as {
          logId: string;
          action: string;
          url: string;
        };

        if (decoded.action === "click" && decoded.logId && decoded.url) {
          // Get the actual redirect URL
          redirectUrl = decoded.url;

          // Get user info from request headers
          const userAgent = req.headers.get("user-agent") || undefined;
          const ip = req.headers.get("x-forwarded-for") || 
                     req.headers.get("x-real-ip") || 
                     undefined;
          const referer = req.headers.get("referer") || undefined;

          // Record the click event
          await handleTrackingEvent("click", decoded.logId, {
            userAgent,
            ip,
            referer,
            clickedUrl: redirectUrl,
            clickedAt: new Date().toISOString(),
          });
        }
      } catch (jwtError) {
        // Invalid token - use fallback URL
        console.warn("Invalid tracking token:", jwtError);
      }
    }

    // Redirect to the actual URL
    return NextResponse.redirect(redirectUrl, {
      status: 302,
      headers: {
        "Cache-Control": "no-store, no-cache, must-revalidate",
      },
    });
  } catch (error) {
    console.error("Click tracking error:", error);
    // Redirect to homepage on error
    return NextResponse.redirect("https://www.fluenzyai.app", { status: 302 });
  }
}
