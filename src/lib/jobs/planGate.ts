// src/lib/jobs/planGate.ts
import { UserPlan, PLAN_LIMITS, JobSource } from "@/types/jobs";

/**
 * API selection strategy per plan:
 * - free: arbeitnow only (free API, 0 sessions allowed anyway)
 * - pro: serpapi → jsearch (fallback)
 * - standard: serpapi → jsearch → arbeitnow (all merged)
 */
export const API_STRATEGY: Record<UserPlan, JobSource[]> = {
  free: ["arbeitnow"],
  pro: ["serpapi", "jsearch"],
  standard: ["serpapi", "jsearch", "arbeitnow"],
};

/**
 * Get the ordered list of APIs to use for a given plan
 */
export function getApisForPlan(plan: UserPlan): JobSource[] {
  return API_STRATEGY[plan] || API_STRATEGY.free;
}

/**
 * Get the primary API for plan (for backwards compatibility)
 */
export function getApiForPlan(plan: UserPlan): JobSource {
  const apis = getApisForPlan(plan);
  return apis[0];
}

export function getJobLimit(plan: UserPlan): number {
  return PLAN_LIMITS[plan].maxJobs;
}

export function canUseAIMatching(plan: UserPlan): boolean {
  return PLAN_LIMITS[plan].aiMatching;
}

export function canSaveMore(plan: UserPlan, currentSaved: number): boolean {
  return currentSaved < PLAN_LIMITS[plan].maxSaved;
}

export function getSessionLimit(plan: UserPlan): number {
  return PLAN_LIMITS[plan].sessions;
}

/**
 * Check if plan allows any job searches
 */
export function canSearchJobs(plan: UserPlan): boolean {
  return PLAN_LIMITS[plan].sessions > 0;
}
