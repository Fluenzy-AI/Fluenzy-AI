// src/lib/jobs/sources/naukriSerpService.ts
// Naukri.com Jobs via SerpAPI (Google Jobs from Naukri)

import { Job } from "@/types/jobs";

const SERP_API_KEY = process.env.SERP_API_KEY || "";
const SERP_API_URL = "https://serpapi.com/search.json";

interface SerpNaukriResult {
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

export async function fetchNaukriJobs(params: {
  query: string;
  location?: string;
  limit?: number;
}): Promise<Job[]> {
  if (!SERP_API_KEY) {
    console.log("[Naukri-Serp] API key not configured, skipping");
    return [];
  }

  try {
    console.log(`[Naukri-Serp] Fetching Naukri jobs for: ${params.query}`);

    // Use site:naukri.com to filter Naukri results only
    const searchQuery = `site:naukri.com ${params.query}`;
    
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
    const jobs: SerpNaukriResult[] = data.jobs_results || [];
    
    console.log(`[Naukri-Serp] Found ${jobs.length} jobs`);

    return jobs.slice(0, params.limit || 10).map((job, index) => 
      normalizeNaukriJob(job, index)
    );
  } catch (error: any) {
    console.error("[Naukri-Serp] Error:", error.message);
    return [];
  }
}

function normalizeNaukriJob(job: SerpNaukriResult, index: number): Job {
  // Find Naukri apply link
  let applyLink = "";
  if (job.apply_options && job.apply_options.length > 0) {
    const naukriOption = job.apply_options.find(opt => 
      opt.link.includes("naukri.com")
    );
    applyLink = naukriOption?.link || job.apply_options[0]?.link || "";
  }

  const isRemote = 
    job.location?.toLowerCase().includes("remote") ||
    job.location?.toLowerCase().includes("work from home");

  return {
    id: `naukri_${job.job_id || index}_${Date.now()}`,
    title: job.title,
    company: job.company_name,
    location: job.location || "India",
    description: job.description || "",
    applyLink: applyLink || `https://www.naukri.com/${encodeURIComponent(job.title)}-jobs`,
    postedAt: job.detected_extensions?.posted_at,
    salary: job.detected_extensions?.salary,
    jobType: job.detected_extensions?.schedule_type,
    remote: isRemote,
    source: "naukri",
    skills: [],
  };
}
