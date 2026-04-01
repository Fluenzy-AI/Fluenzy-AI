import { withAuth } from "next-auth/middleware";
import { NextResponse } from "next/server";
import { Role } from "@prisma/client";

export default withAuth(
  function middleware(req) {
    const token = req.nextauth.token;
    const pathname = req.nextUrl.pathname;
    const isProRoute = pathname === "/pro" || 
                      pathname.startsWith("/pro/") ||
                      pathname.startsWith("/api/pro");
    const isAdminRoute = pathname.startsWith("/superadmin") ||
                        pathname.startsWith("/api/admin");
    const isMarketingApiRoute = pathname.startsWith("/api/admin/marketing");

    if (isProRoute && token?.plan !== "Pro") {
      return NextResponse.redirect(new URL("/?upgrade=true", req.url));
    }

    // Allow MARKETING_ADMIN access to marketing API routes
    if (isMarketingApiRoute && !["SUPER_ADMIN", "MARKETING_ADMIN"].includes(token?.role as string)) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Block other admin routes for non-SUPER_ADMIN (but not marketing routes which are handled above)
    if (isAdminRoute && !isMarketingApiRoute && (token?.role as any) !== "SUPER_ADMIN") {
      return NextResponse.redirect(new URL("/", req.url));
    }

    return NextResponse.next();
  },
  {
    callbacks: {
      authorized: ({ token }) => !!token,
    },
  }
);

export const config = {
  matcher: [
    "/pro/:path*",
    "/api/pro/:path*",
    "/superadmin/:path*",
    "/api/admin/:path*",
    // Protect all training/module pages — unauthenticated users are redirected to sign-in
    "/train/:path*",
    "/history/:path*",
    "/profile/:path*",
    "/billing/:path*",
    "/ats/:path*",
    "/api/ats/:path*",
    // Protect module API endpoints so they always require a valid session
    "/api/evaluate-answer/:path*",
    "/api/gd/:path*",
    "/api/interview-guide/:path*",
    "/api/lesson-complete/:path*",
    "/api/daily-complete/:path*",
    "/api/check-module-access/:path*",
  ],
};