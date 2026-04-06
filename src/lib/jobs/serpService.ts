// src/lib/jobs/serpService.ts
import { Job } from "@/types/jobs";

const BASE_URL = "https://serpapi.com/search.json";

// Indian cities for location filtering
const INDIAN_LOCATIONS = [
  "india", "delhi", "mumbai", "bangalore", "bengaluru", "hyderabad", "chennai",
  "pune", "kolkata", "noida", "gurgaon", "gurugram", "ahmedabad", "jaipur",
  "lucknow", "kanpur", "nagpur", "indore", "thane", "bhopal", "visakhapatnam",
  "pimpri", "patna", "vadodara", "ghaziabad", "ludhiana", "coimbatore", "agra",
  "madurai", "nashik", "faridabad", "meerut", "rajkot", "varanasi", "srinagar",
  "aurangabad", "dhanbad", "amritsar", "navi mumbai", "allahabad", "ranchi",
  "howrah", "jabalpur", "gwalior", "vijayawada", "jodhpur", "raipur", "kota",
  "chandigarh", "thiruvananthapuram", "mysore", "uttar pradesh", "maharashtra",
  "karnataka", "tamil nadu", "west bengal", "gujarat", "rajasthan", "madhya pradesh",
  "andhra pradesh", "telangana", "kerala", "bihar", "odisha", "assam", "punjab"
];

interface FetchParams {
  query: string;
  location?: string;
  limit?: number;
}

/**
 * Check if a location string matches Indian locations
 */
function isIndianLocation(locationStr: string): boolean {
  if (!locationStr) return false;
  const lower = locationStr.toLowerCase();
  return INDIAN_LOCATIONS.some(loc => lower.includes(loc));
}

/**
 * Extract DIRECT apply link from SerpAPI job result
 * Priority: apply_options > detected_extensions.apply_link > job_id link
 * NEVER return google.com search links
 */
function extractDirectApplyLink(raw: any): string {
  // 1. Best option: apply_options array contains direct links
  if (raw.apply_options && raw.apply_options.length > 0) {
    // Find the best direct link (prefer known job sites)
    const preferredSources = ['linkedin', 'indeed', 'glassdoor', 'naukri', 'internshala', 'lever', 'greenhouse', 'workday'];
    
    for (const opt of raw.apply_options) {
      const link = opt.link || '';
      // Skip Google redirect links
      if (link.includes('google.com')) continue;
      
      // Prefer known job portal links
      if (preferredSources.some(src => link.toLowerCase().includes(src))) {
        return link;
      }
    }
    
    // Return first non-Google link
    for (const opt of raw.apply_options) {
      if (opt.link && !opt.link.includes('google.com')) {
        return opt.link;
      }
    }
  }

  // 2. Fallback: detected_extensions might have apply link
  if (raw.detected_extensions?.apply_link) {
    const link = raw.detected_extensions.apply_link;
    if (!link.includes('google.com')) {
      return link;
    }
  }

  // 3. Fallback: job_id based link (construct from source)
  if (raw.job_id) {
    // Try to extract source from via field
    const via = raw.via || '';
    if (via.toLowerCase().includes('linkedin')) {
      return `https://www.linkedin.com/jobs/view/${raw.job_id}`;
    }
    if (via.toLowerCase().includes('indeed')) {
      return `https://www.indeed.com/viewjob?jk=${raw.job_id}`;
    }
  }

  // 4. Last resort: related_links (but filter out Google)
  if (raw.related_links && raw.related_links.length > 0) {
    for (const rel of raw.related_links) {
      if (rel.link && !rel.link.includes('google.com')) {
        return rel.link;
      }
    }
  }

  // If all else fails, return empty (will be filtered out)
  return '';
}

/**
 * Normalize SerpAPI Google Jobs response to unified Job type
 * CRITICAL: Extract DIRECT apply links, not Google search links
 */
function normalizeSerpJob(raw: any): Job | null {
  const applyLink = extractDirectApplyLink(raw);
  
  // Skip jobs without valid direct apply links
  if (!applyLink) {
    console.warn(`[SerpAPI] Skipping job "${raw.title}" - no direct apply link found`);
    return null;
  }

  const id = `serp_${Buffer.from((raw.title || "") + (raw.company_name || ""))
    .toString("base64")
    .slice(0, 16)}`;

  // Extract source from via field or apply link
  let source = "serpapi";
  const via = (raw.via || "").toLowerCase();
  if (via.includes('linkedin')) source = "LinkedIn";
  else if (via.includes('indeed')) source = "Indeed";
  else if (via.includes('naukri')) source = "Naukri";
  else if (via.includes('internshala')) source = "Internshala";
  else if (via.includes('glassdoor')) source = "Glassdoor";
  else if (via.includes('foundit') || via.includes('monster')) source = "Foundit";
  else if (via.includes('shine')) source = "Shine";
  else if (raw.apply_options?.[0]?.title) {
    source = raw.apply_options[0].title.replace('Apply on ', '').replace('Apply directly on ', '');
  }

  return {
    id,
    title: raw.title || "",
    company: raw.company_name || "",
    location: raw.location || "",
    description: raw.description || "",
    applyLink, // DIRECT link, not Google
    postedAt: raw.detected_extensions?.posted_at || "",
    salary: raw.detected_extensions?.salary || undefined,
    jobType: raw.detected_extensions?.schedule_type || undefined,
    remote: raw.location?.toLowerCase().includes("remote") || 
            raw.detected_extensions?.work_from_home === true,
    tags: raw.job_highlights?.Qualifications?.slice(0, 5) || [],
    source: "serpapi" as const,
  };
}

export const serpService = {
  name: "SerpAPI",

  async fetch({ query, location, limit = 30 }: FetchParams): Promise<Job[]> {
    const apiKey = process.env.SERP_API_KEY;
    
    if (!apiKey || apiKey.trim() === "") {
      console.warn("[SerpAPI] SERP_API_KEY not configured or empty, skipping");
      throw new Error("SerpAPI not configured");
    }

    // Check if searching for India
    const isIndiaSearch = location ? isIndianLocation(location) : false;

    // Build search query - location is handled via lrad parameter for better results
    let searchQuery = query;
    
    // For remote jobs, add "remote" to query
    if (location?.toLowerCase().includes("remote")) {
      searchQuery = `${query} remote`;
    }

    // Determine country code for Google Jobs
    let countryCode = "in"; // Default to India
    if (location?.toLowerCase().includes("india") || isIndiaSearch) {
      countryCode = "in";
    } else if (location?.toLowerCase().includes("united states") || location?.toLowerCase().includes("usa")) {
      countryCode = "us";
    } else if (location?.toLowerCase().includes("uk") || location?.toLowerCase().includes("united kingdom")) {
      countryCode = "uk";
    }

    const params = new URLSearchParams({
      q: searchQuery,
      engine: "google_jobs",
      api_key: apiKey,
      hl: "en",
      gl: countryCode,
    });

    // Add location parameter if specific city/region
    if (location && !location.toLowerCase().includes("remote")) {
      const cityMatch = location.match(/^([^,]+)/);
      if (cityMatch) {
        params.set("location", cityMatch[1].trim());
      }
    }

    console.log(`[SerpAPI] Fetching: google_jobs engine, query="${searchQuery}", country=${countryCode}, isIndiaSearch=${isIndiaSearch}`);

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 20000); // 20s timeout

    try {
      const res = await fetch(`${BASE_URL}?${params}`, {
        signal: controller.signal,
        cache: "no-store",
      });
      clearTimeout(timeout);

      console.log(`[SerpAPI] Response status: ${res.status}`);

      if (!res.ok) {
        const errText = await res.text();
        console.error(`[SerpAPI] API error ${res.status}:`, errText);
        throw new Error(`SerpAPI error: ${res.status} ${res.statusText}`);
      }

      const data = await res.json();

      if (data.error) {
        console.error(`[SerpAPI] API returned error:`, data.error);
        throw new Error(`SerpAPI: ${data.error}`);
      }

      // Normalize and filter out jobs without direct apply links
      let jobs = (data.jobs_results || [])
        .map(normalizeSerpJob)
        .filter((job: Job | null): job is Job => job !== null);
      
      // CRITICAL: Filter jobs by location for India searches
      // Google Jobs API sometimes returns worldwide results even with gl=in
      if (isIndiaSearch) {
        const beforeFilter = jobs.length;
        jobs = jobs.filter((job: Job) => {
          const jobLocation = job.location?.toLowerCase() || "";
          // Allow jobs that are in India OR remote
          return isIndianLocation(jobLocation) || 
                 jobLocation.includes("remote") ||
                 jobLocation.includes("work from home") ||
                 jobLocation.includes("anywhere");
        });
        console.log(`[SerpAPI] Location filter (India): ${beforeFilter} → ${jobs.length} jobs`);
      }
      
      jobs = jobs.slice(0, limit);
      
      console.log(`[SerpAPI] Found ${jobs.length} jobs with valid direct apply links`);
      
      return jobs;
    } catch (error: any) {
      clearTimeout(timeout);
      
      if (error.name === "AbortError") {
        console.error("[SerpAPI] Request timed out");
        throw new Error("SerpAPI request timed out");
      }
      
      console.error("[SerpAPI] Fetch error:", error.message);
      throw error;
    }
  },
};

export async function fetchSerpJobs(params: FetchParams): Promise<Job[]> {
  return serpService.fetch(params);
}
