// src/lib/jobs/sources/remoteOkService.ts
// RemoteOK - Free public API for remote jobs

import { Job } from "@/types/jobs";

const REMOTE_OK_API = "https://remoteok.com/api";

interface RemoteOkJob {
  id: string;
  slug: string;
  company: string;
  company_logo?: string;
  position: string;
  tags?: string[];
  location?: string;
  description?: string;
  url: string;
  apply_url?: string;
  date: string;
  salary_min?: number;
  salary_max?: number;
}

export async function fetchRemoteOkJobs(params: {
  query: string;
  limit?: number;
}): Promise<Job[]> {
  try {
    console.log(`[RemoteOK] Fetching jobs for: ${params.query}`);

    const response = await fetch(REMOTE_OK_API, {
      headers: {
        "User-Agent": "FluenzyAI Job Search",
      },
      next: { revalidate: 3600 },
    });

    if (!response.ok) {
      throw new Error(`RemoteOK API error: ${response.status}`);
    }

    const data: RemoteOkJob[] = await response.json();
    
    // First item is metadata, skip it
    const jobs = data.slice(1);
    
    // Filter by query
    const queryLower = params.query.toLowerCase();
    const filtered = jobs.filter((job) => {
      const searchText = `${job.position} ${job.company} ${job.tags?.join(" ") || ""} ${job.description || ""}`.toLowerCase();
      return queryLower.split(" ").some((word) => searchText.includes(word));
    });

    const limit = params.limit || 10;
    const limitedJobs = filtered.slice(0, limit);

    console.log(`[RemoteOK] Found ${limitedJobs.length} jobs`);

    return limitedJobs.map((job) => normalizeRemoteOkJob(job));
  } catch (error: any) {
    console.error("[RemoteOK] Error:", error.message);
    return [];
  }
}

function normalizeRemoteOkJob(job: RemoteOkJob): Job {
  let salary: string | undefined;
  if (job.salary_min && job.salary_max) {
    salary = `$${job.salary_min.toLocaleString()} - $${job.salary_max.toLocaleString()}`;
  } else if (job.salary_min) {
    salary = `$${job.salary_min.toLocaleString()}+`;
  }

  return {
    id: `remoteok_${job.id || job.slug}`,
    title: job.position,
    company: job.company,
    location: job.location || "Remote",
    description: job.description || "",
    applyLink: job.apply_url || job.url,
    postedAt: job.date,
    salary,
    jobType: "Remote",
    remote: true,
    source: "remoteok",
    skills: job.tags || [],
  };
}
