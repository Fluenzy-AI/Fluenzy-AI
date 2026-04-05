// src/lib/jobs/arbeitnow.ts
import { Job } from "@/types/jobs";
import { normalizeArbeitNow } from "./normalizer";
import { fetchRemotiveJobs } from "./naukri-scraper";

interface FetchParams { 
  query: string; 
  location?: string; 
  limit?: number; 
}

export async function fetchArbeitNowJobs({ query, location, limit = 10 }: FetchParams): Promise<Job[]> {
  // If location includes India or Remote, use Remotive API
  if (location && (location.toLowerCase().includes('india') || location.toLowerCase() === 'remote')) {
    console.log("[ArbeitNow] Detected India/Remote location, using Remotive API");
    return fetchRemotiveJobs({ query, location, limit });
  }

  // Otherwise use ArbeitNow for European/specific country jobs
  const base = process.env.ARBEITNOW_BASE_URL || "https://www.arbeitnow.com/api/job-board-api";
  const params = new URLSearchParams({ search: query });
  if (location) params.set("location", location);

  const url = `${base}?${params}`;
  console.log("[ArbeitNow] Fetching:", url);

  try {
    const res = await fetch(url, {
      headers: { Accept: "application/json" },
      cache: "no-store",
    });

    console.log("[ArbeitNow] Response status:", res.status);

    if (!res.ok) {
      const errText = await res.text();
      console.error(`[ArbeitNow] API error ${res.status}:`, errText);
      return [];
    }

    const data = await res.json();
    console.log("[ArbeitNow] Jobs found:", data.data?.length ?? 0);
    return (data.data ?? []).slice(0, limit).map(normalizeArbeitNow);
  } catch (error) {
    console.error("[ArbeitNow] Fetch error:", error);
    return [];
  }
}
