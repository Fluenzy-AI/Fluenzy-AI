// src/lib/jobs/cache.ts
import prisma from "@/lib/prisma";
import { Job, UserPlan } from "@/types/jobs";
import { Prisma } from "@prisma/client";

const TTL_MS = {
  free: parseInt(process.env.JOB_CACHE_TTL_FREE ?? "3600000"),     // 1 hour
  pro: parseInt(process.env.JOB_CACHE_TTL_PAID ?? "1800000"),      // 30 min
  standard: parseInt(process.env.JOB_CACHE_TTL_PAID ?? "1800000"), // 30 min
};

/**
 * Normalize cache key to prevent collisions from case/whitespace variations
 */
function normalizeCacheKey(query: string, plan: UserPlan): string {
  const normalized = query
    .toLowerCase()
    .trim()
    .replace(/\s+/g, "_");
  return `${plan}::${normalized}`;
}

/**
 * Get cached jobs if not expired
 */
export async function getCachedJobs(
  query: string, 
  plan: UserPlan
): Promise<Job[] | null> {
  const key = normalizeCacheKey(query, plan);
  
  try {
    const cached = await prisma.jobSearchCache.findUnique({ 
      where: { query: key } 
    });
    
    if (!cached) {
      console.log(`[Cache] MISS for: ${key}`);
      return null;
    }
    
    if (new Date() > cached.expiresAt) {
      console.log(`[Cache] EXPIRED for: ${key}`);
      return null;
    }
    
    // Increment hit count (fire and forget)
    prisma.jobSearchCache.update({
      where: { query: key },
      data: { hitCount: { increment: 1 } },
    }).catch(() => {}); // Ignore errors
    
    const jobs = cached.jobs as unknown as Job[];
    console.log(`[Cache] HIT for: ${key} (${jobs.length} jobs, hits: ${cached.hitCount})`);
    return jobs;
  } catch (error) {
    console.error("[Cache] Get error:", error);
    return null;
  }
}

/**
 * Get stale cache (even if expired) as last resort fallback
 */
export async function getStaleCachedJobs(
  query: string,
  plan: UserPlan
): Promise<Job[] | null> {
  const key = normalizeCacheKey(query, plan);
  
  try {
    const cached = await prisma.jobSearchCache.findUnique({ 
      where: { query: key } 
    });
    
    if (cached) {
      console.log(`[Cache] Returning STALE cache for: ${key}`);
      return cached.jobs as unknown as Job[];
    }
    
    return null;
  } catch (error) {
    console.error("[Cache] Get stale error:", error);
    return null;
  }
}

/**
 * Store jobs in cache with TTL based on plan
 */
export async function setCachedJobs(
  query: string, 
  plan: UserPlan, 
  jobs: Job[]
): Promise<void> {
  const key = normalizeCacheKey(query, plan);
  const expiresAt = new Date(Date.now() + TTL_MS[plan]);
  
  try {
    // Cast jobs to Prisma.InputJsonValue
    const jobsJson = jobs as unknown as Prisma.InputJsonValue;
    
    await prisma.jobSearchCache.upsert({
      where: { query: key },
      create: { query: key, plan, jobs: jobsJson, expiresAt },
      update: { jobs: jobsJson, expiresAt, hitCount: 0 },
    });
    console.log(`[Cache] SET for: ${key} (${jobs.length} jobs, TTL: ${TTL_MS[plan]}ms)`);
  } catch (error) {
    console.error("[Cache] Set error:", error);
    // Don't throw - caching failure shouldn't break search
  }
}

/**
 * Build a consistent cache key from search parameters
 */
export function buildCacheKey(params: {
  query: string;
  location?: string;
  jobType?: string;
  experienceLevel?: string;
}): string {
  const parts = [
    params.query.trim().toLowerCase(),
    params.location?.trim().toLowerCase() || "any",
    params.jobType?.trim().toLowerCase() || "any",
    params.experienceLevel?.trim().toLowerCase() || "any",
  ];
  return parts.join("_");
}
