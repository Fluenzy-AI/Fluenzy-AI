// src/lib/jobs/sources/flexJobsService.ts
// FlexJobs, WeWorkRemotely, Jobspresso via SerpAPI

import { Job } from "@/types/jobs";

const SERP_API_KEY = process.env.SERP_API_KEY || "";
const SERP_API_URL = "https://serpapi.com/search.json";

export async function fetchFlexJobsJobs(params: {
  query: string;
  location?: string;
  limit?: number;
}): Promise<Job[]> {
  if (!SERP_API_KEY) {
    console.log("[FlexJobs-Serp] API key not configured, skipping");
    return [];
  }

  try {
    console.log(`[FlexJobs-Serp] Fetching FlexJobs for: ${params.query}`);

    const searchQuery = `site:flexjobs.com ${params.query}`;
    
    const url = new URL(SERP_API_URL);
    url.searchParams.set("api_key", SERP_API_KEY);
    url.searchParams.set("engine", "google_jobs");
    url.searchParams.set("q", searchQuery);
    url.searchParams.set("num", String(params.limit || 10));

    const response = await fetch(url.toString(), {
      next: { revalidate: 3600 },
    });

    if (!response.ok) {
      throw new Error(`SerpAPI error: ${response.status}`);
    }

    const data = await response.json();
    const jobs = data.jobs_results || [];
    
    console.log(`[FlexJobs-Serp] Found ${jobs.length} jobs`);

    return jobs.slice(0, params.limit || 10).map((job: any, index: number) => ({
      id: `flexjobs_${job.job_id || index}_${Date.now()}`,
      title: job.title,
      company: job.company_name,
      location: job.location || "Remote/Flexible",
      description: job.description || "",
      applyLink: job.apply_options?.[0]?.link || `https://www.flexjobs.com/search?search=${encodeURIComponent(job.title)}`,
      postedAt: job.detected_extensions?.posted_at,
      salary: job.detected_extensions?.salary,
      jobType: "Flexible/Remote",
      remote: true,
      source: "flexjobs",
      skills: [],
    }));
  } catch (error: any) {
    console.error("[FlexJobs-Serp] Error:", error.message);
    return [];
  }
}

export async function fetchWeWorkRemotelyJobs(params: {
  query: string;
  limit?: number;
}): Promise<Job[]> {
  if (!SERP_API_KEY) {
    console.log("[WWR-Serp] API key not configured, skipping");
    return [];
  }

  try {
    console.log(`[WWR-Serp] Fetching WeWorkRemotely jobs for: ${params.query}`);

    const searchQuery = `site:weworkremotely.com ${params.query}`;
    
    const url = new URL(SERP_API_URL);
    url.searchParams.set("api_key", SERP_API_KEY);
    url.searchParams.set("engine", "google_jobs");
    url.searchParams.set("q", searchQuery);
    url.searchParams.set("num", String(params.limit || 10));

    const response = await fetch(url.toString(), {
      next: { revalidate: 3600 },
    });

    if (!response.ok) {
      throw new Error(`SerpAPI error: ${response.status}`);
    }

    const data = await response.json();
    const jobs = data.jobs_results || [];
    
    console.log(`[WWR-Serp] Found ${jobs.length} jobs`);

    return jobs.slice(0, params.limit || 10).map((job: any, index: number) => ({
      id: `wwr_${job.job_id || index}_${Date.now()}`,
      title: job.title,
      company: job.company_name,
      location: "Remote",
      description: job.description || "",
      applyLink: job.apply_options?.[0]?.link || `https://weworkremotely.com/remote-jobs/search?term=${encodeURIComponent(job.title)}`,
      postedAt: job.detected_extensions?.posted_at,
      salary: job.detected_extensions?.salary,
      jobType: "Remote",
      remote: true,
      source: "weworkremotely",
      skills: [],
    }));
  } catch (error: any) {
    console.error("[WWR-Serp] Error:", error.message);
    return [];
  }
}
