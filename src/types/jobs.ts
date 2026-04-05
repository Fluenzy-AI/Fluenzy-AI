// src/types/jobs.ts

export type UserPlan = "free" | "pro" | "standard";

export type JobSource = "arbeitnow" | "jsearch" | "serpapi";

export type ApplicationStatus =
  | "saved" | "applied" | "interviewing" | "offered" | "rejected";

// Unified Job type (all APIs normalize to this)
export interface Job {
  id: string;
  title: string;
  company: string;
  location: string;
  description: string;
  applyLink: string;
  salary?: string;
  jobType?: string;
  remote?: boolean;
  postedAt?: string;
  tags?: string[];
  source: JobSource;
}

// Match result from AI / keyword engine
export interface JobMatch extends Job {
  matchScore: number;
  matchedSkills: string[];
  missingSkills: string[];
}

// Search params
export interface JobSearchParams {
  query: string;
  location?: string;
  remote?: boolean;
  jobType?: string;
  page?: number;
}

// API response
export interface JobSearchResponse {
  jobs: JobMatch[];
  total: number;
  fromCache: boolean;
  sessionsRemaining: number;
  plan: UserPlan;
}

// Plan limits config
export const PLAN_LIMITS: Record<UserPlan, {
  maxJobs: number;
  maxSaved: number;
  sessions: number;
  aiMatching: boolean;
  coverLetters: number;
  priority: boolean;
}> = {
  free: { maxJobs: 10, maxSaved: 5, sessions: 0, aiMatching: false, coverLetters: 0, priority: false },
  pro: { maxJobs: 50, maxSaved: 50, sessions: 5, aiMatching: true, coverLetters: 5, priority: false },
  standard: { maxJobs: 100, maxSaved: Infinity, sessions: 20, aiMatching: true, coverLetters: -1, priority: true },
};
