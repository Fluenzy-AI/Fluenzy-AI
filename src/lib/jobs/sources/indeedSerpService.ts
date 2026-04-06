// src/lib/jobs/sources/indeedSerpService.ts
// Indeed Jobs via Google Jobs API (searches for jobs with Indeed apply links)

import { Job } from "@/types/jobs";

const SERP_API_KEY = process.env.SERP_API_KEY || "";
const SERP_API_URL = "https://serpapi.com/search.json";

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

export async function fetchIndeedJobs(params: {
  query: string;
  location?: string;
  limit?: number;
}): Promise<Job[]> {
  if (!SERP_API_KEY) {
    console.log("[Indeed] API key not configured, skipping");
    return [];
  }

  try {
    console.log(`[Indeed] Fetching jobs for: ${params.query} in ${params.location || "worldwide"}`);
    
    const url = new URL(SERP_API_URL);
    url.searchParams.set("api_key", SERP_API_KEY);
    url.searchParams.set("engine", "google_jobs");
    url.searchParams.set("q", params.query);
    
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
    
    // Filter for jobs with Indeed apply options
    const indeedJobs = jobs.filter(job => 
      job.apply_options?.some(opt => 
        opt.link?.includes("indeed.com") || opt.link?.includes("indeed.co")
      )
    );
    
    console.log(`[Indeed] Found ${indeedJobs.length} Indeed jobs (from ${jobs.length} total)`);

    return indeedJobs.slice(0, params.limit || 10).map((job, index) => {
      const indeedLink = job.apply_options?.find(opt => 
        opt.link?.includes("indeed.com") || opt.link?.includes("indeed.co")
      )?.link;
      
      return {
        id: `indeed_${job.job_id || index}_${Date.now()}`,
        title: job.title,
        company: job.company_name,
        location: job.location || "Unknown",
        description: job.description || "",
        applyLink: indeedLink || job.apply_options?.[0]?.link || 
          `https://www.indeed.com/jobs?q=${encodeURIComponent(job.title)}`,
        postedAt: job.detected_extensions?.posted_at,
        salary: job.detected_extensions?.salary,
        jobType: job.detected_extensions?.schedule_type,
        remote: job.location?.toLowerCase().includes("remote"),
        source: "indeed" as const,
        skills: [],
      };
    });
  } catch (error: any) {
    console.error("[Indeed] Error:", error.message);
    return [];
  }
}
