import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { signCollegeToken } from "@/lib/collegeAuth";

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const code = searchParams.get("code");
  const error = searchParams.get("error");
  let baseUrl = process.env.NEXTAUTH_URL ?? "http://localhost:3000";
  // Remove trailing slash to prevent double slashes
  baseUrl = baseUrl.replace(/\/+$/, "");
  const redirectUri = `${baseUrl}/api/college/google-callback`;

  if (error || !code) {
    return NextResponse.redirect(`${baseUrl}/college/login?error=google_cancelled`);
  }

  try {
    // Exchange code for tokens
    const tokenRes = await fetch("https://oauth2.googleapis.com/token", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        code,
        client_id: process.env.GOOGLE_CLIENT_ID!,
        client_secret: process.env.GOOGLE_CLIENT_SECRET!,
        redirect_uri: redirectUri,
        grant_type: "authorization_code",
      }),
    });

    if (!tokenRes.ok) {
      return NextResponse.redirect(`${baseUrl}/college/login?error=google_failed`);
    }

    const tokens = await tokenRes.json();

    // Get user info from Google
    const userRes = await fetch("https://www.googleapis.com/oauth2/v2/userinfo", {
      headers: { Authorization: `Bearer ${tokens.access_token}` },
    });

    if (!userRes.ok) {
      return NextResponse.redirect(`${baseUrl}/college/login?error=google_failed`);
    }

    const googleUser = await userRes.json();
    const email: string = googleUser.email?.toLowerCase();

    if (!email) {
      return NextResponse.redirect(`${baseUrl}/college/login?error=google_failed`);
    }

    // STRICT CHECK: Only allow if this email is already a registered CollegeAdmin
    const admin = await (prisma as any).collegeAdmin.findUnique({
      where: { email },
    });

    if (!admin) {
      // Not registered — block Google login
      return NextResponse.redirect(
        `${baseUrl}/college/login?error=not_registered`
      );
    }

    // Check account status
    if (admin.status === "PENDING") {
      return NextResponse.redirect(`${baseUrl}/college/login?error=pending`);
    }
    if (admin.status === "REJECTED") {
      return NextResponse.redirect(`${baseUrl}/college/login?error=rejected`);
    }
    if (admin.status === "SUSPENDED") {
      return NextResponse.redirect(`${baseUrl}/college/login?error=suspended`);
    }

    // Issue college JWT
    const token = signCollegeToken({
      collegeAdminId: admin.id,
      email: admin.email,
      domain: admin.domain,
      collegeName: admin.collegeName,
    });

    // Redirect to dashboard with token in query (frontend picks it up and stores)
    const response = NextResponse.redirect(
      `${baseUrl}/college/dashboard?college_token=${encodeURIComponent(token)}`
    );

    response.cookies.set("college_token", token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 60 * 60 * 24 * 7,
      path: "/",
    });

    return response;
  } catch (err) {
    console.error("[college/google-callback]", err);
    return NextResponse.redirect(`${baseUrl}/college/login?error=google_failed`);
  }
}
