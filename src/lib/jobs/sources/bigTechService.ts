// src/lib/jobs/sources/bigTechService.ts
// Big Tech Companies (Google, Microsoft, Amazon, Apple, Meta) Jobs via Google Jobs API

import { Job } from "@/types/jobs";

const SERP_API_KEY = process.env.SERP_API_KEY || "";
const SERP_API_URL = "https://serpapi.com/search.json";

type BigTechCompany = "google" | "microsoft" | "amazon" | "apple" | "meta";

const BIG_TECH_NAMES = ["Google", "Microsoft", "Amazon", "Apple", "Meta", "Facebook"];

interface GoogleJobResult {
  title: string;
  company_name: string;
  location: string;
  description?: string;
  detected_extensions?: {
    posted_at?: string;
    salary?: string;
    schedule_type?: string;
  };
  apply_options?: Array<{
    title: string;
    link: string;
  }>;
  job_id?: string;
}

export async function fetchBigTechJobs(params: {
  query: string;
  location?: string;
  limit?: number;
}): Promise<Job[]> {
  if (!SERP_API_KEY) {
    console.log("[BigTech] API key not configured, skipping");
    return [];
  }

  try {
    // Search for jobs at big tech companies
    const searchQuery = `${params.query} (Google OR Microsoft OR Amazon OR Apple OR Meta)`;
    console.log(`[BigTech] Fetching big tech jobs for: ${params.query}`);
    
    const url = new URL(SERP_API_URL);
    url.searchParams.set("api_key", SERP_API_KEY);
    url.searchParams.set("engine", "google_jobs");
    url.searchParams.set("q", searchQuery);
    
    if (params.location) {
      url.searchParams.set("location", params.location);
    }

    const response = await fetch(url.toString(), {
      next: { revalidate: 3600 },
    });

    if (!response.ok) {
      throw new Error(`SerpAPI error: ${response.status}`);
    }

    const data = await response.json();
    const jobs: GoogleJobResult[] = data.jobs_results || [];
    
    // Filter for actual big tech companies
    const bigTechJobs = jobs.filter(job => {
      const companyName = job.company_name?.toLowerCase() || "";
      return BIG_TECH_NAMES.some(tech => companyName.includes(tech.toLowerCase()));
    });
    
    console.log(`[BigTech] Found ${bigTechJobs.length} big tech jobs (from ${jobs.length} total)`);

    return bigTechJobs.slice(0, params.limit || 10).map((job, index) => {
      // Determine which big tech company
      const companyLower = job.company_name?.toLowerCase() || "";
      let source: BigTechCompany = "google";
      if (companyLower.includes("microsoft")) source = "microsoft";
      else if (companyLower.includes("amazon")) source = "amazon";
      else if (companyLower.includes("apple")) source = "apple";
      else if (companyLower.includes("meta") || companyLower.includes("facebook")) source = "meta";

      return {
        id: `${source}_${job.job_id || index}_${Date.now()}`,
        title: job.title,
        company: job.company_name,
        location: job.location || "Unknown",
        description: job.description || "",
        applyLink: job.apply_options?.[0]?.link || getCompanyApplyLink(source, job.title),
        postedAt: job.detected_extensions?.posted_at,
        salary: job.detected_extensions?.salary,
        jobType: job.detected_extensions?.schedule_type,
        remote: job.location?.toLowerCase().includes("remote"),
        source: source,
        skills: [],
      };
    });
  } catch (error: any) {
    console.error("[BigTech] Error:", error.message);
    return [];
  }
}

function getCompanyApplyLink(company: BigTechCompany, title: string): string {
  const encodedTitle = encodeURIComponent(title);
  
  switch (company) {
    case "google":
      return `https://careers.google.com/jobs/results/?q=${encodedTitle}`;
    case "microsoft":
      return `https://careers.microsoft.com/us/en/search-results?keywords=${encodedTitle}`;
    case "amazon":
      return `https://www.amazon.jobs/en/search?base_query=${encodedTitle}`;
    case "apple":
      return `https://jobs.apple.com/en-us/search?search=${encodedTitle}`;
    case "meta":
      return `https://www.metacareers.com/jobs?q=${encodedTitle}`;
    default:
      return "";
  }
}

// Individual company fetch functions for granular control
export async function fetchGoogleJobs(params: { query: string; location?: string; limit?: number }) {
  return fetchBigTechJobs(params);
}

export async function fetchMicrosoftJobs(params: { query: string; location?: string; limit?: number }) {
  return fetchBigTechJobs(params);
}

export async function fetchAmazonJobs(params: { query: string; location?: string; limit?: number }) {
  return fetchBigTechJobs(params);
}

export async function fetchAppleJobs(params: { query: string; location?: string; limit?: number }) {
  return fetchBigTechJobs(params);
}

export async function fetchMetaJobs(params: { query: string; location?: string; limit?: number }) {
  return fetchBigTechJobs(params);
}
