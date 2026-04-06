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

// Indian locations for filtering
const INDIAN_LOCATIONS = [
  "india", "delhi", "mumbai", "bangalore", "bengaluru", "hyderabad", "chennai",
  "pune", "kolkata", "noida", "gurgaon", "gurugram", "ahmedabad", "jaipur",
  "lucknow", "kanpur", "nagpur", "indore", "thane", "bhopal", "visakhapatnam",
  "patna", "vadodara", "ghaziabad", "ludhiana", "coimbatore", "agra",
  "madurai", "nashik", "faridabad", "meerut", "rajkot", "varanasi",
  "uttar pradesh", "maharashtra", "karnataka", "tamil nadu", "west bengal",
  "gujarat", "rajasthan", "madhya pradesh", "andhra pradesh", "telangana",
  "kerala", "bihar", "odisha", "assam", "punjab", "haryana"
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
 * Check if location matches India
 */
function isIndianLocation(locationStr: string): boolean {
  if (!locationStr) return false;
  const lower = locationStr.toLowerCase();
  return INDIAN_LOCATIONS.some(loc => lower.includes(loc));
}

/**
 * Filter jobs by location for India search
 */
export function filterJobsByLocation(jobs: Job[], searchLocation?: string): Job[] {
  if (!searchLocation) return jobs;
  
  const isIndiaSearch = isIndianLocation(searchLocation);
  
  if (!isIndiaSearch) return jobs; // Only filter for India searches
  
  const beforeCount = jobs.length;
  const filtered = jobs.filter(job => {
    const jobLocation = job.location?.toLowerCase() || "";
    
    // Allow if:
    // 1. Job is in India
    // 2. Job is remote/worldwide/anywhere
    // 3. Job explicitly allows work from home
    return isIndianLocation(jobLocation) ||
           jobLocation.includes("remote") ||
           jobLocation.includes("work from home") ||
           jobLocation.includes("worldwide") ||
           jobLocation.includes("anywhere") ||
           jobLocation.includes("global") ||
           jobLocation === "";  // Unknown location - might be India
  });
  
  if (filtered.length < beforeCount) {
    console.log(`[Deduplicator] Location filter (India): ${beforeCount} → ${filtered.length} jobs`);
  }
  
  return filtered;
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
export function deduplicateJobs(jobs: Job[], searchLocation?: string): Job[] {
  if (jobs.length === 0) return [];

  // First, filter out invalid apply links
  let validJobs = filterValidJobs(jobs);
  
  // Then filter by location if searching India
  if (searchLocation) {
    validJobs = filterJobsByLocation(validJobs, searchLocation);
  }
  
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
export function mergeAndDedupe(jobArrays: Job[][], searchLocation?: string): Job[] {
  const allJobs = jobArrays.flat();
  return deduplicateJobs(allJobs, searchLocation);
}

export const deduplicator = {
  dedupe: deduplicateJobs,
  merge: mergeAndDedupe,
  filterValid: filterValidJobs,
  filterByLocation: filterJobsByLocation,
  isValidApplyLink,
};
