// src/lib/jobs/jsearch.ts
import { Job } from "@/types/jobs";
import { normalizeJSearch } from "./normalizer";

interface FetchParams { 
  query: string; 
  location?: string; 
  limit?: number; 
  page?: number; 
}

export async function fetchJSearchJobs({ query, location, limit = 50, page = 1 }: FetchParams): Promise<Job[]> {
  const params = new URLSearchParams({
    query: location ? `${query} in ${location}` : query,
    page: String(page),
    num_pages: "1",
  });

  console.log("[JSearch] Fetching:", `https://jsearch.p.rapidapi.com/search?${params}`);

  try {
    const res = await fetch(`https://jsearch.p.rapidapi.com/search?${params}`, {
      headers: {
        "X-RapidAPI-Key": process.env.RAPIDAPI_KEY!,
        "X-RapidAPI-Host": process.env.RAPIDAPI_HOST || "jsearch.p.rapidapi.com",
      },
      cache: "no-store",
    });

    console.log("[JSearch] Response status:", res.status);

    if (!res.ok) {
      const errText = await res.text();
      console.error(`[JSearch] API error ${res.status}:`, errText);
      return [];
    }

    const data = await res.json();
    console.log("[JSearch] Jobs found:", data.data?.length ?? 0);
    return (data.data ?? []).slice(0, limit).map(normalizeJSearch);
  } catch (error) {
    console.error("[JSearch] Fetch error:", error);
    return [];
  }
}
