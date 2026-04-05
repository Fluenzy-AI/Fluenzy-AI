// src/lib/jobs/sources/bigTechService.ts
// Big Tech Companies (Google, Microsoft, Amazon, Apple, Meta) Jobs via SerpAPI

import { Job } from "@/types/jobs";

const SERP_API_KEY = process.env.SERP_API_KEY || "";
const SERP_API_URL = "https://serpapi.com/search.json";

type BigTechCompany = "google" | "microsoft" | "amazon" | "apple" | "meta";

const COMPANY_SITES: Record<BigTechCompany, string> = {
  google: "site:careers.google.com",
  microsoft: "site:careers.microsoft.com",
  amazon: "site:amazon.jobs",
  apple: "site:jobs.apple.com",
  meta: "site:metacareers.com",
};

export async function fetchBigTechJobs(params: {
  query: string;
  location?: string;
  limit?: number;
  companies?: BigTechCompany[];
}): Promise<Job[]> {
  if (!SERP_API_KEY) {
    console.log("[BigTech-Serp] API key not configured, skipping");
    return [];
  }

  const companies = params.companies || ["google", "microsoft", "amazon", "apple", "meta"];
  const allJobs: Job[] = [];

  for (const company of companies) {
    try {
      console.log(`[BigTech-Serp] Fetching ${company} jobs for: ${params.query}`);

      const siteFilter = COMPANY_SITES[company];
      const searchQuery = `${siteFilter} ${params.query}`;
      
      const url = new URL(SERP_API_URL);
      url.searchParams.set("api_key", SERP_API_KEY);
      url.searchParams.set("engine", "google_jobs");
      url.searchParams.set("q", searchQuery);
      url.searchParams.set("num", String(Math.ceil((params.limit || 10) / companies.length)));
      
      if (params.location) {
        url.searchParams.set("location", params.location);
      }

      const response = await fetch(url.toString(), {
        next: { revalidate: 3600 },
      });

      if (!response.ok) {
        console.warn(`[BigTech-Serp] ${company} API error: ${response.status}`);
        continue;
      }

      const data = await response.json();
      const jobs = data.jobs_results || [];
      
      console.log(`[BigTech-Serp] ${company}: Found ${jobs.length} jobs`);

      const normalizedJobs = jobs.map((job: any, index: number) => ({
        id: `${company}_${job.job_id || index}_${Date.now()}`,
        title: job.title,
        company: job.company_name || company.charAt(0).toUpperCase() + company.slice(1),
        location: job.location || "Unknown",
        description: job.description || "",
        applyLink: job.apply_options?.[0]?.link || getCompanyApplyLink(company, job.title),
        postedAt: job.detected_extensions?.posted_at,
        salary: job.detected_extensions?.salary,
        jobType: job.detected_extensions?.schedule_type,
        remote: job.location?.toLowerCase().includes("remote"),
        source: company,
        skills: [],
      }));

      allJobs.push(...normalizedJobs);
    } catch (error: any) {
      console.error(`[BigTech-Serp] ${company} Error:`, error.message);
    }
  }

  return allJobs.slice(0, params.limit || 10);
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
  return fetchBigTechJobs({ ...params, companies: ["google"] });
}

export async function fetchMicrosoftJobs(params: { query: string; location?: string; limit?: number }) {
  return fetchBigTechJobs({ ...params, companies: ["microsoft"] });
}

export async function fetchAmazonJobs(params: { query: string; location?: string; limit?: number }) {
  return fetchBigTechJobs({ ...params, companies: ["amazon"] });
}

export async function fetchAppleJobs(params: { query: string; location?: string; limit?: number }) {
  return fetchBigTechJobs({ ...params, companies: ["apple"] });
}

export async function fetchMetaJobs(params: { query: string; location?: string; limit?: number }) {
  return fetchBigTechJobs({ ...params, companies: ["meta"] });
}
