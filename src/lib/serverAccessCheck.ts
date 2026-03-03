/**
 * serverAccessCheck.ts
 * ---------------------
 * Central server-side access guard.
 * Call `enforceModuleAccess(userId, module)` inside any API route that
 * consumes a plan session.  Returns `null` when the user is allowed, or
 * a ready-to-return NextResponse (403) when denied.
 *
 * Usage:
 *   const denied = await enforceModuleAccess(user.id, 'hr');
 *   if (denied) return denied;
 */

import { NextResponse } from "next/server";
import { validateModuleAccess, ModuleType } from "@/lib/billing";

// Map evaluate-answer "module" strings -> billing module keys
export const EVAL_MODULE_MAP: Record<string, ModuleType> = {
  // HR Interview
  hr: "hr",
  HR_INTERVIEW: "hr",
  hr_interview: "hr",
  "hr-interview": "hr",

  // Technical
  technical: "technical",
  TECH_INTERVIEW: "technical",
  tech: "technical",

  // Company
  company: "company",
  COMPANY_WISE_HR: "company",
  COMPANY_SPECIFIC: "company",
  "company-specific": "company",

  // Daily
  daily: "daily",
  CONVERSATION_PRACTICE: "daily",
  "daily-conversation": "daily",

  // GD Coach
  gdCoach: "gdCoach",
  GD_COACH: "gdCoach",
  "gd-coach": "gdCoach",

  // GD Agent AI
  gd: "gd",
  GD_AI_AGENTS: "gd",
  GD_DISCUSSION: "gd",
  "gd-agent": "gd",

  // English
  english: "english",
  ENGLISH_LEARNING: "english",

  // Interview Guide
  interviewGuide: "interviewGuide",
  INTERVIEW_GUIDE: "interviewGuide",
};

/**
 * Validate that `userId` still has remaining sessions for `module`.
 * Returns null if access is granted, or a 403 NextResponse if denied.
 */
export async function enforceModuleAccess(
  userId: string,
  module: string,
  subFeature?: string
): Promise<NextResponse | null> {
  const billingKey = (EVAL_MODULE_MAP[module] ?? module) as ModuleType;

  const access = await validateModuleAccess(userId, billingKey, subFeature);

  if (!access.allowed) {
    console.warn(
      `[ACCESS_DENIED] userId=${userId} module=${module}(${billingKey}) ` +
        `plan=${access.plan} remaining=${access.remaining} error=${access.error}`
    );
    return NextResponse.json(
      {
        error: "session_limit_reached",
        message:
          access.error === "Account is disabled"
            ? "Your account has been disabled."
            : `You have used all your ${billingKey} sessions for this billing cycle. Please upgrade your plan.`,
        remaining: 0,
        plan: access.plan,
        upgradeUrl: "/pricing",
      },
      { status: 403 }
    );
  }

  return null; // Access granted
}
