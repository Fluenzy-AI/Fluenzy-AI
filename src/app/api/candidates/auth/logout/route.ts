/**
 * POST /api/candidates/auth/logout
 */
import { NextResponse } from "next/server";
import { clearCandidateCookie } from "@/lib/candidate-auth";

export async function POST() {
  const res = NextResponse.json({ success: true });
  return clearCandidateCookie(res);
}
