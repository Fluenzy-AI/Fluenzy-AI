// src/lib/jobs/naukri-scraper.ts
// Simple job aggregator for Indian jobs
import { Job } from "@/types/jobs";

interface FetchParams {
  query: string;
  location?: string;
  limit?: number;
}

// Using Remotive API for remote jobs (has global coverage including India)
export async function fetchRemotiveJobs({ query, location, limit = 50 }: FetchParams): Promise<Job[]> {
  try {
    // Clean the query - remove special characters and extra spaces
    const cleanQuery = query
      .replace(/[\/\\]/g, ' ')
      .replace(/\s+/g, ' ')
      .trim();
    
    // Take first 2-3 meaningful words for broader search
    const queryWords = cleanQuery.split(' ').slice(0, 3).join(' ');
    
    const url = `https://remotive.com/api/remote-jobs?search=${encodeURIComponent(queryWords)}&limit=100`;
    console.log("[Remotive] Fetching:", url);
    
    const res = await fetch(url, {
      headers: { Accept: "application/json" },
      cache: "no-store",
    });

    console.log("[Remotive] Response status:", res.status);

    if (!res.ok) {
      console.error(`[Remotive] API error ${res.status}`);
      return [];
    }

    const data = await res.json();
    const jobs = data.jobs ?? [];
    
    console.log("[Remotive] Jobs found:", jobs.length);

    // Filter by location if provided
    let filtered = jobs;
    if (location) {
      const locLower = location.toLowerCase();
      
      // For India specific location (not just "remote")
      if (locLower.includes('india') && !locLower.includes('remote')) {
        // Only include jobs that explicitly allow India/Asia/Worldwide
        filtered = jobs.filter((j: any) => {
          const jobLoc = j.candidate_required_location?.toLowerCase() || '';
          return jobLoc.includes('worldwide') || 
                 jobLoc.includes('anywhere') ||
                 jobLoc.includes('india') || 
                 jobLoc.includes('asia') ||
                 jobLoc === '';  // Empty location usually means worldwide
        });
      } else if (locLower === 'remote') {
        // For pure remote, return all jobs
        filtered = jobs;
      } else {
        // For other locations, check if location matches
        filtered = jobs.filter((j: any) => {
          const jobLoc = j.candidate_required_location?.toLowerCase() || '';
          return jobLoc.includes('worldwide') || 
                 jobLoc.includes('anywhere') ||
                 jobLoc === '' ||
                 jobLoc.includes(locLower.split(',')[0].trim()); // Match first part (city)
        });
      }
    }

    console.log(`[Remotive] After location filter: ${filtered.length} jobs`);

    return filtered.slice(0, limit).map((job: any) => ({
      id: job.id?.toString() || `remote-${Date.now()}-${Math.random()}`,
      title: job.title || "Untitled",
      company: job.company_name || "Unknown Company",
      location: job.candidate_required_location || "Remote",
      description: job.description || "",
      applyLink: job.url || "#",
      salary: job.salary ? `${job.salary}` : undefined,
      jobType: job.job_type || "full-time",
      remote: true,
      postedAt: job.publication_date,
      tags: job.tags || [],
      source: "arbeitnow" as const, // Keep as arbeitnow for type compatibility
    }));
  } catch (error) {
    console.error("[Remotive] Fetch error:", error);
    return [];
  }
}
