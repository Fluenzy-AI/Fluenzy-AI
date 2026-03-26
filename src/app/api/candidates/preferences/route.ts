/**
 * Candidate Job Preferences API
 * GET /api/candidates/preferences - Get preferences
 * PATCH /api/candidates/preferences - Update preferences
 */

import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getCandidateSession } from "@/lib/candidate-auth";
import { getAutoApplyLimitByPlan } from "@/lib/company-auth";
import { z } from "zod";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

const PreferencesSchema = z.object({
  autoApplyEnabled: z.boolean().optional(),
  targetRoles: z.array(z.string()).optional(),
  targetLocations: z.array(z.string()).optional(),
  targetTypes: z.array(z.string()).optional(),
  minSalary: z.string().optional(),
  maxExperience: z.string().optional(),
  excludeCompanies: z.array(z.string()).optional(),
});

export async function GET(req: NextRequest) {
  try {
    console.log('[CANDIDATE_PREFERENCES_GET] Checking session...');
    
    // Try candidate session first (JWT)
    let session = await getCandidateSession();
    let candidateId: string | null = session?.id || null;
    let userEmail: string | null = session?.email || null;
    
    // If no candidate session, check NextAuth session
    if (!session) {
      console.log('[CANDIDATE_PREFERENCES_GET] No candidate session, checking NextAuth...');
      const nextAuthSession = await getServerSession(authOptions);
      
      if (!nextAuthSession?.user?.email) {
        console.log('[CANDIDATE_PREFERENCES_GET] No NextAuth session found');
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
      }
      
      console.log('[CANDIDATE_PREFERENCES_GET] NextAuth user:', nextAuthSession.user.email);
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
        console.log('[CANDIDATE_PREFERENCES_GET] Creating new CandidateUser for:', userEmail);
        // Auto-create CandidateUser from NextAuth user
        candidateUser = await prisma.candidateUser.create({
          data: {
            email: userEmail,
            name: nextAuthSession.user.name || '',
            password: '', // No password needed for auto-linked accounts
          }
        });
        console.log('[CANDIDATE_PREFERENCES_GET] Created CandidateUser:', candidateUser.id);
      }
      
      candidateId = candidateUser.id;
    }

    console.log('[CANDIDATE_PREFERENCES_GET] Using candidateId:', candidateId);

    // Get candidate profile to determine plan
    const candidate = await prisma.candidateUser.findUnique({
      where: { id: candidateId! },
      include: { profile: true },
    });

    if (!candidate) {
      return NextResponse.json({ error: "Candidate not found" }, { status: 404 });
    }

    // Get linked main user account to determine plan (case-insensitive)
    const linkedUser = await prisma.users.findFirst({
      where: {
        email: {
          equals: candidate.email,
          mode: "insensitive"
        }
      },
      select: { plan: true, email: true, name: true },
    });
    
    console.log('[CANDIDATE_PREFS_GET] Candidate email:', candidate.email);
    console.log('[CANDIDATE_PREFS_GET] Linked user:', linkedUser);
    
    const plan = linkedUser?.plan || "Free";
    const monthlyLimit = getAutoApplyLimitByPlan(plan);
    
    console.log('[CANDIDATE_PREFS_GET] Determined plan:', plan);
    console.log('[CANDIDATE_PREFS_GET] Monthly limit:', monthlyLimit);
    console.log('[CANDIDATE_PREFS_GET] Using candidateId:', candidateId);

    // Get or create preferences
    let preferences = await prisma.candidateJobPreferences.findUnique({
      where: { candidateId: candidateId! },
    });

    if (!preferences) {
      // Create default preferences
      preferences = await prisma.candidateJobPreferences.create({
        data: {
          candidateId: candidateId!,
          autoApplyEnabled: false,
          targetRoles: [],
          targetLocations: [],
          targetTypes: [],
          excludeCompanies: [],
          monthlyLimit,
        },
      });
    }

    // Check if we need to reset monthly count
    const now = new Date();
    const resetDate = new Date(preferences.lastResetAt);
    resetDate.setMonth(resetDate.getMonth() + 1);
    resetDate.setDate(1);
    resetDate.setHours(0, 0, 0, 0);

    if (now >= resetDate) {
      preferences = await prisma.candidateJobPreferences.update({
        where: { id: preferences.id },
        data: {
          autoApplyCount: 0,
          lastResetAt: now,
        },
      });
    }

    return NextResponse.json({
      success: true,
      preferences: {
        autoApplyEnabled: preferences.autoApplyEnabled,
        targetRoles: preferences.targetRoles,
        targetLocations: preferences.targetLocations,
        targetTypes: preferences.targetTypes,
        minSalary: preferences.minSalary,
        maxExperience: preferences.maxExperience,
        excludeCompanies: preferences.excludeCompanies,
        autoApplyCount: preferences.autoApplyCount,
        monthlyLimit: monthlyLimit, // Use dynamically calculated limit based on current plan
      },
      plan,
      canAutoApply: plan !== "Free",
    });
  } catch (error) {
    console.error("[CANDIDATE_PREFS_GET]", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function PATCH(req: NextRequest) {
  try {
    console.log('[CANDIDATE_PREFERENCES_PATCH] Checking session...');
    
    // Try candidate session first (JWT)
    let session = await getCandidateSession();
    let candidateId: string | null = session?.id || null;
    let userEmail: string | null = session?.email || null;
    
    // If no candidate session, check NextAuth session
    if (!session) {
      console.log('[CANDIDATE_PREFERENCES_PATCH] No candidate session, checking NextAuth...');
      const nextAuthSession = await getServerSession(authOptions);
      
      if (!nextAuthSession?.user?.email) {
        console.log('[CANDIDATE_PREFERENCES_PATCH] No NextAuth session found');
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
      }
      
      console.log('[CANDIDATE_PREFERENCES_PATCH] NextAuth user:', nextAuthSession.user.email);
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
        console.log('[CANDIDATE_PREFERENCES_PATCH] Creating new CandidateUser for:', userEmail);
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

    console.log('[CANDIDATE_PREFERENCES_PATCH] Using candidateId:', candidateId);

    const body = await req.json();
    const parsed = PreferencesSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: "Invalid data" }, { status: 400 });
    }

    const data = parsed.data;

    // Get candidate to determine plan
    const candidate = await prisma.candidateUser.findUnique({
      where: { id: candidateId! },
      select: { email: true },
    });

    if (!candidate) {
      return NextResponse.json({ error: "Candidate not found" }, { status: 404 });
    }

    // Get linked user plan (case-insensitive)
    const linkedUser = await prisma.users.findFirst({
      where: {
        email: {
          equals: candidate.email,
          mode: "insensitive"
        }
      },
      select: { plan: true },
    });
    const plan = linkedUser?.plan || "Free";
    const monthlyLimit = getAutoApplyLimitByPlan(plan);

    // Update or create preferences
    const preferences = await prisma.candidateJobPreferences.upsert({
      where: { candidateId: candidateId! },
      create: {
        candidateId: candidateId!,
        ...data,
        monthlyLimit,
      },
      update: {
        ...data,
        monthlyLimit, // Always sync monthlyLimit with current plan
      },
    });

    return NextResponse.json({
      success: true,
      preferences: {
        ...preferences,
        monthlyLimit, // Return dynamically calculated limit
      },
    });
  } catch (error) {
    console.error("[CANDIDATE_PREFS_PATCH]", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
