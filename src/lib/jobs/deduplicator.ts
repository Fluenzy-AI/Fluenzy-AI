// src/lib/jobs/deduplicator.ts
import { Job } from "@/types/jobs";

// Priority order: serpapi (best quality) > jsearch > arbeitnow
const SOURCE_PRIORITY: Record<string, number> = {
  serpapi: 1,
  jsearch: 2,
  arbeitnow: 3,
};

// URLs to filter out - these are NOT direct apply links
const INVALID_URL_PATTERNS = [
  'google.com/search',
  'google.com/url',
  'google.co.in/search',
  'google.co.uk/search',
  '/search?q=',
  'webcache.googleusercontent.com',
];

/**
 * Check if a URL is a valid direct apply link (not a Google search/redirect)
 */
function isValidApplyLink(url: string): boolean {
  if (!url || url.trim() === '') return false;
  
  const lowerUrl = url.toLowerCase();
  
  // Check against invalid patterns
  for (const pattern of INVALID_URL_PATTERNS) {
    if (lowerUrl.includes(pattern)) {
      return false;
    }
  }
  
  // Must be a valid URL
  try {
    new URL(url);
    return true;
  } catch {
    return false;
  }
}

/**
 * Normalize text for deduplication key generation
 */
function normalizeText(text: string): string {
  return text
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s]/g, "") // Remove special characters
    .replace(/\s+/g, " ");       // Normalize whitespace
}

/**
 * Generate a deduplication key from job title and company
 */
function makeDedupeKey(job: Job): string {
  const title = normalizeText(job.title);
  const company = normalizeText(job.company);
  return `${title}__${company}`;
}

/**
 * Filter out jobs with invalid apply links (Google search URLs, etc.)
 */
export function filterValidJobs(jobs: Job[]): Job[] {
  const valid = jobs.filter(job => {
    if (!isValidApplyLink(job.applyLink)) {
      console.warn(`[Deduplicator] Filtering out job "${job.title}" - invalid apply link: ${job.applyLink}`);
      return false;
    }
    return true;
  });
  
  if (valid.length < jobs.length) {
    console.log(`[Deduplicator] Filtered out ${jobs.length - valid.length} jobs with invalid apply links`);
  }
  
  return valid;
}

/**
 * Deduplicate jobs from multiple sources, preferring higher-priority sources
 * 
 * Priority: serpapi > jsearch > arbeitnow
 * When duplicates found, keep the one from higher priority source
 * Also filters out jobs with invalid apply links
 */
export function deduplicateJobs(jobs: Job[]): Job[] {
  if (jobs.length === 0) return [];

  // First, filter out invalid apply links
  const validJobs = filterValidJobs(jobs);
  
  const seen = new Map<string, Job>();

  // Sort by source priority (highest priority first)
  const sorted = [...validJobs].sort(
    (a, b) => (SOURCE_PRIORITY[a.source] || 9) - (SOURCE_PRIORITY[b.source] || 9)
  );

  for (const job of sorted) {
    const key = makeDedupeKey(job);
    
    if (!seen.has(key)) {
      seen.set(key, job);
    }
    // If already seen, the higher-priority version is already in the map
  }

  const deduped = Array.from(seen.values());
  
  console.log(`[Deduplicator] ${jobs.length} jobs → ${deduped.length} unique (removed ${jobs.length - deduped.length} duplicates/invalid)`);
  
  return deduped;
}

/**
 * Merge jobs from multiple API calls and deduplicate
 */
export function mergeAndDedupe(...jobArrays: Job[][]): Job[] {
  const allJobs = jobArrays.flat();
  return deduplicateJobs(allJobs);
}

export const deduplicator = {
  dedupe: deduplicateJobs,
  merge: mergeAndDedupe,
  filterValid: filterValidJobs,
  isValidApplyLink,
};
