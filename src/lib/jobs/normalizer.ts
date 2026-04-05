// src/lib/jobs/normalizer.ts
import { Job } from "@/types/jobs";
import { v4 as uuid } from "uuid";

export function normalizeArbeitNow(raw: any): Job {
  return {
    id: raw.slug || uuid(),
    title: raw.title ?? "Untitled",
    company: raw.company_name ?? "Unknown",
    location: raw.location ?? "Remote",
    description: raw.description ?? "",
    applyLink: raw.url ?? "#",
    salary: undefined,
    jobType: raw.job_types?.[0] ?? undefined,
    remote: raw.remote ?? false,
    postedAt: raw.created_at,
    tags: raw.tags ?? [],
    source: "arbeitnow",
  };
}

export function normalizeJSearch(raw: any): Job {
  return {
    id: raw.job_id || uuid(),
    title: raw.job_title ?? "Untitled",
    company: raw.employer_name ?? "Unknown",
    location: `${raw.job_city ?? ""}, ${raw.job_country ?? ""}`.trim() || "Remote",
    description: raw.job_description ?? "",
    applyLink: raw.job_apply_link ?? "#",
    salary: raw.job_min_salary
      ? `$${raw.job_min_salary}–$${raw.job_max_salary ?? "?"} ${raw.job_salary_period ?? ""}`
      : undefined,
    jobType: raw.job_employment_type ?? undefined,
    remote: raw.job_is_remote ?? false,
    postedAt: raw.job_posted_at_datetime_utc,
    tags: raw.job_required_skills ?? [],
    source: "jsearch",
  };
}
