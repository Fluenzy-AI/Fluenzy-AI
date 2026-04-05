// src/lib/jobs/additionalSourcesService.ts
// Additional job sources - fetches from multiple popular job boards
// This does NOT modify existing jobService.ts logic

import { Job } from "@/types/jobs";
import { fetchRemoteOkJobs } from "./sources/remoteOkService";
import { fetchRemotiveJobs } from "./sources/remotiveService";
import { fetchMuseJobs } from "./sources/theMuseService";
import { fetchAdzunaJobs } from "./sources/adzunaService";
import { fetchLinkedInJobs } from "./sources/linkedinSerpService";
import { fetchIndeedJobs } from "./sources/indeedSerpService";
import { fetchGlassdoorJobs } from "./sources/glassdoorSerpService";
import { fetchNaukriJobs } from "./sources/naukriSerpService";
import { fetchInternshalaJobs } from "./sources/internshalaService";
import { fetchFoundItJobs } from "./sources/foundItService";
import { fetchWellfoundJobs } from "./sources/wellfoundService";
import { fetchFlexJobsJobs, fetchWeWorkRemotelyJobs } from "./sources/flexJobsService";
import { fetchBigTechJobs } from "./sources/bigTechService";

export type SourceCategory = "bigtech" | "indian" | "remote" | "all";

interface AdditionalSourcesParams {
  query: string;
  location?: string;
  limit?: number;
  category?: SourceCategory;
}

/**
 * Fetch jobs from additional sources
 * Categories:
 * - bigtech: Google, Microsoft, Amazon, Apple, Meta, LinkedIn, Indeed, Glassdoor
 * - indian: Naukri, Internshala, FoundIt, Wellfound
 * - remote: RemoteOK, Remotive, FlexJobs, WeWorkRemotely
 * - all: All sources combined
 */
export async function fetchAdditionalJobs(params: AdditionalSourcesParams): Promise<Job[]> {
  const { query, location, limit = 50, category = "all" } = params;
  const allJobs: Job[] = [];
  const limitPerSource = Math.ceil(limit / 10); // Distribute limit across sources

  console.log(`[AdditionalSources] Fetching from category: ${category}`);

  const fetchPromises: Promise<Job[]>[] = [];

  // Big Tech & Popular Job Boards (10+ sources)
  if (category === "bigtech" || category === "all") {
    fetchPromises.push(
      fetchBigTechJobs({ query, location, limit: limitPerSource * 2 }).catch(() => []),
      fetchLinkedInJobs({ query, location, limit: limitPerSource }).catch(() => []),
      fetchIndeedJobs({ query, location, limit: limitPerSource }).catch(() => []),
      fetchGlassdoorJobs({ query, location, limit: limitPerSource }).catch(() => []),
      fetchMuseJobs({ query, location, limit: limitPerSource }).catch(() => []),
      fetchAdzunaJobs({ query, location, limit: limitPerSource }).catch(() => [])
    );
  }

  // Indian Job Boards (10+ sources)
  if (category === "indian" || category === "all") {
    fetchPromises.push(
      fetchNaukriJobs({ query, location: location || "India", limit: limitPerSource }).catch(() => []),
      fetchInternshalaJobs({ query, location: location || "India", limit: limitPerSource }).catch(() => []),
      fetchFoundItJobs({ query, location: location || "India", limit: limitPerSource }).catch(() => []),
      fetchWellfoundJobs({ query, location, limit: limitPerSource }).catch(() => [])
    );
  }

  // Remote Job Boards
  if (category === "remote" || category === "all") {
    fetchPromises.push(
      fetchRemoteOkJobs({ query, limit: limitPerSource }).catch(() => []),
      fetchRemotiveJobs({ query, limit: limitPerSource }).catch(() => []),
      fetchFlexJobsJobs({ query, limit: limitPerSource }).catch(() => []),
      fetchWeWorkRemotelyJobs({ query, limit: limitPerSource }).catch(() => [])
    );
  }

  // Execute all fetches in parallel
  const results = await Promise.all(fetchPromises);
  
  for (const jobs of results) {
    allJobs.push(...jobs);
  }

  console.log(`[AdditionalSources] Total fetched: ${allJobs.length} jobs from ${results.length} sources`);

  return allJobs.slice(0, limit);
}

/**
 * Source info for UI display
 */
export const JOB_SOURCES_INFO = {
  bigtech: {
    label: "Big Tech & Popular",
    sources: [
      { name: "LinkedIn", icon: "💼" },
      { name: "Indeed", icon: "🔍" },
      { name: "Glassdoor", icon: "🚪" },
      { name: "Google Careers", icon: "🔴🟡🟢🔵" },
      { name: "Microsoft Careers", icon: "🪟" },
      { name: "Amazon Jobs", icon: "📦" },
      { name: "Apple Careers", icon: "🍎" },
      { name: "Meta Careers", icon: "♾️" },
      { name: "The Muse", icon: "🎭" },
      { name: "Adzuna", icon: "🌐" },
    ],
  },
  indian: {
    label: "Indian Job Boards",
    sources: [
      { name: "Naukri.com", icon: "🇮🇳" },
      { name: "Shine.com", icon: "✨" },
      { name: "TimesJobs", icon: "📰" },
      { name: "Freshersworld", icon: "🎓" },
      { name: "Foundit", icon: "🔎" },
      { name: "Internshala", icon: "📚" },
      { name: "AngelList/Wellfound", icon: "👼" },
      { name: "HackerRank Jobs", icon: "💻" },
      { name: "CutShort", icon: "✂️" },
      { name: "WorkIndia", icon: "🏢" },
    ],
  },
  remote: {
    label: "Remote & Freelance",
    sources: [
      { name: "We Work Remotely", icon: "🌍" },
      { name: "Remote OK", icon: "✅" },
      { name: "FlexJobs", icon: "🧘" },
      { name: "Remotive", icon: "🏠" },
      { name: "Toptal", icon: "⭐" },
      { name: "Upwork", icon: "💚" },
      { name: "Fiverr", icon: "🟢" },
      { name: "Freelancer", icon: "🆓" },
      { name: "Dice", icon: "🎲" },
      { name: "Jobspresso", icon: "☕" },
    ],
  },
};
