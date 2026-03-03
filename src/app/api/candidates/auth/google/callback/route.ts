import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { signCandidateToken, setCandidateCookie } from "@/lib/candidate-auth";

interface GoogleTokenResponse {
  access_token: string;
  error?: string;
}

interface GoogleUserInfo {
  sub: string;
  name: string;
  email: string;
  picture?: string;
  email_verified?: boolean;
}

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const code = searchParams.get("code");
  const stateRaw = searchParams.get("state");
  const appUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
  const callbackUrl = `${appUrl}/api/candidates/auth/google/callback`;

  // Parse redirect from state
  let redirect = "/candidates/dashboard";
  if (stateRaw) {
    try {
      const parsed = JSON.parse(Buffer.from(stateRaw, "base64url").toString());
      if (parsed.redirect) redirect = parsed.redirect;
    } catch {}
  }

  const errorRedirect = (msg: string) =>
    NextResponse.redirect(`${appUrl}/candidates/login?error=${encodeURIComponent(msg)}`);

  if (!code) return errorRedirect("Google login cancelled");

  // Exchange code for access token
  const tokenRes = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      code,
      client_id: process.env.GOOGLE_CLIENT_ID!,
      client_secret: process.env.GOOGLE_CLIENT_SECRET!,
      redirect_uri: callbackUrl,
      grant_type: "authorization_code",
    }),
  });

  const tokens: GoogleTokenResponse = await tokenRes.json();
  if (tokens.error || !tokens.access_token) {
    return errorRedirect("Google authentication failed");
  }

  // Get user info from Google
  const userRes = await fetch("https://www.googleapis.com/oauth2/v3/userinfo", {
    headers: { Authorization: `Bearer ${tokens.access_token}` },
  });
  const googleUser: GoogleUserInfo = await userRes.json();

  if (!googleUser.email) return errorRedirect("Could not retrieve your Google email");

  // Find or create CandidateUser
  let candidate = await prisma.candidateUser.findUnique({
    where: { email: googleUser.email },
  });

  if (!candidate) {
    // Create new candidate with Google (no password needed)
    candidate = await prisma.candidateUser.create({
      data: {
        email: googleUser.email,
        name: googleUser.name || googleUser.email.split("@")[0],
        password: "", // Empty — Google-only account
        isVerified: true,
        profile: {
          create: { profileCompletion: 10 },
        },
      },
    });
  }

  // Set JWT cookie and redirect
  const token = signCandidateToken({ id: candidate.id, email: candidate.email, name: candidate.name, role: "CANDIDATE" });
  const response = NextResponse.redirect(`${appUrl}${redirect}`);
  setCandidateCookie(response, token);

  return response;
}
