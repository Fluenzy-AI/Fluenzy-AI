// src/lib/jobs/sources/wellfoundService.ts
// Wellfound (formerly AngelList Talent) - Startup Jobs API

import { Job } from "@/types/jobs";

const SERP_API_KEY = process.env.SERP_API_KEY || "";
const SERP_API_URL = "https://serpapi.com/search.json";

export async function fetchWellfoundJobs(params: {
  query: string;
  location?: string;
  limit?: number;
}): Promise<Job[]> {
  if (!SERP_API_KEY) {
    console.log("[Wellfound-Serp] API key not configured, skipping");
    return [];
  }

  try {
    console.log(`[Wellfound-Serp] Fetching Wellfound/AngelList jobs for: ${params.query}`);

    const searchQuery = `site:wellfound.com ${params.query} OR site:angel.co ${params.query}`;
    
    const url = new URL(SERP_API_URL);
    url.searchParams.set("api_key", SERP_API_KEY);
    url.searchParams.set("engine", "google_jobs");
    url.searchParams.set("q", searchQuery);
    url.searchParams.set("num", String(params.limit || 10));
    
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
    const jobs = data.jobs_results || [];
    
    console.log(`[Wellfound-Serp] Found ${jobs.length} jobs`);

    return jobs.slice(0, params.limit || 10).map((job: any, index: number) => ({
      id: `wellfound_${job.job_id || index}_${Date.now()}`,
      title: job.title,
      company: job.company_name,
      location: job.location || "Remote",
      description: job.description || "",
      applyLink: job.apply_options?.[0]?.link || `https://wellfound.com/jobs`,
      postedAt: job.detected_extensions?.posted_at,
      salary: job.detected_extensions?.salary,
      jobType: job.detected_extensions?.schedule_type,
      remote: job.location?.toLowerCase().includes("remote"),
      source: "wellfound",
      skills: [],
    }));
  } catch (error: any) {
    console.error("[Wellfound-Serp] Error:", error.message);
    return [];
  }
}
