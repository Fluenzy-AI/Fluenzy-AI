// src/lib/jobs/resumeParser.ts

export async function extractTextFromPDF(buffer: Buffer): Promise<string> {
  console.log("[Resume] Starting PDF extraction");
  
  // Try Adobe PDF Services first if credentials available
  if (process.env.ADOBE_PDF_SERVICES_CLIENT_ID && process.env.ADOBE_PDF_SERVICES_CLIENT_SECRET) {
    try {
      console.log("[Resume] Trying Adobe PDF Services");
      return await extractWithAdobe(buffer);
    } catch (err: any) {
      console.warn("[Resume] Adobe PDF failed:", err.message);
    }
  }
  
  // Try pdf-parse as fallback
  try {
    console.log("[Resume] Using pdf-parse");
    const pdfParse = require("pdf-parse/lib/pdf-parse");
    const data = await pdfParse(buffer);
    
    if (!data || !data.text) {
      throw new Error("No text extracted from PDF");
    }
    
    console.log(`[Resume] Extracted ${data.text.length} characters`);
    return data.text;
  } catch (err: any) {
    console.error("[Resume] pdf-parse failed:", err.message);
    
    // If pdf-parse fails, try simple text extraction
    try {
      const text = buffer.toString('utf8');
      if (text && text.length > 100) {
        console.log("[Resume] Using fallback text extraction");
        return text;
      }
    } catch {
      // Ignore
    }
    
    throw new Error("Could not extract text from PDF. Please try a different PDF file.");
  }
}

async function extractWithAdobe(buffer: Buffer): Promise<string> {
  // Adobe PDF Services Extract API
  const clientId = process.env.ADOBE_PDF_SERVICES_CLIENT_ID!;
  const clientSecret = process.env.ADOBE_PDF_SERVICES_CLIENT_SECRET!;
  
  // Get access token
  const tokenRes = await fetch("https://pdf-services.adobe.io/token", {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: new URLSearchParams({
      client_id: clientId,
      client_secret: clientSecret,
    }),
  });
  
  if (!tokenRes.ok) {
    throw new Error("Adobe auth failed");
  }
  
  const { access_token } = await tokenRes.json();
  
  // Upload PDF
  const uploadRes = await fetch("https://pdf-services.adobe.io/assets", {
    method: "POST",
    headers: {
      "Authorization": `Bearer ${access_token}`,
      "Content-Type": "application/pdf",
    },
    body: buffer,
  });
  
  if (!uploadRes.ok) {
    throw new Error("Adobe upload failed");
  }
  
  const { assetID } = await uploadRes.json();
  
  // Extract text
  const extractRes = await fetch("https://pdf-services.adobe.io/operation/extractpdf", {
    method: "POST",
    headers: {
      "Authorization": `Bearer ${access_token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      assetID,
      elementsToExtract: ["text"],
    }),
  });
  
  if (!extractRes.ok) {
    throw new Error("Adobe extract failed");
  }
  
  const result = await extractRes.json();
  return result.elements?.map((e: any) => e.Text || "").join("\n") || "";
}

export async function extractSkillsWithGemini(resumeText: string): Promise<string[]> {
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
  } catch {
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
