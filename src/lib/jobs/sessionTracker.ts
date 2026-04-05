// src/lib/jobs/sessionTracker.ts
import prisma from "@/lib/prisma";
import { getSessionLimit } from "./planGate";
import { UserPlan } from "@/types/jobs";

function currentMonth() {
  return new Date().toISOString().slice(0, 7); // "2026-04"
}

/**
 * Check if user can perform a search (does NOT consume session)
 * Call this BEFORE making any API calls
 */
export async function canConsumeSession(
  userId: string,
  plan: UserPlan
): Promise<{ allowed: boolean; remaining: number; used: number; limit: number }> {
  const month = currentMonth();
  const limit = getSessionLimit(plan);

  // Free plan: no searches allowed
  if (plan === "free" || limit === 0) {
    return { allowed: false, remaining: 0, used: 0, limit: 0 };
  }

  const usage = await prisma.jobSearchSessionUsage.findUnique({
    where: { userId_month: { userId, month } },
  });

  const used = usage?.sessionsUsed ?? 0;
  const remaining = Math.max(0, limit - used);
  
  return { 
    allowed: used < limit, 
    remaining, 
    used, 
    limit 
  };
}

/**
 * Consume a session (increment usage count)
 * Call this ONLY after successful search
 */
export async function consumeSession(
  userId: string,
  plan: UserPlan
): Promise<{ remaining: number }> {
  const month = currentMonth();
  const limit = getSessionLimit(plan);

  const updated = await prisma.jobSearchSessionUsage.upsert({
    where: { userId_month: { userId, month } },
    create: { userId, month, sessionsUsed: 1 },
    update: { sessionsUsed: { increment: 1 } },
  });

  return { remaining: Math.max(0, limit - updated.sessionsUsed) };
}

/**
 * DEPRECATED: Use canConsumeSession + consumeSession separately
 * This function has a race condition - checking and consuming should be separate
 */
export async function checkAndConsumeSession(
  userId: string,
  plan: UserPlan
): Promise<{ allowed: boolean; remaining: number }> {
  // First check if allowed
  const check = await canConsumeSession(userId, plan);
  
  if (!check.allowed) {
    return { allowed: false, remaining: 0 };
  }

  // Then consume
  const result = await consumeSession(userId, plan);
  return { allowed: true, remaining: result.remaining };
}

/**
 * Get remaining sessions without consuming
 */
export async function getSessionRemaining(
  userId: string, 
  plan: UserPlan
): Promise<{ remaining: number; used: number; limit: number }> {
  const check = await canConsumeSession(userId, plan);
  return { remaining: check.remaining, used: check.used, limit: check.limit };
}
