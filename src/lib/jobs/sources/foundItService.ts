// src/lib/jobs/sources/foundItService.ts
// FoundIt (formerly Monster India) Jobs via SerpAPI

import { Job } from "@/types/jobs";

const SERP_API_KEY = process.env.SERP_API_KEY || "";
const SERP_API_URL = "https://serpapi.com/search.json";

export async function fetchFoundItJobs(params: {
  query: string;
  location?: string;
  limit?: number;
}): Promise<Job[]> {
  if (!SERP_API_KEY) {
    console.log("[FoundIt-Serp] API key not configured, skipping");
    return [];
  }

  try {
    console.log(`[FoundIt-Serp] Fetching FoundIt jobs for: ${params.query}`);

    const searchQuery = `site:foundit.in ${params.query}`;
    
    const url = new URL(SERP_API_URL);
    url.searchParams.set("api_key", SERP_API_KEY);
    url.searchParams.set("engine", "google_jobs");
    url.searchParams.set("q", searchQuery);
    url.searchParams.set("location", params.location || "India");
    url.searchParams.set("num", String(params.limit || 10));

    const response = await fetch(url.toString(), {
      next: { revalidate: 3600 },
    });

    if (!response.ok) {
      throw new Error(`SerpAPI error: ${response.status}`);
    }

    const data = await response.json();
    const jobs = data.jobs_results || [];
    
    console.log(`[FoundIt-Serp] Found ${jobs.length} jobs`);

    return jobs.slice(0, params.limit || 10).map((job: any, index: number) => ({
      id: `foundit_${job.job_id || index}_${Date.now()}`,
      title: job.title,
      company: job.company_name,
      location: job.location || "India",
      description: job.description || "",
      applyLink: job.apply_options?.[0]?.link || `https://www.foundit.in/srp/results?query=${encodeURIComponent(job.title)}`,
      postedAt: job.detected_extensions?.posted_at,
      salary: job.detected_extensions?.salary,
      jobType: job.detected_extensions?.schedule_type,
      remote: job.location?.toLowerCase().includes("remote"),
      source: "foundit",
      skills: [],
    }));
  } catch (error: any) {
    console.error("[FoundIt-Serp] Error:", error.message);
    return [];
  }
}
