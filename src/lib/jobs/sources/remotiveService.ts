// src/lib/jobs/sources/remotiveService.ts
// Remotive - Free API for remote jobs

import { Job } from "@/types/jobs";

const REMOTIVE_API = "https://remotive.com/api/remote-jobs";

interface RemotiveJob {
  id: number;
  url: string;
  title: string;
  company_name: string;
  company_logo?: string;
  category: string;
  tags?: string[];
  job_type: string;
  publication_date: string;
  candidate_required_location: string;
  salary?: string;
  description?: string;
}

interface RemotiveResponse {
  "job-count": number;
  jobs: RemotiveJob[];
}

export async function fetchRemotiveJobs(params: {
  query: string;
  limit?: number;
}): Promise<Job[]> {
  try {
    console.log(`[Remotive] Fetching jobs for: ${params.query}`);

    const url = new URL(REMOTIVE_API);
    url.searchParams.set("search", params.query);
    url.searchParams.set("limit", String(params.limit || 20));

    const response = await fetch(url.toString(), {
      next: { revalidate: 3600 },
    });

    if (!response.ok) {
      throw new Error(`Remotive API error: ${response.status}`);
    }

    const data: RemotiveResponse = await response.json();
    
    console.log(`[Remotive] Found ${data.jobs.length} jobs`);

    return data.jobs.slice(0, params.limit || 10).map((job) => normalizeRemotiveJob(job));
  } catch (error: any) {
    console.error("[Remotive] Error:", error.message);
    return [];
  }
}

function normalizeRemotiveJob(job: RemotiveJob): Job {
  return {
    id: `remotive_${job.id}`,
    title: job.title,
    company: job.company_name,
    location: job.candidate_required_location || "Remote",
    description: job.description || "",
    applyLink: job.url,
    postedAt: job.publication_date,
    salary: job.salary,
    jobType: job.job_type,
    remote: true,
    source: "remotive",
    skills: job.tags || [],
  };
}
