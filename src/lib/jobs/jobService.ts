// src/lib/jobs/jobService.ts
import { getCachedJobs, setCachedJobs, getStaleCachedJobs, buildCacheKey } from "./cache";
import { fetchSerpJobs } from "./serpService";
import { fetchJSearchJobs } from "./jsearch";
import { fetchArbeitNowJobs } from "./arbeitnow";
import { deduplicateJobs } from "./deduplicator";
import { matchJobs } from "./matcher";
import { getApisForPlan, getJobLimit, canUseAIMatching } from "./planGate";
import { Job, JobMatch, UserPlan, JobSource } from "@/types/jobs";

// Additional sources imports
import { fetchRemoteOkJobs } from "./sources/remoteOkService";
import { fetchRemotiveJobs } from "./sources/remotiveService";
import { fetchMuseJobs } from "./sources/theMuseService";
import { fetchLinkedInJobs } from "./sources/linkedinSerpService";
import { fetchIndeedJobs } from "./sources/indeedSerpService";
import { fetchNaukriJobs } from "./sources/naukriSerpService";
import { fetchInternshalaJobs } from "./sources/internshalaService";
import { fetchGlassdoorJobs } from "./sources/glassdoorSerpService";
import { fetchBigTechJobs } from "./sources/bigTechService";

const RETRY_ATTEMPTS = 2;
const RETRY_DELAY_MS = 500;
const RESULTS_THRESHOLD = 50; // Increased threshold for more jobs
const MIN_RESULTS_FOR_ADDITIONAL = 20; // Fetch from additional sources if below this

interface SearchParams {
  query: string;
  location?: string;
  jobType?: string;
  experienceLevel?: string;
  workMode?: string;
  plan: UserPlan;
  userSkills: string[];
}

interface SearchResult {
  jobs: JobMatch[];
  fromCache: boolean;
  totalFetched: number;
}

/**
 * Fetch from a single API with retry logic
 */
async function fetchWithRetry(
  source: JobSource,
  params: { query: string; location?: string; limit: number }
): Promise<Job[]> {
  for (let attempt = 1; attempt <= RETRY_ATTEMPTS; attempt++) {
    try {
      console.log(`[JobService] Attempting ${source} (attempt ${attempt}/${RETRY_ATTEMPTS})`);
      
      switch (source) {
        case "serpapi":
          return await fetchSerpJobs(params);
        case "jsearch":
          return await fetchJSearchJobs(params);
        case "arbeitnow":
          return await fetchArbeitNowJobs(params);
        default:
          throw new Error(`Unknown API source: ${source}`);
      }
    } catch (error: any) {
      console.warn(`[JobService] ${source} attempt ${attempt} failed:`, error.message);
      
      if (attempt < RETRY_ATTEMPTS) {
        await new Promise(r => setTimeout(r, RETRY_DELAY_MS * attempt));
      } else {
        throw error;
      }
    }
  }
  
  throw new Error(`${source} failed after ${RETRY_ATTEMPTS} attempts`);
}

/**
 * Build search query with experience level and job type keywords
 * NOTE: Location is handled separately by each API service
 */
function buildSearchQuery(params: SearchParams): string {
  let query = params.query;
  
  // Add experience level keywords
  if (params.experienceLevel && params.experienceLevel !== "all") {
    const expKeywords: Record<string, string> = {
      internship: "intern internship",
      fresher: "entry level junior fresher",
      junior: "junior",
      mid: "mid-level",
      senior: "senior lead",
    };
    if (expKeywords[params.experienceLevel]) {
      query = `${query} ${expKeywords[params.experienceLevel]}`;
    }
  }
  
  // Add job type keywords
  if (params.jobType && params.jobType !== "all") {
    const typeKeywords: Record<string, string> = {
      fulltime: "full-time",
      parttime: "part-time",
      contract: "contract freelance",
      internship: "internship",
    };
    if (typeKeywords[params.jobType]) {
      query = `${query} ${typeKeywords[params.jobType]}`;
    }
  }
  
  // DON'T add location here - each API handles it differently
  // Some need it in query, some need it as parameter
  
  return query.trim();
}

/**
 * Fetch from additional sources in parallel (free APIs + SerpAPI-based)
 */
async function fetchAdditionalSourcesParallel(params: {
  query: string;
  location?: string;
  limit: number;
}): Promise<Job[]> {
  console.log(`[JobService] Fetching from additional sources...`);
  
  const isIndia = params.location?.toLowerCase().includes("india") || 
                  params.location?.toLowerCase().includes("delhi") ||
                  params.location?.toLowerCase().includes("mumbai") ||
                  params.location?.toLowerCase().includes("bangalore");

  const fetchPromises: Promise<Job[]>[] = [
    // Free APIs (always fetch)
    fetchRemoteOkJobs({ query: params.query, limit: 10 }).catch(() => []),
    fetchRemotiveJobs({ query: params.query, limit: 10 }).catch(() => []),
    fetchMuseJobs({ query: params.query, location: params.location, limit: 10 }).catch(() => []),
  ];

  // India-specific sources
  if (isIndia) {
    fetchPromises.push(
      fetchNaukriJobs({ query: params.query, location: params.location, limit: 10 }).catch(() => []),
      fetchInternshalaJobs({ query: params.query, location: params.location, limit: 10 }).catch(() => [])
    );
  }

  // SerpAPI-based sources (uses same API key)
  fetchPromises.push(
    fetchLinkedInJobs({ query: params.query, location: params.location, limit: 5 }).catch(() => []),
    fetchIndeedJobs({ query: params.query, location: params.location, limit: 5 }).catch(() => []),
    fetchGlassdoorJobs({ query: params.query, location: params.location, limit: 5 }).catch(() => [])
  );

  // Big tech companies
  fetchPromises.push(
    fetchBigTechJobs({ query: params.query, location: params.location, limit: 10 }).catch(() => [])
  );

  const results = await Promise.all(fetchPromises);
  const additionalJobs = results.flat();
  
  console.log(`[JobService] Additional sources returned ${additionalJobs.length} jobs`);
  return additionalJobs;
}

/**
 * Main job search orchestrator
 * Handles: cache → fetch from multiple APIs → dedupe → match → cache results
 */
export async function searchJobs(params: SearchParams): Promise<SearchResult> {
  const cacheKey = buildCacheKey({
    query: params.query,
    location: params.location,
    jobType: params.jobType,
    experienceLevel: params.experienceLevel,
  });
  
  console.log(`[JobService] Search started - Plan: ${params.plan}, CacheKey: ${cacheKey}`);

  // 1. Check cache first
  const cached = await getCachedJobs(cacheKey, params.plan);
  if (cached && cached.length > 0) {
    console.log(`[JobService] Cache HIT - ${cached.length} jobs`);
    
    // Still run matching to personalize scores
    const matched = await matchJobs(cached, params.userSkills, canUseAIMatching(params.plan));
    
    return { jobs: matched, fromCache: true, totalFetched: cached.length };
  }

  // 2. Fetch from primary APIs based on plan strategy
  const apis = getApisForPlan(params.plan);
  const limit = getJobLimit(params.plan);
  const searchQuery = buildSearchQuery(params);
  
  console.log(`[JobService] Fetching from APIs: ${apis.join(" → ")} | Query: "${searchQuery}"`);
  
  let allJobs: Job[] = [];
  const errors: { source: JobSource; error: string }[] = [];

  // Fetch from primary APIs
  for (const source of apis) {
    try {
      const jobs = await fetchWithRetry(source, { 
        query: searchQuery, 
        location: params.location, 
        limit 
      });
      
      allJobs = [...allJobs, ...jobs];
      console.log(`[JobService] ${source} returned ${jobs.length} jobs (total: ${allJobs.length})`);
      
    } catch (error: any) {
      errors.push({ source, error: error.message });
      console.warn(`[JobService] ${source} failed:`, error.message);
    }
  }

  // 3. ALWAYS fetch from additional sources in parallel for more results
  try {
    const additionalJobs = await fetchAdditionalSourcesParallel({
      query: searchQuery,
      location: params.location,
      limit: limit,
    });
    allJobs = [...allJobs, ...additionalJobs];
    console.log(`[JobService] Total after additional sources: ${allJobs.length} jobs`);
  } catch (error: any) {
    console.warn(`[JobService] Additional sources failed:`, error.message);
  }

  // 4. If ALL APIs failed, try stale cache as last resort
  if (allJobs.length === 0) {
    console.warn("[JobService] All APIs failed, checking stale cache");
    
    const stale = await getStaleCachedJobs(cacheKey, params.plan);
    if (stale && stale.length > 0) {
      console.log(`[JobService] Returning stale cache (${stale.length} jobs)`);
      const matched = await matchJobs(stale, params.userSkills, canUseAIMatching(params.plan), params.query);
      return { jobs: matched, fromCache: true, totalFetched: stale.length };
    }
    
    // No cache, no results - throw aggregated error
    const errorMsg = errors.map(e => `${e.source}: ${e.error}`).join("; ");
    throw new Error(`All job APIs failed: ${errorMsg}`);
  }

  // 5. Deduplicate merged results
  const dedupedJobs = deduplicateJobs(allJobs);
  console.log(`[JobService] Deduplicated: ${allJobs.length} → ${dedupedJobs.length} jobs`);

  // 6. Filter by work mode if remote requested
  let filteredJobs = dedupedJobs;
  if (params.workMode === "remote") {
    filteredJobs = dedupedJobs.filter(j => j.remote === true);
    console.log(`[JobService] Remote filter: ${dedupedJobs.length} → ${filteredJobs.length} jobs`);
  }

  // 7. Match with user skills (pass search query for better matching)
  const matched = await matchJobs(filteredJobs, params.userSkills, canUseAIMatching(params.plan), params.query);

  // 8. Cache results for future requests
  if (matched.length > 0) {
    await setCachedJobs(cacheKey, params.plan, matched);
  }

  return { 
    jobs: matched, 
    fromCache: false,
    totalFetched: allJobs.length 
  };
}

export const jobService = {
  search: searchJobs,
};
