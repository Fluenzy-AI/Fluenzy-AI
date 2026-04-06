// src/lib/jobs/sources/directSearchService.ts
// Direct job search using Google Search API (not Google Jobs)
// This fetches actual job listings from LinkedIn, Indeed, Naukri etc.

import { Job, JobSource } from "@/types/jobs";

const SERP_API_KEY = process.env.SERP_API_KEY || "";
const SERP_API_URL = "https://serpapi.com/search.json";

// Job site configurations
const JOB_SITES = {
  linkedin: {
    domain: "linkedin.com/jobs",
    name: "LinkedIn",
    source: "linkedin" as JobSource,
  },
  indeed: {
    domain: "indeed.com",
    name: "Indeed",
    source: "indeed" as JobSource,
  },
  indeedIndia: {
    domain: "indeed.co.in",
    name: "Indeed India",
    source: "indeed" as JobSource,
  },
  glassdoor: {
    domain: "glassdoor.com/job",
    name: "Glassdoor",
    source: "glassdoor" as JobSource,
  },
  naukri: {
    domain: "naukri.com",
    name: "Naukri",
    source: "naukri" as JobSource,
  },
  internshala: {
    domain: "internshala.com/internship",
    name: "Internshala",
    source: "internshala" as JobSource,
  },
  foundit: {
    domain: "foundit.in",
    name: "Foundit",
    source: "foundit" as JobSource,
  },
  shine: {
    domain: "shine.com/jobs",
    name: "Shine",
    source: "naukri" as JobSource, // Group under naukri
  },
  google: {
    domain: "careers.google.com",
    name: "Google Careers",
    source: "google" as JobSource,
  },
  microsoft: {
    domain: "careers.microsoft.com",
    name: "Microsoft Careers",
    source: "microsoft" as JobSource,
  },
  amazon: {
    domain: "amazon.jobs",
    name: "Amazon Jobs",
    source: "amazon" as JobSource,
  },
};

interface GoogleSearchResult {
  title: string;
  link: string;
  snippet: string;
  displayed_link?: string;
  date?: string;
}

/**
 * Search for jobs on a specific site using Google Search
 */
async function searchJobsOnSite(
  query: string,
  site: keyof typeof JOB_SITES,
  location: string,
  limit: number = 10
): Promise<Job[]> {
  if (!SERP_API_KEY) {
    console.log(`[DirectSearch] API key not configured, skipping ${site}`);
    return [];
  }

  const siteConfig = JOB_SITES[site];
  
  try {
    // Build search query with site filter
    const searchQuery = `site:${siteConfig.domain} ${query} ${location} jobs`;
    console.log(`[DirectSearch] Searching ${siteConfig.name}: "${searchQuery}"`);

    const url = new URL(SERP_API_URL);
    url.searchParams.set("api_key", SERP_API_KEY);
    url.searchParams.set("engine", "google");
    url.searchParams.set("q", searchQuery);
    url.searchParams.set("num", String(limit));
    url.searchParams.set("gl", "in"); // India
    url.searchParams.set("hl", "en");

    const response = await fetch(url.toString(), {
      next: { revalidate: 3600 },
    });

    if (!response.ok) {
      console.log(`[DirectSearch] ${siteConfig.name} API error: ${response.status}`);
      return [];
    }

    const data = await response.json();
    const results: GoogleSearchResult[] = data.organic_results || [];

    console.log(`[DirectSearch] ${siteConfig.name}: Found ${results.length} results`);

    // Convert search results to jobs
    return results
      .filter(result => {
        // Filter valid job links
        const link = result.link?.toLowerCase() || "";
        return link.includes(siteConfig.domain.split("/")[0]) && 
               !link.includes("/login") &&
               !link.includes("/signup") &&
               !link.includes("/register");
      })
      .map((result, index) => parseSearchResultToJob(result, siteConfig, index))
      .filter(job => job !== null) as Job[];
  } catch (error: any) {
    console.error(`[DirectSearch] ${siteConfig.name} error:`, error.message);
    return [];
  }
}

/**
 * Parse a Google search result into a Job object
 */
function parseSearchResultToJob(
  result: GoogleSearchResult,
  siteConfig: { name: string; source: JobSource },
  index: number
): Job | null {
  const title = result.title || "";
  const link = result.link || "";
  const snippet = result.snippet || "";

  // Skip if no valid link
  if (!link || link.includes("google.com")) return null;

  // Try to extract company from title or snippet
  let company = siteConfig.name;
  let jobTitle = title;
  
  // Common patterns: "Job Title - Company Name" or "Job Title at Company"
  if (title.includes(" - ")) {
    const parts = title.split(" - ");
    jobTitle = parts[0].trim();
    company = parts[parts.length - 1].replace(/\|.*$/, "").trim();
  } else if (title.includes(" at ")) {
    const parts = title.split(" at ");
    jobTitle = parts[0].trim();
    company = parts[1]?.replace(/\|.*$/, "").trim() || company;
  } else if (title.includes(" | ")) {
    const parts = title.split(" | ");
    jobTitle = parts[0].trim();
    company = parts[1]?.trim() || company;
  }

  // Clean up job title
  jobTitle = jobTitle
    .replace(/\s*-\s*LinkedIn.*$/i, "")
    .replace(/\s*\|\s*Indeed.*$/i, "")
    .replace(/\s*\|\s*Glassdoor.*$/i, "")
    .replace(/\s*-\s*Naukri.*$/i, "")
    .replace(/\s*\|\s*Internshala.*$/i, "")
    .trim();

  // Extract location from snippet if possible
  let location = "India";
  const locationPatterns = [
    /(?:in|at|@)\s+([A-Z][a-z]+(?:\s+[A-Z][a-z]+)*,?\s*(?:India)?)/i,
    /(Delhi|Mumbai|Bangalore|Bengaluru|Hyderabad|Chennai|Pune|Kolkata|Noida|Gurgaon|Gurugram)/i,
  ];
  
  for (const pattern of locationPatterns) {
    const match = snippet.match(pattern) || title.match(pattern);
    if (match) {
      location = match[1] || match[0];
      break;
    }
  }

  // Check if remote
  const isRemote = 
    title.toLowerCase().includes("remote") ||
    snippet.toLowerCase().includes("remote") ||
    snippet.toLowerCase().includes("work from home");

  return {
    id: `direct_${siteConfig.source}_${index}_${Date.now()}`,
    title: jobTitle || title,
    company: company,
    location: location,
    description: snippet,
    applyLink: link,
    postedAt: result.date || undefined,
    jobType: title.toLowerCase().includes("intern") ? "Internship" : undefined,
    remote: isRemote,
    source: siteConfig.source,
    skills: [],
  };
}

/**
 * Fetch jobs from all major job sites in parallel
 */
export async function fetchDirectJobsFromAllSites(params: {
  query: string;
  location: string;
  limit?: number;
}): Promise<{
  linkedin: Job[];
  indeed: Job[];
  glassdoor: Job[];
  naukri: Job[];
  internshala: Job[];
  bigTech: Job[];
}> {
  const { query, location, limit = 5 } = params;
  const isIndiaSearch = location.toLowerCase().includes("india") ||
    ["delhi", "mumbai", "bangalore", "hyderabad", "chennai", "pune", "noida", "gurgaon"]
      .some(city => location.toLowerCase().includes(city));

  console.log(`[DirectSearch] Starting parallel search for "${query}" in ${location}`);

  // Define which sites to search
  const sitesToSearch: (keyof typeof JOB_SITES)[] = isIndiaSearch
    ? ["linkedin", "indeedIndia", "naukri", "internshala", "glassdoor"]
    : ["linkedin", "indeed", "glassdoor"];

  // Add big tech if not India-specific
  const bigTechSites: (keyof typeof JOB_SITES)[] = ["google", "microsoft", "amazon"];

  // Fetch all in parallel
  const [linkedinJobs, indeedJobs, glassdoorJobs, naukriJobs, internshalaJobs, ...bigTechResults] = 
    await Promise.all([
      searchJobsOnSite(query, "linkedin", location, limit),
      isIndiaSearch 
        ? searchJobsOnSite(query, "indeedIndia", location, limit)
        : searchJobsOnSite(query, "indeed", location, limit),
      searchJobsOnSite(query, "glassdoor", location, limit),
      isIndiaSearch ? searchJobsOnSite(query, "naukri", location, limit) : Promise.resolve([]),
      isIndiaSearch ? searchJobsOnSite(query, "internshala", location, limit) : Promise.resolve([]),
      ...bigTechSites.map(site => searchJobsOnSite(query, site, location, 3)),
    ]);

  const bigTechJobs = bigTechResults.flat();

  console.log(`[DirectSearch] Results: LinkedIn(${linkedinJobs.length}), Indeed(${indeedJobs.length}), Glassdoor(${glassdoorJobs.length}), Naukri(${naukriJobs.length}), Internshala(${internshalaJobs.length}), BigTech(${bigTechJobs.length})`);

  return {
    linkedin: linkedinJobs,
    indeed: indeedJobs,
    glassdoor: glassdoorJobs,
    naukri: naukriJobs,
    internshala: internshalaJobs,
    bigTech: bigTechJobs,
  };
}

/**
 * Fetch all direct jobs combined
 */
export async function fetchAllDirectJobs(params: {
  query: string;
  location: string;
  limit?: number;
}): Promise<Job[]> {
  const results = await fetchDirectJobsFromAllSites(params);
  
  const allJobs = [
    ...results.linkedin,
    ...results.indeed,
    ...results.glassdoor,
    ...results.naukri,
    ...results.internshala,
    ...results.bigTech,
  ];

  console.log(`[DirectSearch] Total direct jobs: ${allJobs.length}`);
  return allJobs;
}
