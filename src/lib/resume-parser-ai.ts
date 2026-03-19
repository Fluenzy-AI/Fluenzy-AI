/**
 * AI-Powered Resume Parser
 * Converts raw resume text into structured ATS-optimized JSON format
 * Uses Google Gemini for intelligent extraction
 */

import { GoogleGenerativeAI } from "@google/generative-ai";

// Initialize Gemini
const genAI = new GoogleGenerativeAI(
  process.env.GEMINI_API_KEY || process.env.NEXT_PUBLIC_GEMINI_API_KEY || ""
);

// Output interface matching the required ATS format with enhanced skill categorization
export interface ParsedResumeStructured {
  personal_info: {
    full_name: string | null;
    email: string | null;
    phone: string | null;
    location: string | null;
    linkedin: string | null;
    github: string | null;
    portfolio: string | null;
    leetcode: string | null;
  };
  summary: string | null;
  skills: {
    languages: string[];
    frameworks: string[];
    databases: string[];
    tools: string[];
    cloud: string[];
    concepts: string[];
    // Legacy fields for backward compatibility
    technical: string[];
    soft: string[];
  };
  education: Array<{
    degree: string | null;
    field: string | null;
    institution: string | null;
    start_date: string | null;
    end_date: string | null;
    grade: string | null;
  }>;
  experience: Array<{
    job_title: string | null;
    company: string | null;
    location: string | null;
    start_date: string | null;
    end_date: string | null;
    responsibilities: string[];
    technologies: string[];
  }>;
  projects: Array<{
    project_name: string | null;
    description: string | null;
    technologies: string[];
    github_link: string | null;
    live_link: string | null;
  }>;
  certifications: Array<{
    name: string | null;
    issuer: string | null;
    date: string | null;
  }>;
  achievements: string[];
  keywords: string[];
  ats_score_ready: boolean;
  // Enhanced metadata
  meta: {
    detected_role: string | null;
    seniority_level: "Fresher" | "Junior" | "Mid" | "Senior" | null;
    total_skills_count: number;
    total_experience_years: number | null;
  };
  // Legacy fields for backward compatibility
  seniority_level: "Fresher" | "Junior" | "Mid" | "Senior" | null;
  total_experience_years: number | null;
  primary_role: string | null;
}

const RESUME_PARSER_PROMPT = `You are a highly accurate Resume Parsing Engine designed for ATS systems.

Your job is to extract, normalize, and structure resume data from raw extracted text.

The input may contain:
- Broken formatting
- Line breaks in wrong places
- Mixed sections
- Duplicate or noisy text

You MUST handle all of this intelligently.

--------------------------------------------------
PRIMARY GOAL:
Convert the resume into COMPLETE and ACCURATE structured JSON.
DO NOT miss any information.

--------------------------------------------------
CRITICAL EXTRACTION RULES:

1. PERSONAL INFO:
- Extract full name (topmost large text)
- Extract ALL links (LinkedIn, GitHub, LeetCode, Portfolio)
- Normalize phone to international format (+91...)

2. SKILLS (VERY IMPORTANT):
- DO NOT miss skills
- Extract ALL skills from:
  - Technical Skills section
  - Projects tech stack
  - Experience technologies
- Categorize strictly into:
  {
    "languages": [],     // Java, Python, JavaScript, TypeScript, C, C++, C#, Go, etc.
    "frameworks": [],    // React.js, Next.js, Node.js, Express.js, Angular, Vue, Django, Flask, etc.
    "databases": [],     // MongoDB, PostgreSQL, MySQL, Redis, etc.
    "tools": [],         // Git, GitHub, Docker, SQL, etc.
    "cloud": [],         // AWS, Azure, GCP, Render, etc.
    "concepts": []       // DSA, OOP, System Design, REST API, JWT, RBAC, Design Patterns, etc.
  }

⚠️ If at least 20+ skills exist → ensure they are ALL captured

--------------------------------------------------
3. EXPERIENCE:
- Extract ALL internships/jobs
- If duration missing → infer from context or leave null
- Convert bullet points into strong action-based statements
- Extract technologies used in each role

--------------------------------------------------
4. PROJECTS (VERY IMPORTANT):
- Extract ALL projects
- Extract:
  - Name
  - Tech stack (MANDATORY)
  - Description (clean + impactful)
  - Links (GitHub / Live)

- ALSO extract technologies from projects into skills section

--------------------------------------------------
5. EDUCATION:
- Extract degree, college, CGPA
- Normalize CGPA properly (e.g., 7.39/10)

--------------------------------------------------
6. CERTIFICATIONS:
- Extract issuer (Microsoft, Infosys, GeeksforGeeks, etc.)
- Clean long names

--------------------------------------------------
7. KEYWORDS (ATS OPTIMIZATION):
Generate 20–40 ATS keywords from:
- Skills
- Tech stack
- Roles
- Domains

--------------------------------------------------
8. INTELLIGENT PROCESSING:
- Deduplicate skills
- Fix broken words (e.g., "Postgre SQL" → "PostgreSQL")
- Merge similar terms (Node + Node.js → Node.js)
- Detect role (e.g., "Full Stack Developer")
- Detect level (e.g., "Fresher / Intern")

--------------------------------------------------
OUTPUT FORMAT (STRICT JSON ONLY):

{
  "personal_info": {
    "full_name": "",
    "email": "",
    "phone": "",
    "location": "",
    "linkedin": "",
    "github": "",
    "portfolio": "",
    "leetcode": ""
  },
  "summary": "",
  "skills": {
    "languages": [],
    "frameworks": [],
    "databases": [],
    "tools": [],
    "cloud": [],
    "concepts": [],
    "technical": [],
    "soft": []
  },
  "experience": [
    {
      "job_title": "",
      "company": "",
      "location": "",
      "start_date": "",
      "end_date": "",
      "responsibilities": [],
      "technologies": []
    }
  ],
  "projects": [
    {
      "project_name": "",
      "description": "",
      "technologies": [],
      "github_link": "",
      "live_link": ""
    }
  ],
  "education": [
    {
      "degree": "",
      "field": "",
      "institution": "",
      "start_date": "",
      "end_date": "",
      "grade": ""
    }
  ],
  "certifications": [
    {
      "name": "",
      "issuer": "",
      "date": ""
    }
  ],
  "achievements": [],
  "keywords": [],
  "ats_score_ready": true,
  "meta": {
    "detected_role": "",
    "seniority_level": "Fresher|Junior|Mid|Senior",
    "total_skills_count": 0,
    "total_experience_years": 0
  }
}

--------------------------------------------------
STRICT RULES:

❌ DO NOT miss any skills
❌ DO NOT output partial data
❌ DO NOT hallucinate
❌ DO NOT return text explanation
✅ ONLY VALID JSON

--------------------------------------------------
QUALITY CHECK BEFORE OUTPUT:

- At least 15+ skills extracted? (if not → reprocess)
- Projects include tech stack? (if not → reprocess)
- Experience bullets cleaned? (if not → fix)

--------------------------------------------------
RESUME TEXT TO PARSE:
`;

/**
 * Parse resume text using AI (Gemini)
 */
export async function parseResumeWithAI(
  rawText: string
): Promise<{ data: ParsedResumeStructured | null; error?: string }> {
  try {
    if (!rawText || rawText.trim().length < 50) {
      return {
        data: null,
        error: "Resume text too short or empty",
      };
    }

    const model = genAI.getGenerativeModel({
      model: "gemini-1.5-flash",
      generationConfig: {
        temperature: 0.1,
        topP: 0.8,
        maxOutputTokens: 8192,
        responseMimeType: "application/json",
      },
    });

    const prompt = RESUME_PARSER_PROMPT + rawText;

    const result = await model.generateContent(prompt);
    const response = await result.response;
    const text = response.text();

    // Parse the JSON response
    let parsedData: ParsedResumeStructured;
    try {
      // Clean up any markdown code blocks if present
      let cleanedText = text.trim();
      if (cleanedText.startsWith("```json")) {
        cleanedText = cleanedText.slice(7);
      }
      if (cleanedText.startsWith("```")) {
        cleanedText = cleanedText.slice(3);
      }
      if (cleanedText.endsWith("```")) {
        cleanedText = cleanedText.slice(0, -3);
      }
      cleanedText = cleanedText.trim();

      parsedData = JSON.parse(cleanedText);
    } catch (parseError) {
      console.error("[AI Resume Parser] JSON parse error:", parseError);
      return {
        data: null,
        error: "Failed to parse AI response as JSON",
      };
    }

    // Validate and ensure proper structure
    const validated = validateAndCleanParsedData(parsedData);

    return { data: validated };
  } catch (error) {
    console.error("[AI Resume Parser Error]", error);
    return {
      data: null,
      error: error instanceof Error ? error.message : "Unknown error",
    };
  }
}

/**
 * Validate and clean the parsed data to ensure proper structure
 */
function validateAndCleanParsedData(
  data: Partial<ParsedResumeStructured>
): ParsedResumeStructured {
  // Extract skills from all categories
  const languages = Array.isArray(data.skills?.languages) ? data.skills.languages : [];
  const frameworks = Array.isArray(data.skills?.frameworks) ? data.skills.frameworks : [];
  const databases = Array.isArray(data.skills?.databases) ? data.skills.databases : [];
  const tools = Array.isArray(data.skills?.tools) ? data.skills.tools : [];
  const cloud = Array.isArray(data.skills?.cloud) ? data.skills.cloud : [];
  const concepts = Array.isArray(data.skills?.concepts) ? data.skills.concepts : [];
  const technical = Array.isArray(data.skills?.technical) ? data.skills.technical : [];
  const soft = Array.isArray(data.skills?.soft) ? data.skills.soft : [];

  // Combine all technical skills for the legacy field
  const allTechnical = Array.from(new Set([...languages, ...frameworks, ...databases, ...tools, ...cloud, ...technical]));
  
  const totalSkillsCount = languages.length + frameworks.length + databases.length + 
                           tools.length + cloud.length + concepts.length;

  // Extract seniority from meta or root level
  const seniorityLevel = validateSeniorityLevel(
    data.meta?.seniority_level || data.seniority_level
  );
  
  // Extract experience years from meta or root level
  const totalExpYears = typeof data.meta?.total_experience_years === "number" 
    ? data.meta.total_experience_years 
    : (typeof data.total_experience_years === "number" ? data.total_experience_years : null);

  return {
    personal_info: {
      full_name: data.personal_info?.full_name || null,
      email: data.personal_info?.email || null,
      phone: data.personal_info?.phone || null,
      location: data.personal_info?.location || null,
      linkedin: data.personal_info?.linkedin || null,
      github: data.personal_info?.github || null,
      portfolio: data.personal_info?.portfolio || null,
      leetcode: (data.personal_info as any)?.leetcode || null,
    },
    summary: data.summary || null,
    skills: {
      languages,
      frameworks,
      databases,
      tools,
      cloud,
      concepts,
      technical: allTechnical,
      soft,
    },
    education: Array.isArray(data.education)
      ? data.education.map((edu) => ({
          degree: edu?.degree || null,
          field: edu?.field || null,
          institution: edu?.institution || null,
          start_date: edu?.start_date || null,
          end_date: edu?.end_date || null,
          grade: edu?.grade || null,
        }))
      : [],
    experience: Array.isArray(data.experience)
      ? data.experience.map((exp) => ({
          job_title: exp?.job_title || null,
          company: exp?.company || null,
          location: exp?.location || null,
          start_date: exp?.start_date || null,
          end_date: exp?.end_date || null,
          responsibilities: Array.isArray(exp?.responsibilities)
            ? exp.responsibilities
            : [],
          technologies: Array.isArray(exp?.technologies)
            ? exp.technologies
            : [],
        }))
      : [],
    projects: Array.isArray(data.projects)
      ? data.projects.map((proj: any) => ({
          project_name: proj?.project_name || null,
          description: proj?.description || null,
          technologies: Array.isArray(proj?.technologies)
            ? proj.technologies
            : [],
          github_link: proj?.github_link || proj?.link || null,
          live_link: proj?.live_link || null,
        }))
      : [],
    certifications: Array.isArray(data.certifications)
      ? data.certifications.map((cert) => ({
          name: cert?.name || null,
          issuer: cert?.issuer || null,
          date: cert?.date || null,
        }))
      : [],
    achievements: Array.isArray(data.achievements) ? data.achievements : [],
    keywords: Array.isArray(data.keywords) ? data.keywords : [],
    ats_score_ready: data.ats_score_ready !== false,
    meta: {
      detected_role: data.meta?.detected_role || data.primary_role || null,
      seniority_level: seniorityLevel,
      total_skills_count: totalSkillsCount,
      total_experience_years: totalExpYears,
    },
    // Legacy fields for backward compatibility
    seniority_level: seniorityLevel,
    total_experience_years: totalExpYears,
    primary_role: data.meta?.detected_role || data.primary_role || null,
  };
}

function validateSeniorityLevel(
  level: string | null | undefined
): "Fresher" | "Junior" | "Mid" | "Senior" | null {
  if (!level) return null;
  const normalized = level.toLowerCase();
  if (normalized.includes("fresh") || normalized.includes("entry")) return "Fresher";
  if (normalized.includes("junior") || normalized.includes("jr")) return "Junior";
  if (normalized.includes("mid") || normalized.includes("intermediate")) return "Mid";
  if (normalized.includes("senior") || normalized.includes("sr") || normalized.includes("lead")) return "Senior";
  return null;
}

/**
 * Fallback parser using regex patterns (no AI)
 * Used when AI parsing fails or is unavailable
 */
export function parseResumeWithRegex(rawText: string): ParsedResumeStructured {
  const text = rawText || "";
  const lowerText = text.toLowerCase();

  // Extract email
  const emailMatch = text.match(
    /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/
  );
  const email = emailMatch ? emailMatch[0] : null;

  // Extract phone
  const phoneMatch = text.match(
    /(\+?\d{1,3}[-.\s]?)?\(?\d{3,5}\)?[-.\s]?\d{3,4}[-.\s]?\d{4}/
  );
  const phone = phoneMatch ? phoneMatch[0] : null;

  // Extract LinkedIn
  const linkedinMatch = text.match(
    /(?:linkedin\.com\/in\/|linkedin:?\s*)([a-zA-Z0-9_-]+)/i
  );
  const linkedin = linkedinMatch
    ? `linkedin.com/in/${linkedinMatch[1]}`
    : null;

  // Extract GitHub
  const githubMatch = text.match(
    /(?:github\.com\/|github:?\s*)([a-zA-Z0-9_-]+)/i
  );
  const github = githubMatch ? `github.com/${githubMatch[1]}` : null;

  // Extract LeetCode
  const leetcodeMatch = text.match(
    /(?:leetcode\.com\/|leetcode:?\s*)([a-zA-Z0-9_-]+)/i
  );
  const leetcode = leetcodeMatch ? `leetcode.com/${leetcodeMatch[1]}` : null;

  // Extract name (usually at the beginning)
  const lines = text.split("\n").filter((l) => l.trim().length > 0);
  const nameLine = lines[0]?.trim() || null;
  const full_name =
    nameLine && nameLine.length < 50 && !nameLine.includes("@")
      ? nameLine
      : null;

  // Categorized skill keywords
  const languageKeywords = [
    "java", "python", "javascript", "typescript", "c++", "c#", "c",
    "go", "golang", "rust", "kotlin", "swift", "php", "ruby", "scala",
    "dart", "r", "matlab", "perl", "bash", "shell"
  ];

  const frameworkKeywords = [
    "react", "reactjs", "react.js", "next.js", "nextjs", "angular",
    "vue", "vuejs", "vue.js", "svelte", "node.js", "nodejs", "express",
    "expressjs", "express.js", "django", "flask", "fastapi", "spring",
    "springboot", "spring boot", "rails", "ruby on rails", "laravel",
    "nestjs", "nest.js", "nuxt", "nuxtjs", "gatsby", "remix",
    "tensorflow", "pytorch", "keras", "scikit-learn", "pandas", "numpy",
    "transformers", "prisma"
  ];

  const databaseKeywords = [
    "mongodb", "postgresql", "postgres", "mysql", "sql", "redis",
    "elasticsearch", "cassandra", "dynamodb", "firebase", "sqlite",
    "oracle", "mariadb", "neo4j", "couchdb"
  ];

  const toolKeywords = [
    "git", "github", "gitlab", "bitbucket", "docker", "kubernetes",
    "jenkins", "travis", "circleci", "postman", "jira", "confluence",
    "slack", "figma", "vs code", "visual studio", "intellij", "eclipse",
    "jupyter", "colab", "npm", "yarn", "webpack", "vite", "babel"
  ];

  const cloudKeywords = [
    "aws", "amazon web services", "azure", "gcp", "google cloud",
    "heroku", "vercel", "netlify", "render", "digitalocean",
    "ec2", "s3", "lambda", "cloudflare"
  ];

  const conceptKeywords = [
    "data structures", "dsa", "algorithms", "oop", "object oriented",
    "design patterns", "system design", "rest", "restful", "api",
    "graphql", "microservices", "ci/cd", "agile", "scrum",
    "jwt", "oauth", "rbac", "authentication", "authorization",
    "machine learning", "ml", "ai", "artificial intelligence",
    "deep learning", "nlp", "natural language processing",
    "computer vision", "devops", "solid principles"
  ];

  const softKeywords = [
    "leadership", "communication", "teamwork", "problem solving",
    "critical thinking", "time management", "project management",
    "collaboration", "adaptability", "creativity", "attention to detail",
    "analytical"
  ];

  // Extract skills by category
  const languages = languageKeywords.filter(skill => 
    new RegExp(`\\b${skill.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\b`, 'i').test(lowerText)
  );
  const frameworks = frameworkKeywords.filter(skill => 
    new RegExp(`\\b${skill.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\b`, 'i').test(lowerText)
  );
  const databases = databaseKeywords.filter(skill => 
    new RegExp(`\\b${skill.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\b`, 'i').test(lowerText)
  );
  const tools = toolKeywords.filter(skill => 
    new RegExp(`\\b${skill.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\b`, 'i').test(lowerText)
  );
  const cloud = cloudKeywords.filter(skill => 
    new RegExp(`\\b${skill.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\b`, 'i').test(lowerText)
  );
  const concepts = conceptKeywords.filter(skill => 
    new RegExp(`\\b${skill.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\b`, 'i').test(lowerText)
  );
  const soft = softKeywords.filter(skill => lowerText.includes(skill));

  // Combine all technical skills
  const allTechnical = Array.from(new Set([...languages, ...frameworks, ...databases, ...tools, ...cloud]));

  // Calculate total skills
  const totalSkillsCount = languages.length + frameworks.length + databases.length + 
                           tools.length + cloud.length + concepts.length;

  // Extract education patterns
  const degreePatterns = [
    /(?:bachelor|b\.?s\.?|b\.?e\.?|b\.?tech)/gi,
    /(?:master|m\.?s\.?|m\.?e\.?|m\.?tech|mba)/gi,
    /(?:ph\.?d|doctorate)/gi,
  ];
  const hasEducation = degreePatterns.some((pattern) => pattern.test(text));

  // Calculate experience years
  const yearMatches = text.match(/\d{4}/g) || [];
  const years = yearMatches.map(Number).filter((y) => y >= 2000 && y <= 2030);
  const experienceYears =
    years.length >= 2 ? Math.max(...years) - Math.min(...years) : null;

  const seniorityLevel = experienceYears === null
    ? null
    : experienceYears <= 1
      ? "Fresher"
      : experienceYears <= 3
        ? "Junior"
        : experienceYears <= 6
          ? "Mid"
          : "Senior";

  return {
    personal_info: {
      full_name,
      email,
      phone,
      location: null,
      linkedin,
      github,
      portfolio: null,
      leetcode,
    },
    summary: null,
    skills: {
      languages,
      frameworks,
      databases,
      tools,
      cloud,
      concepts,
      technical: allTechnical,
      soft,
    },
    education: hasEducation
      ? [
          {
            degree: null,
            field: null,
            institution: null,
            start_date: null,
            end_date: null,
            grade: null,
          },
        ]
      : [],
    experience: [],
    projects: [],
    certifications: [],
    achievements: [],
    keywords: Array.from(new Set([...allTechnical, ...concepts])),
    ats_score_ready: true,
    meta: {
      detected_role: null,
      seniority_level: seniorityLevel,
      total_skills_count: totalSkillsCount,
      total_experience_years: experienceYears,
    },
    seniority_level: seniorityLevel,
    total_experience_years: experienceYears,
    primary_role: null,
  };
}

/**
 * Main resume parsing function
 * Uses AI first, falls back to regex if AI fails
 */
export async function parseResumeStructured(
  rawText: string,
  useAI: boolean = true
): Promise<{
  data: ParsedResumeStructured;
  method: "ai" | "regex";
  error?: string;
}> {
  // Try AI parsing first
  if (useAI) {
    const aiResult = await parseResumeWithAI(rawText);
    if (aiResult.data) {
      return {
        data: aiResult.data,
        method: "ai",
      };
    }
    console.warn("[Resume Parser] AI parsing failed, falling back to regex");
  }

  // Fallback to regex parsing
  const regexResult = parseResumeWithRegex(rawText);
  return {
    data: regexResult,
    method: "regex",
    error: useAI ? "AI parsing failed, used regex fallback" : undefined,
  };
}
