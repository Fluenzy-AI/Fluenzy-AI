// src/lib/jobs/matcher.ts
import { Job, JobMatch } from "@/types/jobs";

/**
 * Calculate base match score when no user skills available
 * Uses job title, description, and search query matching
 */
function calculateBaseMatch(job: Job, searchQuery?: string): number {
  // Base score - job exists and has required fields
  let score = 50;
  
  // Bonus for complete job data
  if (job.title) score += 5;
  if (job.company) score += 5;
  if (job.location) score += 5;
  if (job.description && job.description.length > 100) score += 10;
  if (job.applyLink) score += 5;
  if (job.salary) score += 5;
  
  // If search query provided, check relevance
  if (searchQuery) {
    const searchTerms = searchQuery.toLowerCase().split(/\s+/);
    const jobText = `${job.title} ${job.company} ${job.description}`.toLowerCase();
    
    let matchedTerms = 0;
    for (const term of searchTerms) {
      if (term.length >= 3 && jobText.includes(term)) {
        matchedTerms++;
      }
    }
    
    // Add score based on matched terms
    const termMatchRatio = searchTerms.length > 0 ? matchedTerms / searchTerms.length : 0;
    score += Math.round(termMatchRatio * 15);
  }
  
  return Math.min(score, 100);
}

/**
 * Free tier: keyword matching with proper missing skills calculation
 * Enhanced to provide meaningful scores even without user skills
 */
export function keywordMatch(job: Job, userSkills: string[], searchQuery?: string): JobMatch {
  // If no user skills, calculate base match from job quality
  if (userSkills.length === 0) {
    const baseScore = calculateBaseMatch(job, searchQuery);
    return { 
      ...job, 
      matchScore: baseScore, 
      matchedSkills: [], 
      missingSkills: [] 
    };
  }

  const searchText = `${job.title} ${job.description}`.toLowerCase();
  
  const matchedSkills = userSkills.filter(skill => 
    searchText.includes(skill.toLowerCase())
  );
  
  const missingSkills = userSkills.filter(skill => 
    !searchText.includes(skill.toLowerCase())
  );
  
  const matchScore = Math.round((matchedSkills.length / userSkills.length) * 100);

  return { 
    ...job, 
    matchScore, 
    matchedSkills, 
    missingSkills 
  };
}

/**
 * Paid tier: Gemini AI matching with improved timeout and error handling
 */
export async function geminiMatch(job: Job, userSkills: string[], searchQuery?: string): Promise<JobMatch> {
  if (userSkills.length === 0) {
    // Use base matching when no skills
    const baseScore = calculateBaseMatch(job, searchQuery);
    return { 
      ...job, 
      matchScore: baseScore, 
      matchedSkills: [], 
      missingSkills: [] 
    };
  }

  const prompt = `
You are a career assistant. Compare these user skills with the job description.
User skills: ${userSkills.join(", ")}
Job title: ${job.title}
Job description: ${job.description.slice(0, 1500)}

Return ONLY valid JSON (no markdown, no explanation):
{
  "matchScore": 0-100,
  "matchedSkills": ["skill1", "skill2"],
  "missingSkills": ["skill3", "skill4"]
}
`;

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 12000); // 12 second timeout

  try {
    const res = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent?key=${process.env.GEMINI_API_KEY}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ 
          contents: [{ parts: [{ text: prompt }] }],
          generationConfig: {
            temperature: 0.1,
            maxOutputTokens: 256,
          }
        }),
        signal: controller.signal,
      }
    );
    
    clearTimeout(timeoutId);
    
    if (!res.ok) {
      console.warn(`[Matcher] Gemini API error: ${res.status}`);
      return keywordMatch(job, userSkills);
    }
    
    const data = await res.json();
    const text = data.candidates?.[0]?.content?.parts?.[0]?.text;
    
    if (!text) {
      console.warn("[Matcher] No response from Gemini");
      return keywordMatch(job, userSkills);
    }
    
    // Parse JSON, handling potential markdown code blocks
    const cleanText = text.replace(/```json|```/g, "").trim();
    const parsed = JSON.parse(cleanText);
    
    return { 
      ...job, 
      matchScore: parsed.matchScore ?? 0,
      matchedSkills: parsed.matchedSkills ?? [],
      missingSkills: parsed.missingSkills ?? [],
    };
  } catch (error: any) {
    clearTimeout(timeoutId);
    
    if (error.name === "AbortError") {
      console.warn(`[Matcher] Gemini timeout for job: ${job.id}`);
    } else {
      console.warn(`[Matcher] Gemini error for job ${job.id}:`, error.message);
    }
    
    // Graceful fallback to keyword matching
    return keywordMatch(job, userSkills, searchQuery);
  }
}

/**
 * Match all jobs using keyword or AI matching based on plan
 */
export async function matchJobs(
  jobs: Job[], 
  userSkills: string[], 
  useAI: boolean,
  searchQuery?: string
): Promise<JobMatch[]> {
  console.log(`[Matcher] Processing ${jobs.length} jobs with ${userSkills.length} skills (AI: ${useAI})`);
  
  if (jobs.length === 0) return [];
  
  const results = await Promise.all(
    jobs.map(job => 
      useAI 
        ? geminiMatch(job, userSkills, searchQuery) 
        : Promise.resolve(keywordMatch(job, userSkills, searchQuery))
    )
  );
  
  // Sort by match score descending
  return results.sort((a, b) => b.matchScore - a.matchScore);
}
