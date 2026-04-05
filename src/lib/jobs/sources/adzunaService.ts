// src/lib/jobs/sources/adzunaService.ts
// Adzuna - Free API aggregator (covers Indeed, Glassdoor, LinkedIn listings)

import { Job } from "@/types/jobs";

const ADZUNA_APP_ID = process.env.ADZUNA_APP_ID || "";
const ADZUNA_APP_KEY = process.env.ADZUNA_APP_KEY || "";
const ADZUNA_BASE_URL = "https://api.adzuna.com/v1/api/jobs";

interface AdzunaJob {
  id: string;
  title: string;
  description: string;
  redirect_url: string;
  company: {
    display_name: string;
  };
  location: {
    display_name: string;
    area?: string[];
  };
  created: string;
  salary_min?: number;
  salary_max?: number;
  contract_time?: string;
  contract_type?: string;
  category?: {
    label: string;
    tag: string;
  };
}

interface AdzunaResponse {
  results: AdzunaJob[];
  count: number;
}

export async function fetchAdzunaJobs(params: {
  query: string;
  location?: string;
  limit?: number;
  country?: string;
}): Promise<Job[]> {
  if (!ADZUNA_APP_ID || !ADZUNA_APP_KEY) {
    console.log("[Adzuna] API keys not configured, skipping");
    return [];
  }

  try {
    const country = params.country || "in"; // Default to India
    console.log(`[Adzuna] Fetching jobs for: ${params.query} in ${country}`);

    const url = new URL(`${ADZUNA_BASE_URL}/${country}/search/1`);
    url.searchParams.set("app_id", ADZUNA_APP_ID);
    url.searchParams.set("app_key", ADZUNA_APP_KEY);
    url.searchParams.set("what", params.query);
    url.searchParams.set("results_per_page", String(params.limit || 20));
    url.searchParams.set("content-type", "application/json");
    
    if (params.location) {
      url.searchParams.set("where", params.location);
    }

    const response = await fetch(url.toString(), {
      next: { revalidate: 3600 },
    });

    if (!response.ok) {
      throw new Error(`Adzuna API error: ${response.status}`);
    }

    const data: AdzunaResponse = await response.json();
    
    console.log(`[Adzuna] Found ${data.results.length} jobs`);

    return data.results.map((job) => normalizeAdzunaJob(job));
  } catch (error: any) {
    console.error("[Adzuna] Error:", error.message);
    return [];
  }
}

function normalizeAdzunaJob(job: AdzunaJob): Job {
  let salary: string | undefined;
  if (job.salary_min && job.salary_max) {
    salary = `₹${job.salary_min.toLocaleString()} - ₹${job.salary_max.toLocaleString()}`;
  } else if (job.salary_min) {
    salary = `₹${job.salary_min.toLocaleString()}+`;
  }

  const isRemote = 
    job.location?.display_name?.toLowerCase().includes("remote") ||
    job.title?.toLowerCase().includes("remote");

  return {
    id: `adzuna_${job.id}`,
    title: job.title,
    company: job.company?.display_name || "Unknown Company",
    location: job.location?.display_name || "India",
    description: job.description || "",
    applyLink: job.redirect_url,
    postedAt: job.created,
    salary,
    jobType: job.contract_time || job.contract_type,
    remote: isRemote,
    source: "adzuna",
    skills: [],
  };
}
