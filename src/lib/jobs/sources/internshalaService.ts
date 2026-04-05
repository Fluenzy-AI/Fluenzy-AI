// src/lib/jobs/sources/internshalaService.ts
// Internshala Jobs via SerpAPI (Google Jobs from Internshala)

import { Job } from "@/types/jobs";

const SERP_API_KEY = process.env.SERP_API_KEY || "";
const SERP_API_URL = "https://serpapi.com/search.json";

interface SerpInternshalaResult {
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

export async function fetchInternshalaJobs(params: {
  query: string;
  location?: string;
  limit?: number;
}): Promise<Job[]> {
  if (!SERP_API_KEY) {
    console.log("[Internshala-Serp] API key not configured, skipping");
    return [];
  }

  try {
    console.log(`[Internshala-Serp] Fetching Internshala jobs for: ${params.query}`);

    // Use site:internshala.com to filter Internshala results only
    const searchQuery = `site:internshala.com ${params.query} internship`;
    
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
    const jobs: SerpInternshalaResult[] = data.jobs_results || [];
    
    console.log(`[Internshala-Serp] Found ${jobs.length} jobs`);

    return jobs.slice(0, params.limit || 10).map((job, index) => 
      normalizeInternshalaJob(job, index)
    );
  } catch (error: any) {
    console.error("[Internshala-Serp] Error:", error.message);
    return [];
  }
}

function normalizeInternshalaJob(job: SerpInternshalaResult, index: number): Job {
  // Find Internshala apply link
  let applyLink = "";
  if (job.apply_options && job.apply_options.length > 0) {
    const internshalaOption = job.apply_options.find(opt => 
      opt.link.includes("internshala.com")
    );
    applyLink = internshalaOption?.link || job.apply_options[0]?.link || "";
  }

  const isRemote = 
    job.location?.toLowerCase().includes("remote") ||
    job.location?.toLowerCase().includes("work from home");

  return {
    id: `internshala_${job.job_id || index}_${Date.now()}`,
    title: job.title,
    company: job.company_name,
    location: job.location || "India",
    description: job.description || "",
    applyLink: applyLink || `https://internshala.com/internships/${encodeURIComponent(job.title)}-internship`,
    postedAt: job.detected_extensions?.posted_at,
    salary: job.detected_extensions?.salary,
    jobType: "Internship",
    remote: isRemote,
    source: "internshala",
    skills: [],
  };
}
