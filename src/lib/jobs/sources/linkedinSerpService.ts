// src/lib/jobs/sources/linkedinSerpService.ts
// LinkedIn Jobs via SerpAPI (Google Jobs from LinkedIn)

import { Job } from "@/types/jobs";

const SERP_API_KEY = process.env.SERP_API_KEY || "";
const SERP_API_URL = "https://serpapi.com/search.json";

interface SerpLinkedInResult {
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

export async function fetchLinkedInJobs(params: {
  query: string;
  location?: string;
  limit?: number;
}): Promise<Job[]> {
  if (!SERP_API_KEY) {
    console.log("[LinkedIn-Serp] API key not configured, skipping");
    return [];
  }

  try {
    console.log(`[LinkedIn-Serp] Fetching LinkedIn jobs for: ${params.query}`);

    // Use site:linkedin.com to filter LinkedIn results only
    const searchQuery = `site:linkedin.com/jobs ${params.query}`;
    
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
    const jobs: SerpLinkedInResult[] = data.jobs_results || [];
    
    console.log(`[LinkedIn-Serp] Found ${jobs.length} jobs`);

    return jobs.slice(0, params.limit || 10).map((job, index) => 
      normalizeLinkedInJob(job, index)
    );
  } catch (error: any) {
    console.error("[LinkedIn-Serp] Error:", error.message);
    return [];
  }
}

function normalizeLinkedInJob(job: SerpLinkedInResult, index: number): Job {
  // Find LinkedIn apply link
  let applyLink = "";
  if (job.apply_options && job.apply_options.length > 0) {
    const linkedinOption = job.apply_options.find(opt => 
      opt.link.includes("linkedin.com")
    );
    applyLink = linkedinOption?.link || job.apply_options[0]?.link || "";
  }

  const isRemote = 
    job.location?.toLowerCase().includes("remote") ||
    job.title?.toLowerCase().includes("remote");

  return {
    id: `linkedin_${job.job_id || index}_${Date.now()}`,
    title: job.title,
    company: job.company_name,
    location: job.location || "Unknown",
    description: job.description || "",
    applyLink: applyLink || `https://www.linkedin.com/jobs/search/?keywords=${encodeURIComponent(job.title)}`,
    postedAt: job.detected_extensions?.posted_at,
    salary: job.detected_extensions?.salary,
    jobType: job.detected_extensions?.schedule_type,
    remote: isRemote,
    source: "linkedin",
    skills: [],
  };
}
