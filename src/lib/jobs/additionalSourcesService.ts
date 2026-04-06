// src/lib/jobs/additionalSourcesService.ts
// Additional job sources - fetches from multiple popular job boards
// Uses Direct Search (Google Search with site: filter) for LinkedIn, Indeed, etc.

import { Job, JobSource } from "@/types/jobs";
import { fetchRemoteOkJobs } from "./sources/remoteOkService";
import { fetchRemotiveJobs } from "./sources/remotiveService";
import { fetchMuseJobs } from "./sources/theMuseService";
import { fetchAdzunaJobs } from "./sources/adzunaService";
import { fetchFlexJobsJobs, fetchWeWorkRemotelyJobs } from "./sources/flexJobsService";
import { fetchDirectJobsFromAllSites } from "./sources/directSearchService";

const SERP_API_KEY = process.env.SERP_API_KEY || "";
const SERP_API_URL = "https://serpapi.com/search.json";

export type SourceCategory = "bigtech" | "indian" | "remote" | "all";

interface AdditionalSourcesParams {
  query: string;
  location?: string;
  limit?: number;
  category?: SourceCategory;
}

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

// Big tech company names for filtering
const BIG_TECH_NAMES = ["Google", "Microsoft", "Amazon", "Apple", "Meta", "Facebook"];

// Indian city/state names for location filtering  
const INDIAN_LOCATIONS = [
  "india", "delhi", "mumbai", "bangalore", "bengaluru", "hyderabad", "chennai",
  "pune", "kolkata", "noida", "gurgaon", "gurugram", "ahmedabad", "jaipur"
];

/**
 * Fetch jobs from Google Jobs API once and categorize by source
 * This is more efficient than making separate calls for each site
 */
async function fetchGoogleJobsOptimized(params: {
  query: string;
  location?: string;
  isIndianSearch: boolean;
}): Promise<{
  linkedIn: Job[];
  indeed: Job[];
  glassdoor: Job[];
  bigTech: Job[];
  indianJobs: Job[];
  naukri: Job[];
  internshala: Job[];
  other: Job[];
}> {
  const result = {
    linkedIn: [] as Job[],
    indeed: [] as Job[],
    glassdoor: [] as Job[],
    bigTech: [] as Job[],
    indianJobs: [] as Job[],
    naukri: [] as Job[],
    internshala: [] as Job[],
    other: [] as Job[],
  };

  if (!SERP_API_KEY) {
    console.log("[GoogleJobs] API key not configured, skipping SerpAPI-based sources");
    return result;
  }

  try {
    console.log(`[GoogleJobs] Fetching: "${params.query}" in ${params.location || "worldwide"}`);
    
    const url = new URL(SERP_API_URL);
    url.searchParams.set("api_key", SERP_API_KEY);
    url.searchParams.set("engine", "google_jobs");
    url.searchParams.set("q", params.query);
    
    if (params.location) {
      url.searchParams.set("location", params.location);
    }
    
    // For Indian searches, set India as country
    if (params.isIndianSearch) {
      url.searchParams.set("gl", "in");
      url.searchParams.set("hl", "en");
    }

    const response = await fetch(url.toString(), {
      next: { revalidate: 3600 },
    });

    if (!response.ok) {
      console.log(`[GoogleJobs] API error: ${response.status}`);
      return result;
    }

    const data = await response.json();
    const jobs: GoogleJobResult[] = data.jobs_results || [];
    
    console.log(`[GoogleJobs] Found ${jobs.length} total jobs, categorizing...`);

    // Categorize jobs based on apply links and company names
    jobs.forEach((job, index) => {
      const companyLower = job.company_name?.toLowerCase() || "";
      const locationLower = job.location?.toLowerCase() || "";
      const titleLower = job.title?.toLowerCase() || "";
      const applyLinks = job.apply_options || [];
      
      // Determine source based on apply link
      const hasLinkedIn = applyLinks.some(opt => opt.link?.includes("linkedin.com"));
      const hasIndeed = applyLinks.some(opt => opt.link?.includes("indeed.com") || opt.link?.includes("indeed.co"));
      const hasGlassdoor = applyLinks.some(opt => opt.link?.includes("glassdoor.com"));
      const hasNaukri = applyLinks.some(opt => opt.link?.includes("naukri.com"));
      const hasInternshala = applyLinks.some(opt => opt.link?.includes("internshala.com"));
      const hasIndianBoard = applyLinks.some(opt => 
        opt.link?.includes("foundit.in") || 
        opt.link?.includes("shine.com") || 
        opt.link?.includes("timesjobs.com")
      );
      
      // Check if from big tech company
      const isBigTech = BIG_TECH_NAMES.some(tech => companyLower.includes(tech.toLowerCase()));
      
      // Check if Indian location
      const isIndianLocation = INDIAN_LOCATIONS.some(loc => locationLower.includes(loc));
      
      // Check if internship
      const isInternship = titleLower.includes("intern") || titleLower.includes("trainee");

      // Create normalized job
      const normalizedJob: Job = {
        id: `gj_${job.job_id || index}_${Date.now()}`,
        title: job.title,
        company: job.company_name,
        location: job.location || "Unknown",
        description: job.description || "",
        applyLink: applyLinks[0]?.link || "",
        postedAt: job.detected_extensions?.posted_at,
        salary: job.detected_extensions?.salary,
        jobType: job.detected_extensions?.schedule_type,
        remote: locationLower.includes("remote"),
        source: "serpapi" as JobSource,
        skills: [],
      };

      // Categorize by best match (prioritize specific over general)
      if (hasLinkedIn) {
        const linkedInLink = applyLinks.find(opt => opt.link?.includes("linkedin.com"))?.link;
        result.linkedIn.push({
          ...normalizedJob,
          id: `linkedin_${job.job_id || index}_${Date.now()}`,
          applyLink: linkedInLink || normalizedJob.applyLink,
          source: "linkedin",
        });
      }
      
      if (hasIndeed) {
        const indeedLink = applyLinks.find(opt => opt.link?.includes("indeed.com") || opt.link?.includes("indeed.co"))?.link;
        result.indeed.push({
          ...normalizedJob,
          id: `indeed_${job.job_id || index}_${Date.now()}`,
          applyLink: indeedLink || normalizedJob.applyLink,
          source: "indeed",
        });
      }
      
      if (hasGlassdoor) {
        const glassdoorLink = applyLinks.find(opt => opt.link?.includes("glassdoor.com"))?.link;
        result.glassdoor.push({
          ...normalizedJob,
          id: `glassdoor_${job.job_id || index}_${Date.now()}`,
          applyLink: glassdoorLink || normalizedJob.applyLink,
          source: "glassdoor",
        });
      }
      
      if (isBigTech) {
        let techSource: JobSource = "google";
        if (companyLower.includes("microsoft")) techSource = "microsoft";
        else if (companyLower.includes("amazon")) techSource = "amazon";
        else if (companyLower.includes("apple")) techSource = "apple";
        else if (companyLower.includes("meta") || companyLower.includes("facebook")) techSource = "meta";
        
        result.bigTech.push({
          ...normalizedJob,
          id: `${techSource}_${job.job_id || index}_${Date.now()}`,
          source: techSource,
        });
      }
      
      if (hasNaukri) {
        const naukriLink = applyLinks.find(opt => opt.link?.includes("naukri.com"))?.link;
        result.naukri.push({
          ...normalizedJob,
          id: `naukri_${job.job_id || index}_${Date.now()}`,
          applyLink: naukriLink || normalizedJob.applyLink,
          source: "naukri",
        });
      }
      
      if (hasInternshala || (isInternship && isIndianLocation)) {
        const internshalaLink = applyLinks.find(opt => opt.link?.includes("internshala.com"))?.link;
        result.internshala.push({
          ...normalizedJob,
          id: `internshala_${job.job_id || index}_${Date.now()}`,
          applyLink: internshalaLink || normalizedJob.applyLink,
          source: "internshala",
          jobType: "Internship",
        });
      }
      
      if (hasIndianBoard || isIndianLocation) {
        result.indianJobs.push({
          ...normalizedJob,
          id: `indian_${job.job_id || index}_${Date.now()}`,
          source: "naukri", // Generic Indian source
        });
      }
      
      // Add to "other" if not categorized elsewhere
      if (!hasLinkedIn && !hasIndeed && !hasGlassdoor && !isBigTech && !hasNaukri && !hasInternshala && !hasIndianBoard && !isIndianLocation) {
        result.other.push(normalizedJob);
      }
    });

    console.log(`[GoogleJobs] Categorized: LinkedIn(${result.linkedIn.length}), Indeed(${result.indeed.length}), Glassdoor(${result.glassdoor.length}), BigTech(${result.bigTech.length}), Indian(${result.indianJobs.length}), Naukri(${result.naukri.length}), Internshala(${result.internshala.length})`);

    return result;
  } catch (error: any) {
    console.error("[GoogleJobs] Error:", error.message);
    return result;
  }
}

/**
 * Fetch jobs from additional sources
 * Categories:
 * - bigtech: Google, Microsoft, Amazon, Apple, Meta, LinkedIn, Indeed, Glassdoor
 * - indian: Naukri, Internshala, FoundIt, Wellfound
 * - remote: RemoteOK, Remotive, FlexJobs, WeWorkRemotely
 * - all: All sources combined
 * 
 * NEW: Uses Direct Google Search for LinkedIn, Indeed, Naukri etc.
 */
export async function fetchAdditionalJobs(params: AdditionalSourcesParams): Promise<Job[]> {
  const { query, location, limit = 50, category = "all" } = params;
  const allJobs: Job[] = [];
  const limitPerSource = Math.ceil(limit / 10);

  console.log(`[AdditionalSources] Fetching from category: ${category}, location: ${location}`);

  // Check if this is an Indian search
  const isIndianSearch = INDIAN_LOCATIONS.some(loc => 
    location?.toLowerCase().includes(loc)
  );

  // 1. Direct search for LinkedIn, Indeed, Naukri, etc. using Google Search
  // This gives REAL job links from these sites
  const directSearchPromise = (category === "bigtech" || category === "indian" || category === "all")
    ? fetchDirectJobsFromAllSites({ 
        query, 
        location: location || "India", 
        limit: limitPerSource 
      }).catch((e) => {
        console.error("[AdditionalSources] Direct search error:", e.message);
        return {
          linkedin: [] as Job[],
          indeed: [] as Job[],
          glassdoor: [] as Job[],
          naukri: [] as Job[],
          internshala: [] as Job[],
          bigTech: [] as Job[],
        };
      })
    : Promise.resolve({
        linkedin: [] as Job[],
        indeed: [] as Job[],
        glassdoor: [] as Job[],
        naukri: [] as Job[],
        internshala: [] as Job[],
        bigTech: [] as Job[],
      });

  // 2. Google Jobs API for additional results
  const googleJobsPromise = (category === "bigtech" || category === "indian" || category === "all")
    ? fetchGoogleJobsOptimized({ query, location, isIndianSearch })
    : Promise.resolve({
        linkedIn: [], indeed: [], glassdoor: [], bigTech: [],
        indianJobs: [], naukri: [], internshala: [], other: []
      });

  // 3. Free API promises (these don't use SerpAPI)
  const freeApiPromises: Promise<Job[]>[] = [];

  // Remote Job Boards (free APIs)
  if (category === "remote" || category === "all") {
    freeApiPromises.push(
      fetchRemoteOkJobs({ query, limit: limitPerSource }).catch(() => []),
      fetchRemotiveJobs({ query, limit: limitPerSource }).catch(() => [])
    );
    
    // FlexJobs and WeWorkRemotely may have issues, wrap in catch
    freeApiPromises.push(
      fetchFlexJobsJobs({ query, limit: limitPerSource }).catch(() => []),
      fetchWeWorkRemotelyJobs({ query, limit: limitPerSource }).catch(() => [])
    );
  }

  // The Muse and Adzuna (have their own APIs)
  if (category === "bigtech" || category === "all") {
    freeApiPromises.push(
      fetchMuseJobs({ query, location, limit: limitPerSource }).catch(() => []),
      fetchAdzunaJobs({ query, location, limit: limitPerSource }).catch(() => [])
    );
  }

  // Execute all fetches in parallel
  const [directJobs, googleJobs, ...freeApiResults] = await Promise.all([
    directSearchPromise,
    googleJobsPromise,
    ...freeApiPromises
  ]);

  // ADD DIRECT SEARCH RESULTS FIRST (these are the real LinkedIn, Indeed, etc. links)
  console.log(`[AdditionalSources] Direct search: LinkedIn(${directJobs.linkedin.length}), Indeed(${directJobs.indeed.length}), Glassdoor(${directJobs.glassdoor.length}), Naukri(${directJobs.naukri.length}), Internshala(${directJobs.internshala.length}), BigTech(${directJobs.bigTech.length})`);
  
  if (category === "bigtech" || category === "all") {
    allJobs.push(...directJobs.linkedin);
    allJobs.push(...directJobs.indeed);
    allJobs.push(...directJobs.glassdoor);
    allJobs.push(...directJobs.bigTech);
  }

  if (category === "indian" || category === "all") {
    allJobs.push(...directJobs.naukri);
    allJobs.push(...directJobs.internshala);
  }

  // Add Google Jobs results (supplementary)
  if (category === "bigtech" || category === "all") {
    allJobs.push(...googleJobs.linkedIn.slice(0, limitPerSource));
    allJobs.push(...googleJobs.indeed.slice(0, limitPerSource));
    allJobs.push(...googleJobs.glassdoor.slice(0, limitPerSource));
    allJobs.push(...googleJobs.bigTech.slice(0, limitPerSource));
  }

  if (category === "indian" || category === "all") {
    allJobs.push(...googleJobs.naukri.slice(0, limitPerSource));
    allJobs.push(...googleJobs.internshala.slice(0, limitPerSource));
    allJobs.push(...googleJobs.indianJobs.slice(0, limitPerSource));
  }

  // Add "other" jobs if we need more
  if (allJobs.length < limit / 2) {
    allJobs.push(...googleJobs.other.slice(0, limitPerSource));
  }

  // Add free API results - but filter for India if this is an Indian search
  for (const jobs of freeApiResults) {
    if (isIndianSearch) {
      // Filter remote jobs to only include those that explicitly allow India or are worldwide
      const filteredJobs = jobs.filter(job => {
        const locationLower = job.location?.toLowerCase() || "";
        // Allow jobs that are:
        // 1. In India
        // 2. Worldwide/anywhere
        // 3. Explicitly remote (these are typically open to India)
        return INDIAN_LOCATIONS.some(loc => locationLower.includes(loc)) ||
               locationLower.includes("worldwide") ||
               locationLower.includes("anywhere") ||
               locationLower.includes("global") ||
               (locationLower === "remote" && !locationLower.includes("usa") && !locationLower.includes("us only"));
      });
      allJobs.push(...filteredJobs);
      console.log(`[AdditionalSources] India filter: ${jobs.length} → ${filteredJobs.length} jobs`);
    } else {
      allJobs.push(...jobs);
    }
  }

  console.log(`[AdditionalSources] Total fetched: ${allJobs.length} jobs`);

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
