// src/lib/jobs/sources/internshalaService.ts
// Internshala Jobs - Uses Google Jobs API for internships in India

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

export async function fetchInternshalaJobs(params: {
  query: string;
  location?: string;
  limit?: number;
}): Promise<Job[]> {
  if (!SERP_API_KEY) {
    console.log("[Internshala] API key not configured, skipping");
    return [];
  }

  try {
    // Search specifically for internships in India
    const searchQuery = `${params.query} internship India`;
    console.log(`[Internshala] Fetching internships for: ${searchQuery}`);
    
    const url = new URL(SERP_API_URL);
    url.searchParams.set("api_key", SERP_API_KEY);
    url.searchParams.set("engine", "google_jobs");
    url.searchParams.set("q", searchQuery);
    url.searchParams.set("location", params.location || "India");
    url.searchParams.set("gl", "in");
    url.searchParams.set("hl", "en");
    // Filter for internships
    url.searchParams.set("ltype", "1"); // Entry level / internship

    const response = await fetch(url.toString(), {
      next: { revalidate: 3600 },
    });

    if (!response.ok) {
      throw new Error(`SerpAPI error: ${response.status}`);
    }

    const data = await response.json();
    const jobs: GoogleJobResult[] = data.jobs_results || [];
    
    // Filter for internships and Indian locations
    const internships = jobs.filter(job => {
      const titleLower = job.title?.toLowerCase() || "";
      const locationLower = job.location?.toLowerCase() || "";
      
      const isInternship = 
        titleLower.includes("intern") ||
        titleLower.includes("trainee") ||
        titleLower.includes("apprentice") ||
        job.detected_extensions?.schedule_type?.toLowerCase().includes("intern");
      
      const isIndian = 
        locationLower.includes("india") ||
        locationLower.includes("delhi") ||
        locationLower.includes("mumbai") ||
        locationLower.includes("bangalore") ||
        locationLower.includes("hyderabad") ||
        locationLower.includes("chennai") ||
        locationLower.includes("pune") ||
        locationLower.includes("noida");
      
      return isInternship && isIndian;
    });
    
    console.log(`[Internshala] Found ${internships.length} internships (filtered from ${jobs.length})`);

    return internships.slice(0, params.limit || 10).map((job, index) => ({
      id: `internshala_${job.job_id || index}_${Date.now()}`,
      title: job.title,
      company: job.company_name,
      location: job.location || "India",
      description: job.description || "",
      applyLink: job.apply_options?.[0]?.link || 
        `https://internshala.com/internships/${encodeURIComponent(params.query)}-internship`,
      postedAt: job.detected_extensions?.posted_at,
      salary: job.detected_extensions?.salary || "Stipend",
      jobType: "Internship",
      remote: job.location?.toLowerCase().includes("remote") || 
              job.location?.toLowerCase().includes("work from home"),
      source: "internshala" as const,
      skills: [],
    }));
  } catch (error: any) {
    console.error("[Internshala] Error:", error.message);
    return [];
  }
}
