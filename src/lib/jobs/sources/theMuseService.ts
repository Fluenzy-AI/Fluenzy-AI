// src/lib/jobs/sources/theMuseService.ts
// The Muse - Free API for company jobs (Google, Microsoft, Meta, etc.)

import { Job } from "@/types/jobs";

const MUSE_API = "https://www.themuse.com/api/public/jobs";

interface MuseJob {
  id: number;
  name: string;
  type: string;
  publication_date: string;
  short_name: string;
  model_type: string;
  contents: string;
  company: {
    id: number;
    short_name: string;
    name: string;
  };
  locations: Array<{
    name: string;
  }>;
  levels: Array<{
    name: string;
    short_name: string;
  }>;
  tags: Array<{
    name: string;
    short_name: string;
  }>;
  categories: Array<{
    name: string;
  }>;
  refs: {
    landing_page: string;
  };
}

interface MuseResponse {
  page: number;
  page_count: number;
  items_per_page: number;
  total: number;
  results: MuseJob[];
}

export async function fetchMuseJobs(params: {
  query: string;
  location?: string;
  limit?: number;
  company?: string;
}): Promise<Job[]> {
  try {
    console.log(`[TheMuse] Fetching jobs for: ${params.query}`);

    const url = new URL(MUSE_API);
    url.searchParams.set("page", "1");
    
    // Search in job name
    if (params.query) {
      url.searchParams.set("category", params.query);
    }
    
    // Filter by company if specified
    if (params.company) {
      url.searchParams.set("company", params.company);
    }
    
    // Filter by location
    if (params.location) {
      url.searchParams.set("location", params.location);
    }

    const response = await fetch(url.toString(), {
      next: { revalidate: 3600 },
    });

    if (!response.ok) {
      throw new Error(`TheMuse API error: ${response.status}`);
    }

    const data: MuseResponse = await response.json();
    
    // Filter by query in title
    const queryLower = params.query.toLowerCase();
    const filtered = data.results.filter((job) => {
      const searchText = `${job.name} ${job.company?.name || ""} ${job.contents || ""}`.toLowerCase();
      return queryLower.split(" ").some((word) => searchText.includes(word));
    });
    
    console.log(`[TheMuse] Found ${filtered.length} jobs`);

    return filtered.slice(0, params.limit || 10).map((job) => normalizeMuseJob(job));
  } catch (error: any) {
    console.error("[TheMuse] Error:", error.message);
    return [];
  }
}

function normalizeMuseJob(job: MuseJob): Job {
  const location = job.locations?.map(l => l.name).join(", ") || "Unknown";
  const isRemote = location.toLowerCase().includes("remote") || 
                   location.toLowerCase().includes("flexible");

  return {
    id: `muse_${job.id}`,
    title: job.name,
    company: job.company?.name || "Unknown Company",
    location: location,
    description: job.contents || "",
    applyLink: job.refs?.landing_page || `https://www.themuse.com/jobs/${job.short_name}`,
    postedAt: job.publication_date,
    salary: undefined,
    jobType: job.type,
    remote: isRemote,
    source: "themuse",
    skills: job.tags?.map(t => t.name) || [],
  };
}
