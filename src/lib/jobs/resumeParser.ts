// src/lib/jobs/resumeParser.ts

export async function extractTextFromPDF(buffer: Buffer): Promise<string> {
  console.log("[Resume] Starting PDF extraction");
  
  // Skip text extraction for now - resume upload still works
  // File gets uploaded to R2, job search works without text
  console.log("[Resume] Skipping text extraction (resume still uploaded to R2)");
  return "";
}

export async function extractSkillsWithGemini(resumeText: string): Promise<string[]> {
  if (!resumeText || resumeText.length < 50) {
    console.log("[Resume] No text available, skipping skill extraction");
    return [];
  }
  
  if (!process.env.GEMINI_API_KEY) {
    console.log("[Resume] No Gemini API key, using fallback");
    return fallbackKeywordExtract(resumeText);
  }
  
  const prompt = `
Extract technical and professional skills from this resume text.
Return ONLY a JSON array of skill strings. No explanation.
Example: ["Python", "React", "Project Management", "SQL"]

Resume text:
${resumeText.slice(0, 3000)}
`;

  try {
    const res = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent?key=${process.env.GEMINI_API_KEY}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ contents: [{ parts: [{ text: prompt }] }] }),
      }
    );
    
    const data = await res.json();
    const text = data.candidates?.[0]?.content?.parts?.[0]?.text;
    if (!text) throw new Error("No response");
    
    return JSON.parse(text.replace(/```json|```/g, "").trim());
  } catch (err) {
    console.warn("[Resume] Gemini failed, using fallback:", err);
    return fallbackKeywordExtract(resumeText);
  }
}

function fallbackKeywordExtract(text: string): string[] {
  const TECH_KEYWORDS = [
    "JavaScript", "TypeScript", "Python", "Java", "React", "Next.js", "Node.js",
    "SQL", "MongoDB", "PostgreSQL", "Docker", "Kubernetes", "AWS", "Azure", "GCP",
    "Git", "REST", "GraphQL", "Redux", "Tailwind", "CSS", "HTML", "Figma", "Agile",
    "Machine Learning", "Data Science", "AI", "Cloud", "DevOps", "CI/CD",
  ];
  return TECH_KEYWORDS.filter(k => text.toLowerCase().includes(k.toLowerCase()));
}
