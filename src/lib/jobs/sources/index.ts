// src/lib/jobs/sources/index.ts
// Export all job source services

// Free APIs (No API key needed)
export { fetchRemoteOkJobs } from "./remoteOkService";
export { fetchRemotiveJobs } from "./remotiveService";
export { fetchMuseJobs } from "./theMuseService";

// Adzuna API (Free with registration)
export { fetchAdzunaJobs } from "./adzunaService";

// SerpAPI-based services (uses SERP_API_KEY)
export { fetchLinkedInJobs } from "./linkedinSerpService";
export { fetchIndeedJobs } from "./indeedSerpService";
export { fetchGlassdoorJobs } from "./glassdoorSerpService";
export { fetchNaukriJobs } from "./naukriSerpService";
export { fetchInternshalaJobs } from "./internshalaService";
export { fetchFoundItJobs } from "./foundItService";
export { fetchWellfoundJobs } from "./wellfoundService";
export { fetchFlexJobsJobs, fetchWeWorkRemotelyJobs } from "./flexJobsService";
export { 
  fetchBigTechJobs, 
  fetchGoogleJobs, 
  fetchMicrosoftJobs, 
  fetchAmazonJobs, 
  fetchAppleJobs, 
  fetchMetaJobs 
} from "./bigTechService";

// Source types
export type AdditionalJobSource = 
  | "remoteok" 
  | "remotive" 
  | "themuse" 
  | "adzuna"
  | "linkedin" 
  | "indeed" 
  | "glassdoor"
  | "naukri" 
  | "internshala" 
  | "foundit"
  | "wellfound"
  | "flexjobs"
  | "weworkremotely"
  | "google"
  | "microsoft"
  | "amazon"
  | "apple"
  | "meta";
