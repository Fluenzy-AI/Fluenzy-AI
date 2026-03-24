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
    const session = await getCandidateSession();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Get candidate profile to determine plan
    const candidate = await prisma.candidateUser.findUnique({
      where: { id: session.id },
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
      select: { plan: true },
    });
    const plan = linkedUser?.plan || "Free";
    const monthlyLimit = getAutoApplyLimitByPlan(plan);

    // Get or create preferences
    let preferences = await prisma.candidateJobPreferences.findUnique({
      where: { candidateId: session.id },
    });

    if (!preferences) {
      // Create default preferences
      preferences = await prisma.candidateJobPreferences.create({
        data: {
          candidateId: session.id,
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
        monthlyLimit: preferences.monthlyLimit,
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
    const session = await getCandidateSession();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const parsed = PreferencesSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: "Invalid data" }, { status: 400 });
    }

    const data = parsed.data;

    // Get candidate to determine plan
    const candidate = await prisma.candidateUser.findUnique({
      where: { id: session.id },
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
      where: { candidateId: session.id },
      create: {
        candidateId: session.id,
        ...data,
        monthlyLimit,
      },
      update: data,
    });

    return NextResponse.json({
      success: true,
      preferences,
    });
  } catch (error) {
    console.error("[CANDIDATE_PREFS_PATCH]", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
