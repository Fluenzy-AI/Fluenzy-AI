import { withAuth } from "next-auth/middleware";
import { NextResponse } from "next/server";
import { Role } from "@prisma/client";

export default withAuth(
  function middleware(req) {
    const token = req.nextauth.token;
    const isProRoute = req.nextUrl.pathname.startsWith("/pro") ||
                      req.nextUrl.pathname.startsWith("/api/pro");
    const isAdminRoute = req.nextUrl.pathname.startsWith("/superadmin") ||
                        req.nextUrl.pathname.startsWith("/api/admin");

    if (isProRoute && token?.plan !== "Pro") {
      return NextResponse.redirect(new URL("/?upgrade=true", req.url));
    }

    if (isAdminRoute && (token?.role as any) !== "SUPER_ADMIN") {
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
    // Protect module API endpoints so they always require a valid session
    "/api/evaluate-answer/:path*",
    "/api/gd/:path*",
    "/api/interview-guide/:path*",
    "/api/lesson-complete/:path*",
    "/api/daily-complete/:path*",
    "/api/check-module-access/:path*",
  ],
};