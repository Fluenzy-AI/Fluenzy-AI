/**
 * GET /api/candidates/me
 * Returns current candidate + profile + linked user plan
 */
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCandidateFromRequest } from "@/lib/candidate-auth";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

export async function GET(req: NextRequest) {
  console.log('[CANDIDATES_ME_GET] Checking session...');
  
  // Try candidate session first (JWT)
  let session = getCandidateFromRequest(req);
  let candidateId: string | null = session?.id || null;
  let userEmail: string | null = session?.email || null;
  
  // If no candidate session, check NextAuth session
  if (!session) {
    console.log('[CANDIDATES_ME_GET] No candidate session, checking NextAuth...');
    const nextAuthSession = await getServerSession(authOptions);
    
    if (!nextAuthSession?.user?.email) {
      console.log('[CANDIDATES_ME_GET] No NextAuth session found');
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    
    console.log('[CANDIDATES_ME_GET] NextAuth user:', nextAuthSession.user.email);
    userEmail = nextAuthSession.user.email;
    
    // Find or create CandidateUser by email
    let candidateUser = await prisma.candidateUser.findFirst({
      where: {
        email: {
          equals: userEmail,
          mode: "insensitive"
        }
      }
    });
    
    if (!candidateUser) {
      console.log('[CANDIDATES_ME_GET] Creating new CandidateUser for:', userEmail);
      candidateUser = await prisma.candidateUser.create({
        data: {
          email: userEmail,
          name: nextAuthSession.user.name || '',
          password: '',
        }
      });
    }
    
    candidateId = candidateUser.id;
  }

  console.log('[CANDIDATES_ME_GET] Using candidateId:', candidateId);

  const candidate = await prisma.candidateUser.findUnique({
    where: { id: candidateId! },
    select: {
      id: true, name: true, email: true, createdAt: true,
      profile: true,
    },
  });

  if (!candidate) return NextResponse.json({ error: "Not found" }, { status: 404 });

  // Try to find linked main user account by email (case-insensitive)
  const linkedUser = await prisma.users.findFirst({
    where: {
      email: {
        equals: candidate.email,
        mode: "insensitive"
      }
    },
    select: { plan: true, id: true },
  });

  return NextResponse.json({
    candidate,
    user: linkedUser ? { plan: linkedUser.plan } : { plan: "Free" },
  });
}
