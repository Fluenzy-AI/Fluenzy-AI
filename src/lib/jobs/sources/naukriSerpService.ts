// src/lib/jobs/sources/naukriSerpService.ts
// Naukri.com Jobs - Uses Google Jobs API without site filter (site filter doesn't work)

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

export async function fetchNaukriJobs(params: {
  query: string;
  location?: string;
  limit?: number;
}): Promise<Job[]> {
  if (!SERP_API_KEY) {
    console.log("[Naukri] API key not configured, skipping");
    return [];
  }

  try {
    // Search for jobs in India specifically - no site filter (doesn't work with google_jobs)
    const searchQuery = `${params.query} India jobs`;
    console.log(`[Naukri] Fetching Indian jobs for: ${searchQuery}`);
    
    const url = new URL(SERP_API_URL);
    url.searchParams.set("api_key", SERP_API_KEY);
    url.searchParams.set("engine", "google_jobs");
    url.searchParams.set("q", searchQuery);
    url.searchParams.set("location", params.location || "India");
    url.searchParams.set("gl", "in"); // Google India
    url.searchParams.set("hl", "en"); // English

    const response = await fetch(url.toString(), {
      next: { revalidate: 3600 },
    });

    if (!response.ok) {
      throw new Error(`SerpAPI error: ${response.status}`);
    }

    const data = await response.json();
    const jobs: GoogleJobResult[] = data.jobs_results || [];
    
    // Filter for Indian locations and Naukri/Indian job board links
    const indianJobs = jobs.filter(job => {
      const locationLower = job.location?.toLowerCase() || "";
      const hasIndianLocation = 
        locationLower.includes("india") ||
        locationLower.includes("delhi") ||
        locationLower.includes("mumbai") ||
        locationLower.includes("bangalore") ||
        locationLower.includes("bengaluru") ||
        locationLower.includes("hyderabad") ||
        locationLower.includes("chennai") ||
        locationLower.includes("pune") ||
        locationLower.includes("kolkata") ||
        locationLower.includes("noida") ||
        locationLower.includes("gurgaon") ||
        locationLower.includes("gurugram");
      
      // Also check if apply link is from Indian job boards
      const hasIndianJobBoard = job.apply_options?.some(opt => 
        opt.link?.includes("naukri.com") ||
        opt.link?.includes("indeed.co.in") ||
        opt.link?.includes("foundit.in") ||
        opt.link?.includes("shine.com") ||
        opt.link?.includes("timesjobs.com") ||
        opt.link?.includes("internshala.com")
      );
      
      return hasIndianLocation || hasIndianJobBoard;
    });
    
    console.log(`[Naukri] Found ${indianJobs.length} Indian jobs (filtered from ${jobs.length})`);

    return indianJobs.slice(0, params.limit || 10).map((job, index) => 
      normalizeIndianJob(job, index)
    );
  } catch (error: any) {
    console.error("[Naukri] Error:", error.message);
    return [];
  }
}

function normalizeIndianJob(job: GoogleJobResult, index: number): Job {
  // Prioritize Indian job board links
  let applyLink = "";
  if (job.apply_options && job.apply_options.length > 0) {
    const indianOption = job.apply_options.find(opt => 
      opt.link?.includes("naukri.com") ||
      opt.link?.includes("indeed.co.in") ||
      opt.link?.includes("foundit.in") ||
      opt.link?.includes("internshala.com")
    );
    applyLink = indianOption?.link || job.apply_options[0]?.link || "";
  }

  const isRemote = 
    job.location?.toLowerCase().includes("remote") ||
    job.location?.toLowerCase().includes("work from home");

  // Determine source based on apply link
  let source: "naukri" | "indeed" | "internshala" | "foundit" = "naukri";
  if (applyLink.includes("indeed")) source = "indeed";
  else if (applyLink.includes("internshala")) source = "internshala";
  else if (applyLink.includes("foundit")) source = "foundit";

  return {
    id: `indian_${job.job_id || index}_${Date.now()}`,
    title: job.title,
    company: job.company_name,
    location: job.location || "India",
    description: job.description || "",
    applyLink: applyLink || `https://www.naukri.com/${encodeURIComponent(job.title)}-jobs`,
    postedAt: job.detected_extensions?.posted_at,
    salary: job.detected_extensions?.salary,
    jobType: job.detected_extensions?.schedule_type,
    remote: isRemote,
    source: source,
    skills: [],
  };
}
