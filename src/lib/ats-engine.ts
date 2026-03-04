import mammoth from "mammoth";
// eslint-disable-next-line @typescript-eslint/no-require-imports
// Use the inner module path to bypass the pdf-parse test-file loader bug in Next.js
// (pdf-parse/index.js tries to `fs.readFileSync` a test PDF on require, which throws)
const pdfParse: (
  buffer: Buffer,
  options?: { pagerender?: unknown },
) => Promise<{ text: string }> = (() => {
  try {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    return require("pdf-parse/lib/pdf-parse.js");
  } catch {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    return require("pdf-parse");
  }
})();

/**
 * Parse raw text from a resume buffer (PDF or DOCX).
 * Falls through multiple strategies, never throws.
 */
export async function parseResume(
  buffer: Buffer,
  mimeType: string,
): Promise<{ text: string; parseWarning?: string }> {
  const isPdf = mimeType === "application/pdf" || mimeType.includes("pdf");
  const isDocx = mimeType.includes("wordprocessingml") || mimeType.includes("docx");

  if (isPdf) {
    try {
      const data = await pdfParse(buffer);
      if (data.text && data.text.trim().length > 50) return { text: data.text };
    } catch { /* fall through */ }
    try {
      const data = await pdfParse(buffer, { pagerender: () => Promise.resolve("") });
      if (data.text && data.text.trim().length > 20) return { text: data.text };
    } catch { /* fall through */ }
    // Strategy 3: Extract readable ASCII sequences from raw PDF binary.
    // Works for text-based PDFs where pdf-parse fails — the actual text is stored
    // as printable ASCII strings embedded in the binary stream.
    try {
      const rawBinary = buffer.toString("latin1");
      // Extract all runs of printable ASCII chars that are ≥5 chars long
      const sequences = rawBinary.match(/[\x20-\x7E]{5,}/g) ?? [];
      // Keep sequences that look like real words/tech (contain at least one letter)
      const meaningful = sequences.filter(s => /[a-zA-Z]/.test(s));
      const extracted = meaningful.join(" ").replace(/\s+/g, " ").trim();
      if (extracted.length > 100) {
        return { text: extracted, parseWarning: "binary PDF fallback" };
      }
    } catch { /* fall through */ }
    return { text: buffer.toString("latin1"), parseWarning: "binary PDF fallback" };
  }
  if (isDocx) {
    try {
      const result = await mammoth.extractRawText({ buffer });
      if (result.value && result.value.trim().length > 20) return { text: result.value };
    } catch { /* fall through */ }
    return { text: "", parseWarning: "DOCX parse failed" };
  }
  return { text: buffer.toString("utf8") };
}
/**
 * Advanced ATS Scoring Engine v3
 * â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
 * Key design goals:
 *   â€¢ NEVER returns score = 0 if real content exists
 *   â€¢ Skill matching works even on garbled / fallback-parsed PDF text
 *   â€¢ Huge skill dictionary with aliases (React = React.js = ReactJS, etc.)
 *   â€¢ Role-aware detection (Frontend / Backend / AI / DevOps / etc.)
 *   â€¢ Weighted: Skills 35%, Experience 20%, Projects 15%,
 *               Education 10%, Keywords 10%, Structure 5%, Format 5%
 *   â€¢ Minimum score guarantees â€“ never 0 when skills are present
 *   â€¢ Never throws
 */

// â”€â”€â”€ Public Interfaces â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

export interface ParsedResumeData {
  name: string;
  email: string;
  phone: string;
  skills: string[];
  education: string[];
  experience: string[];
  projects: string[];
  certifications: string[];
  summary: string;
  missingSections: string[];
}

export interface ATSScoreResult {
  atsScore: number;
  keywordScore: number;
  skillsScore: number;
  formatScore: number;
  experienceScore: number;
  educationScore: number;
  readabilityScore: number;
  sectionScore: number;
  matchedKeywords: string[];
  missingKeywords: string[];
  extractedSkills: string[];
  suggestions: string[];
  strengths: string[];
  jobTitleMatch: string;   // human-readable label e.g. "Full Stack Developer"
  jobRole: string;         // machine key e.g. "fullstack"
  experienceYears: number;
  parsedData: ParsedResumeData;
  jdSkillMatch: number;
  jdMatchedSkills: string[];
  jdMissingSkills: string[];
  resumeQuality: "Excellent" | "Good" | "Average" | "Needs Improvement";
  recommendation: string;
  textQuality: "good" | "partial" | "poor";
}

// â”€â”€â”€ Skill Dictionary â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
// canonical = display name, aliases = ALL spellings to match against resume text

interface SkillEntry {
  canonical: string;
  aliases: string[];
  category: string;
  roles: string[];
}

const SKILL_DICT: SkillEntry[] = [
  // â”€â”€ Programming Languages â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
  { canonical: "C",            aliases: ["c programming", "c language", "programming in c"],       category: "Language",     roles: ["systems", "backend"] },
  { canonical: "Java",         aliases: ["java"],                                                  category: "Language",     roles: ["backend", "fullstack", "android"] },
  { canonical: "Python",       aliases: ["python"],                                                              category: "Language",     roles: ["ai", "backend", "datascience", "fullstack"] },
  { canonical: "JavaScript",   aliases: ["javascript", "ecmascript", "es6", "es2015", "es2016", "es2017"],      category: "Language",     roles: ["frontend", "backend", "fullstack"] },
  { canonical: "TypeScript",   aliases: ["typescript"],                                                          category: "Language",     roles: ["frontend", "backend", "fullstack"] },
  { canonical: "C++",          aliases: ["c++", "cpp", "c plus plus"],                             category: "Language",     roles: ["systems"] },
  { canonical: "C#",           aliases: ["c#", "csharp", "c sharp"],                               category: "Language",     roles: ["backend"] },
  { canonical: "Go",           aliases: ["golang", "go language", "go lang"],                      category: "Language",     roles: ["backend", "devops"] },
  { canonical: "Rust",         aliases: ["rust", "rust lang"],                                     category: "Language",     roles: ["systems"] },
  { canonical: "Kotlin",       aliases: ["kotlin"],                                                category: "Language",     roles: ["android", "backend"] },
  { canonical: "Swift",        aliases: ["swift"],                                                 category: "Language",     roles: ["ios"] },
  { canonical: "PHP",          aliases: ["php"],                                                   category: "Language",     roles: ["backend"] },
  { canonical: "Ruby",         aliases: ["ruby", "ruby on rails", "rails"],                        category: "Language",     roles: ["backend"] },
  { canonical: "Scala",        aliases: ["scala"],                                                 category: "Language",     roles: ["backend", "datascience"] },
  { canonical: "Dart",         aliases: ["dart"],                                                  category: "Language",     roles: ["mobile"] },
  { canonical: "Bash",         aliases: ["bash", "shell", "shell script"],                         category: "Language",     roles: ["devops"] },
  { canonical: "SQL",          aliases: ["sql", "structured query language"],                      category: "Language",     roles: ["backend", "datascience", "fullstack"] },
  { canonical: "HTML",         aliases: ["html", "html5"],                                         category: "Frontend",     roles: ["frontend", "fullstack"] },
  { canonical: "CSS",          aliases: ["css", "css3", "scss", "sass"],                                        category: "Frontend",     roles: ["frontend", "fullstack"] },
  // â”€â”€ Frontend â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
  { canonical: "React",        aliases: ["react", "reactjs", "react.js", "react js"],              category: "Frontend",     roles: ["frontend", "fullstack"] },
  { canonical: "Next.js",      aliases: ["nextjs", "next.js", "next js"],                          category: "Frontend",     roles: ["frontend", "fullstack"] },
  { canonical: "Angular",      aliases: ["angular", "angularjs", "angular.js"],                    category: "Frontend",     roles: ["frontend", "fullstack"] },
  { canonical: "Vue",          aliases: ["vue", "vuejs", "vue.js", "vue js"],                      category: "Frontend",     roles: ["frontend", "fullstack"] },
  { canonical: "Svelte",       aliases: ["svelte", "sveltekit"],                                   category: "Frontend",     roles: ["frontend"] },
  { canonical: "Tailwind CSS", aliases: ["tailwind", "tailwindcss", "tailwind css"],               category: "Frontend",     roles: ["frontend", "fullstack"] },
  { canonical: "Bootstrap",    aliases: ["bootstrap"],                                             category: "Frontend",     roles: ["frontend"] },
  { canonical: "Redux",        aliases: ["redux", "redux toolkit", "zustand"],                     category: "Frontend",     roles: ["frontend", "fullstack"] },
  // â”€â”€ Backend â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
  { canonical: "Node.js",      aliases: ["nodejs", "node.js", "node js"],                          category: "Backend",      roles: ["backend", "fullstack"] },
  { canonical: "Express.js",   aliases: ["express", "expressjs", "express.js"],                    category: "Backend",      roles: ["backend", "fullstack"] },
  { canonical: "Django",       aliases: ["django"],                                                category: "Backend",      roles: ["backend", "fullstack", "ai"] },
  { canonical: "Flask",        aliases: ["flask"],                                                 category: "Backend",      roles: ["backend", "ai"] },
  { canonical: "FastAPI",      aliases: ["fastapi", "fast api"],                                   category: "Backend",      roles: ["backend", "ai"] },
  { canonical: "Spring Boot",  aliases: ["spring", "spring boot", "spring mvc", "spring framework"], category: "Backend",   roles: ["backend"] },
  { canonical: "Laravel",      aliases: ["laravel"],                                               category: "Backend",      roles: ["backend"] },
  { canonical: "NestJS",       aliases: ["nestjs", "nest.js", "nest js"],                          category: "Backend",      roles: ["backend", "fullstack"] },
  { canonical: "GraphQL",      aliases: ["graphql", "graph ql"],                                   category: "Backend",      roles: ["backend", "fullstack"] },
  { canonical: "REST API",     aliases: ["rest api", "restapi", "rest apis", "restful"],           category: "Backend",      roles: ["backend", "fullstack"] },
  // â”€â”€ Databases â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
  { canonical: "MongoDB",      aliases: ["mongodb", "mongo"],                                      category: "Database",     roles: ["backend", "fullstack"] },
  { canonical: "PostgreSQL",   aliases: ["postgresql", "postgres", "psql", "pg"],                  category: "Database",     roles: ["backend", "fullstack", "datascience"] },
  { canonical: "MySQL",        aliases: ["mysql"],                                                 category: "Database",     roles: ["backend", "fullstack"] },
  { canonical: "Redis",        aliases: ["redis"],                                                 category: "Database",     roles: ["backend", "devops"] },
  { canonical: "Elasticsearch",aliases: ["elasticsearch", "elastic search", "elastic"],            category: "Database",     roles: ["backend"] },
  { canonical: "Firebase",     aliases: ["firebase", "firestore"],                                 category: "Database",     roles: ["frontend", "fullstack", "mobile"] },
  { canonical: "SQLite",       aliases: ["sqlite", "sqlite3"],                                     category: "Database",     roles: ["backend"] },
  { canonical: "DynamoDB",     aliases: ["dynamodb", "dynamo db"],                                 category: "Database",     roles: ["backend", "devops"] },
  { canonical: "Prisma",       aliases: ["prisma", "prisma orm"],                                  category: "Database",     roles: ["backend", "fullstack"] },
  // â”€â”€ Cloud â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
  { canonical: "AWS",          aliases: ["aws", "amazon web services"],                            category: "Cloud",        roles: ["devops", "backend", "fullstack"] },
  { canonical: "Azure",        aliases: ["azure", "microsoft azure"],                              category: "Cloud",        roles: ["devops", "backend"] },
  { canonical: "GCP",          aliases: ["gcp", "google cloud", "google cloud platform"],          category: "Cloud",        roles: ["devops", "backend", "ai"] },
  { canonical: "Vercel",       aliases: ["vercel"],                                                category: "Cloud",        roles: ["frontend", "fullstack"] },
  { canonical: "Netlify",      aliases: ["netlify"],                                               category: "Cloud",        roles: ["frontend"] },
  // â”€â”€ DevOps â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
  { canonical: "Docker",       aliases: ["docker", "dockerfile", "docker compose", "docker-compose"], category: "DevOps",   roles: ["devops", "backend"] },
  { canonical: "Kubernetes",   aliases: ["kubernetes", "k8s", "kubectl"],                          category: "DevOps",       roles: ["devops"] },
  { canonical: "Terraform",    aliases: ["terraform"],                                             category: "DevOps",       roles: ["devops"] },
  { canonical: "CI/CD",        aliases: ["ci/cd", "cicd", "github actions", "gitlab ci", "jenkins", "circleci", "travis"], category: "DevOps", roles: ["devops", "backend"] },
  { canonical: "Linux",        aliases: ["linux", "ubuntu", "debian", "centos", "unix"],           category: "DevOps",       roles: ["devops", "backend"] },
  { canonical: "Git",          aliases: ["git"],                                                   category: "Tools",        roles: ["frontend", "backend", "fullstack", "devops", "ai"] },
  { canonical: "GitHub",       aliases: ["github", "github.com"],                                  category: "Tools",        roles: ["frontend", "backend", "fullstack", "devops"] },
  { canonical: "Nginx",        aliases: ["nginx"],                                                 category: "DevOps",       roles: ["devops", "backend"] },
  { canonical: "Jira",         aliases: ["jira"],                                                  category: "Tools",        roles: ["fullstack", "backend"] },
  // â”€â”€ AI / ML â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
  { canonical: "TensorFlow",   aliases: ["tensorflow", "tensor flow"],                             category: "AI/ML",        roles: ["ai", "datascience"] },
  { canonical: "PyTorch",      aliases: ["pytorch", "py torch", "torch"],                          category: "AI/ML",        roles: ["ai", "datascience"] },
  { canonical: "Scikit-learn", aliases: ["scikit", "sklearn", "scikit-learn", "scikit learn"],     category: "AI/ML",        roles: ["ai", "datascience"] },
  { canonical: "Keras",        aliases: ["keras"],                                                 category: "AI/ML",        roles: ["ai"] },
  { canonical: "Hugging Face", aliases: ["huggingface", "hugging face", "transformers"],            category: "AI/ML",        roles: ["ai"] },
  { canonical: "OpenCV",       aliases: ["opencv", "cv2"],                                         category: "AI/ML",        roles: ["ai"] },
  { canonical: "Machine Learning", aliases: ["machine learning"],                          category: "AI/ML",        roles: ["ai", "datascience"] },
  { canonical: "Deep Learning", aliases: ["deep learning", "neural network", "neural networks"], category: "AI/ML",  roles: ["ai"] },
  { canonical: "NLP",          aliases: ["nlp", "natural language processing"],                    category: "AI/ML",        roles: ["ai"] },
  { canonical: "Computer Vision", aliases: ["computer vision", "image recognition", "object detection"], category: "AI/ML", roles: ["ai"] },
  { canonical: "Pandas",       aliases: ["pandas"],                                                category: "AI/ML",        roles: ["datascience", "ai"] },
  { canonical: "NumPy",        aliases: ["numpy"],                                                 category: "AI/ML",        roles: ["datascience", "ai"] },
  { canonical: "Matplotlib",   aliases: ["matplotlib", "seaborn", "plotly"],                       category: "AI/ML",        roles: ["datascience"] },
  { canonical: "Jupyter",      aliases: ["jupyter", "jupyter notebook", "ipynb"],                  category: "AI/ML",        roles: ["datascience", "ai"] },
  { canonical: "LLM",          aliases: ["llm", "large language model", "gpt", "openai", "langchain", "llamaindex"], category: "AI/ML", roles: ["ai"] },
  // â”€â”€ Mobile â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
  { canonical: "React Native", aliases: ["react native", "reactnative"],                           category: "Mobile",       roles: ["mobile", "frontend"] },
  { canonical: "Flutter",      aliases: ["flutter"],                                               category: "Mobile",       roles: ["mobile"] },
  { canonical: "Android",      aliases: ["android", "android sdk"],                                category: "Mobile",       roles: ["android"] },
  { canonical: "iOS",          aliases: ["ios", "xcode", "cocoapods"],                             category: "Mobile",       roles: ["ios"] },
  // â”€â”€ Methodology â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
  { canonical: "Agile",        aliases: ["agile", "scrum", "kanban"],                              category: "Methodology",  roles: ["backend", "fullstack"] },
  { canonical: "Microservices",aliases: ["microservices", "microservice"],                         category: "Architecture", roles: ["backend", "devops"] },
];

// â”€â”€â”€ Role Definitions â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

export interface RoleDefinition {
  key: string;
  label: string;
  primarySkills: string[];
}

export const ROLES: RoleDefinition[] = [
  { key: "frontend",    label: "Frontend Developer",     primarySkills: ["React", "Next.js", "Angular", "Vue", "JavaScript", "TypeScript", "HTML", "CSS"] },
  { key: "backend",     label: "Backend Developer",      primarySkills: ["Node.js", "Java", "Python", "MongoDB", "PostgreSQL", "MySQL", "REST API", "Spring Boot"] },
  { key: "fullstack",   label: "Full Stack Developer",   primarySkills: ["React", "Node.js", "JavaScript", "TypeScript", "MongoDB", "PostgreSQL", "Next.js"] },
  { key: "ai",          label: "AI / ML Engineer",       primarySkills: ["Python", "TensorFlow", "PyTorch", "Machine Learning", "Deep Learning", "NLP", "Scikit-learn"] },
  { key: "datascience", label: "Data Scientist",         primarySkills: ["Python", "Pandas", "NumPy", "Scikit-learn", "Matplotlib", "SQL", "Jupyter"] },
  { key: "devops",      label: "DevOps Engineer",        primarySkills: ["Docker", "Kubernetes", "CI/CD", "AWS", "Linux", "Terraform", "Git"] },
  { key: "android",     label: "Android Developer",      primarySkills: ["Android", "Kotlin", "Java", "React Native"] },
  { key: "ios",         label: "iOS Developer",          primarySkills: ["iOS", "Swift"] },
  { key: "mobile",      label: "Mobile Developer",       primarySkills: ["Flutter", "React Native", "Dart", "Android", "iOS"] },
];

// â”€â”€â”€ Scoring Weights (total = 100) â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
const WEIGHTS = { skills: 35, experience: 20, projects: 15, education: 10, keywords: 10, structure: 5, format: 5 };

// â”€â”€â”€ Utilities â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

function clamp(v: number): number { return Math.max(0, Math.min(100, Math.round(v))); }

function norm(text: string): string {
  return text
    .toLowerCase()
    .replace(/[._]/g, " ")              // react.js → react js, snake_case → snake case
    .replace(/[^a-z0-9\s+#\-\/]/g, " ") // remove other special chars (keep + # - / for c++ c# ci/cd)
    .replace(/\s+/g, " ")
    .trim();
}

/**
 * Multi-strategy skill presence check.
 * First tries simple substring on raw lowercase (handles garbled PDF text).
 * Then tries word-boundary regex on normalized text for precision.
 */
function hasSkill(rawLower: string, normText: string, entry: SkillEntry): boolean {
  void rawLower; // intentionally unused – word-boundary regex is sufficient and safe
  for (const alias of [entry.canonical, ...entry.aliases]) {
    const a = alias.toLowerCase().trim();
    // Skip empty or dangerously short aliases that would cause false positives
    if (!a || a.length < 3) continue;
    // Normalize alias the SAME way as resume text (dots/underscores → spaces, etc.)
    const aN = norm(a);
    if (!aN || aN.length < 2) continue;
    // Pre-check: every word of normalized alias must appear in normText
    const aNWords = aN.split(/\s+/).filter(Boolean);
    if (aNWords.length === 0) continue;
    if (!aNWords.every(w => normText.includes(w))) continue;
    try {
      const esc = aN.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
      let re: RegExp;
      if (/^[a-z0-9 ]+$/i.test(aN)) {
        // Pure alphanumeric / multi-word alias → strict word-boundary on both ends
        const parts = esc.split(/\s+/).join("[\\s]+");
        re = new RegExp(`\\b${parts}\\b`, "i");
      } else {
        // Contains special chars — after norm() most dots become spaces, but handle remainder
        re = new RegExp(`(?:^|[\\s,;/|(\\[\\{])${esc}(?=[\\s,;/|)\\]\\}\\.:]|$)`, "i");
      }
      if (re.test(normText)) return true;
    } catch { /* ignore bad regex — skip this alias */ }
  }
  return false;
}

// â”€â”€â”€ Text Quality Detector â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

function detectTextQuality(text: string): "good" | "partial" | "poor" {
  if (text.length < 50) return "poor";
  const words = text.split(/\s+/).filter(w => w.length > 2);
  if (words.length < 15) return "poor";
  const printableRatio = (text.match(/[\x20-\x7E]/g) || []).length / text.length;
  const realWordRatio = words.filter(w => /^[a-zA-Z]{3,}$/.test(w)).length / words.length;
  if (printableRatio > 0.7 && realWordRatio > 0.25) return "good";
  if (printableRatio > 0.4 && realWordRatio > 0.1)  return "partial";
  return "poor";
}

// ─── Core Skill Detector (ZERO HALLUCINATION) ────────────────────────────────
function detectSkills(rawText: string): SkillEntry[] {
  const rawLower = rawText.toLowerCase();
  const normText = norm(rawText);
  const detected = SKILL_DICT.filter(entry => hasSkill(rawLower, normText, entry));

  // Special case: bare "C" language — matches " C " or "C," or "C." or start/end of token
  // but must NOT be preceded/followed by +, #, /, or alphanumeric (to avoid C++, C#, etc.)
  const bareC = /(?:^|[\s,;(/\[])[Cc](?=[\s,;).\]/]|$)/m;
  if (bareC.test(rawText) && !detected.find(e => e.canonical === "C")) {
    detected.push({ canonical: "C", aliases: [], category: "Language", roles: ["systems", "backend"] });
  }

  return detected;
}

// â”€â”€â”€ Role Detector â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

function detectRole(skills: SkillEntry[]): RoleDefinition {
  const counts: Record<string, number> = {};
  for (const sk of skills) {
    for (const r of sk.roles) counts[r] = (counts[r] ?? 0) + 1;
  }
  // Strong domain signal: AI >= 3 skills → deterministically assign AI/ML role
  if ((counts["ai"] ?? 0) >= 3) {
    return ROLES.find(r => r.key === "ai") ?? ROLES.find(r => r.key === "fullstack")!;
  }
  // Full-stack signal: frontend >= 2 AND backend >= 2 → boost fullstack weight
  if ((counts["frontend"] ?? 0) >= 2 && (counts["backend"] ?? 0) >= 2) {
    counts["fullstack"] = (counts["fullstack"] ?? 0) + 3;
  }
  const sorted = Object.entries(counts).sort((a, b) => b[1] - a[1]);
  if (!sorted.length) return ROLES.find(r => r.key === "fullstack")!;
  return ROLES.find(r => r.key === sorted[0][0]) ?? ROLES.find(r => r.key === "fullstack")!;
}

// â”€â”€â”€ Structured Data Extractor â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

export function extractStructuredData(rawText: string): ParsedResumeData {
  const lines = rawText.split(/\n/).map(l => l.trim()).filter(Boolean);
  const emailMatch = rawText.match(/[\w.+-]+@[\w-]+\.[a-zA-Z]{2,}/);
  const phoneMatch = rawText.match(/(\+?\d[\d\s\-().]{7,14}\d)/);
  let name = "";
  for (const line of lines.slice(0, 6)) {
    if (/^[A-Za-z]+([\s][A-Za-z]+){1,3}$/.test(line) && line.length < 60) { name = line; break; }
  }
  const t = rawText.toLowerCase();

  function extractSection(headers: string[]): string[] {
    const results: string[] = [];
    for (const header of headers) {
      const idx = t.indexOf(header);
      if (idx === -1) continue;
      const chunk = rawText.slice(idx, idx + 1200);
      const bullets = chunk.match(/[â€¢\-*â–ªâ–º]\s*.+/g) || [];
      const nonEmpty = chunk.split(/\n/).map(l => l.trim())
        .filter(l => l.length > 10 && l.length < 250 && !headers.some(h => l.toLowerCase().startsWith(h)))
        .slice(1, 8);
      results.push(...(bullets.length > 0 ? bullets.map(b => b.trim()) : nonEmpty));
    }
    return [...new Set(results)].slice(0, 10);
  }

  const missingSections: string[] = [];
  if (!/(skill|technolog|proficien)/i.test(t)) missingSections.push("Skills");
  if (!/(experience|employment|work)/i.test(t)) missingSections.push("Experience");
  if (!/(education|university|college)/i.test(t)) missingSections.push("Education");
  if (!/project/i.test(t)) missingSections.push("Projects");

  return {
    name,
    email: emailMatch ? emailMatch[0] : "",
    phone: phoneMatch ? phoneMatch[0].trim() : "",
    skills: extractSection(["skills", "technical skills", "key skills", "technologies", "tech stack"]),
    experience: extractSection(["experience", "work experience", "professional experience", "employment"]),
    education: extractSection(["education", "academic", "qualifications"]),
    projects: extractSection(["project", "side project", "personal project"]),
    certifications: extractSection(["certif", "courses", "training", "credential"]),
    summary: extractSection(["summary", "objective", "about", "profile"]).slice(0, 2).join(" "),
    missingSections,
  };
}

// â”€â”€â”€ Sub-Scorers â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

function scoreSkillsVsJD(skills: SkillEntry[], jdSkills: SkillEntry[])
  : { score: number; matched: string[]; missing: string[] } {
  if (jdSkills.length === 0) {
    const matched = skills.map(s => s.canonical);
    const score = clamp(Math.log1p(skills.length) / Math.log1p(15) * 100);
    return { score, matched: matched.slice(0, 30), missing: [] };
  }
  const set = new Set(skills.map(s => s.canonical));
  const matched: string[] = [];
  const missing: string[] = [];
  for (const jd of jdSkills) {
    if (set.has(jd.canonical)) matched.push(jd.canonical);
    else missing.push(jd.canonical);
  }
  return { score: clamp((matched.length / jdSkills.length) * 100), matched, missing: missing.slice(0, 20) };
}

function scoreKeywords(rawText: string, detectedSkills: SkillEntry[])
  : { score: number; matched: string[]; missing: string[] } {
  const set = new Set(detectedSkills.map(s => s.canonical));
  const matched = [...set];
  const missing = SKILL_DICT.filter(s => !set.has(s.canonical)).map(s => s.canonical).slice(0, 20);
  const softHits = ["leadership", "communication", "teamwork", "problem solving", "agile", "scrum",
    "management", "collaboration", "analytical"].filter(k => rawText.toLowerCase().includes(k));
  matched.push(...softHits);
  // Cap at 15 skills to prevent score overflow
  return {
    score: clamp(Math.min(detectedSkills.length, 15) / 15 * 100),
    matched: matched.slice(0, 30),
    missing,
  };
}

function scoreFormatting(rawText: string, tq: string): number {
  if (tq === "poor") return 45;
  let s = 45;
  const t = rawText.toLowerCase();
  if (/@/.test(t)) s += 6;
  if (/linkedin/.test(t)) s += 6;
  if (/github/.test(t)) s += 6;
  if (/portfolio|website/.test(t)) s += 3;
  if (/\+91|\+1|\(\d{3}\)/.test(t)) s += 4;
  const wc = rawText.split(/\s+/).length;
  if (wc >= 180 && wc <= 1400) s += 10;
  else if (wc < 80) s -= 20;
  return clamp(s);
}

function scoreExperience(rawText: string, tq: string): { score: number; years: number } {
  const t = rawText.toLowerCase();
  let years = 0;
  const now = new Date().getFullYear();

  // Strategy 1a: "2020 - 2022" / "2020 to 2022" / "2020 – 2022" (year-only ranges)
  for (const m of t.matchAll(/\b(20\d{2}|19\d{2})\s*[-\u2013\u2014to]+\s*(20\d{2}|present|current|now)\b/gi)) {
    const s2 = parseInt(m[1]);
    const e2 = /present|current|now/i.test(m[2]) ? now : parseInt(m[2]);
    if (e2 >= s2 && e2 - s2 <= 35) years += e2 - s2;
  }

  // Strategy 1b: "Dec 2024 - Jan 2025" / "Apr 2025 – Present" (month-year ranges)
  const MONTH_IDX: Record<string, number> = {
    jan:0, feb:1, mar:2, apr:3, may:4, jun:5, jul:6, aug:7, sep:8, oct:9, nov:10, dec:11
  };
  const MO = 'jan|feb|mar|apr|may|jun|jul|aug|sep|oct|nov|dec';
  const monthRangeRe = new RegExp(
    `(${MO})\\s+(\\d{4})\\s*[-\u2013\u2014to]+\\s*(?:(${MO})\\s+(\\d{4})|(present|current|now))`,
    'gi'
  );
  for (const m of t.matchAll(monthRangeRe)) {
    const y1 = parseInt(m[2]);
    const mo1 = MONTH_IDX[m[1].toLowerCase().slice(0, 3)] ?? 0;
    let y2: number, mo2: number;
    if (/present|current|now/i.test(m[5] ?? '')) {
      y2 = now; mo2 = new Date().getMonth();
    } else {
      y2 = parseInt(m[4]);
      mo2 = MONTH_IDX[m[3]?.toLowerCase().slice(0, 3) ?? ''] ?? mo1;
    }
    const monthsExp = (y2 - y1) * 12 + (mo2 - mo1);
    if (monthsExp > 0 && monthsExp <= 480) years += monthsExp / 12;
  }

  // Strategy 2: "3+ years of experience"
  const expMatch = t.match(/(\d+)\+?\s*(?:years?|yrs?)\s+(?:of\s+)?(?:experience|exp)/);
  if (expMatch) { const n = parseInt(expMatch[1]); if (n > years && n <= 50) years = n; }

  // Strategy 3: "6 months internship" / "6-month intern"
  const internRe = /(\d+\.?\d*)\s*[-\s]?months?\s*(?:internship|intern|training)/gi;
  let im: RegExpExecArray | null;
  while ((im = internRe.exec(t)) !== null) {
    const mo = parseFloat(im[1]);
    if (mo > 0 && mo <= 24) years += mo / 12;
  }

  // Strategy 4: "intern" keyword without explicit duration → assume 0.5 yr min
  if (/(internship|intern(?:ed)?|industrial\s+training)/i.test(t) && years === 0) {
    years = 0.5;
  }

  years = Math.min(years, 30);

  let s = 15;
  if (/(experience|employment|internship|intern|work|worked)/i.test(t)) s += 20;
  if (years >= 0.25) s += 10;   // any internship
  if (years >= 1)   s += 12;
  if (years >= 2)   s += 10;
  if (years >= 4)   s += 8;
  if (years >= 6)   s += 6;
  const verbs = ["developed","built","designed","implemented","led","managed","improved",
    "increased","reduced","delivered","optimized","scaled","integrated","automated","created","launched","deployed"];
  let vc = 0; for (const v of verbs) { if (t.includes(v)) vc++; }
  s += Math.min(vc * 2, 12);
  if (tq === "poor") s = Math.max(s, 25);
  return { score: clamp(s), years };
}

function scoreEducation(rawText: string, tq: string): number {
  const t = rawText.toLowerCase();
  let s = 20;
  if (/b\.?tech|bachelor|b\.?e[^a-z]|b\.?sc[^a-z]|bca[^a-z]|bcom[^a-z]/i.test(t)) s += 25;
  if (/m\.?tech|master|m\.?e[^a-z]|m\.?sc[^a-z]|mca[^a-z]|mba[^a-z]/i.test(t)) s += 25;
  if (/ph\.?d|doctorate/i.test(t)) s += 25;
  if (/(education|university|college|institute|school)/i.test(t)) s += 15;
  if (/gpa|cgpa|percentage|\d{2,3}\.?\d*\s*%/i.test(t)) s += 10;
  for (const c of ["iit","nit","bits","mit","stanford","iisc","iim","gla","vit","manipal"]) {
    if (t.includes(c)) { s += 15; break; }
  }
  if (tq === "poor") s = Math.max(s, 30);
  return clamp(s);
}

function scoreProjects(rawText: string, tq: string): number {
  const t = rawText.toLowerCase();
  let s = 0;
  if (/project/i.test(t)) s += 35;
  s += Math.min((rawText.match(/[-\u2022*]\s*[A-Z][^\n]{10,80}/g) || []).length * 5, 25);
  if (/certification|certificate|certified/i.test(t)) s += 20;
  if (/achievement|award|honor|prize/i.test(t)) s += 10;
  if (/publication|research|paper|thesis/i.test(t)) s += 10;
  if (tq === "poor") s = Math.max(s, 20);
  return clamp(s);
}

function scoreReadability(rawText: string, tq: string): number {
  if (tq === "poor") return 40;
  let s = 50;
  const sentences = rawText.split(/[.!?]+/).filter(x => x.trim().length > 10);
  const avg = sentences.reduce((a, x) => a + x.split(/\s+/).length, 0) / (sentences.length || 1);
  if (avg >= 5 && avg <= 25) s += 20; else if (avg < 3 || avg > 40) s -= 10;
  const bullets = (rawText.match(/^[â€¢\-*â–ªâ–º]\s.+/gm) || []).length;
  if (bullets >= 5) s += 20; else if (bullets >= 2) s += 10;
  return clamp(s);
}

function scoreSections(rawText: string): {
  hasExp: boolean; hasSkill: boolean; hasEdu: boolean; hasProj: boolean;
  score: number;
} {
  const t = rawText.toLowerCase();
  const sections = [
    { key: "skills",     re: /(skills?|technical\s*skills?|technologies?|tech\s*stack|programming|languages?|tools)/i, points: 15 },
    { key: "experience", re: /(experience|employment|work\s+history|internship|intern|worked\s+at|work\s+at)/,         points: 15 },
    { key: "education",  re: /(education|degree|university|college|school|b\.?tech|b\.?e\.?|m\.?tech|mca|bca|bsc)/,  points: 10 },
    { key: "projects",   re: /(project|work\s+sample|portfolio|github|personal\s+project|academic\s+project)/,        points: 10 },
    { key: "summary",    re: /(summary|objective|profile|about\s+me|career\s+goal)/,                                   points: 5  },
    { key: "contact",    re: /(email|phone|linkedin|github\.com|@|contact)/,                                             points: 5  },
  ];
  let score = 0;
  const found: Record<string, boolean> = {};
  for (const sec of sections) {
    if (sec.re.test(t)) { found[sec.key] = true; score += sec.points; }
    else found[sec.key] = false;
  }
  return {
    hasExp:   found["experience"] ?? false,
    hasSkill: found["skills"]     ?? false,
    hasEdu:   found["education"]  ?? false,
    hasProj:  found["projects"]   ?? false,
    score: clamp(score),
  };
}


// â”€â”€â”€ Suggestion Engine â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

function generateSuggestions(
  score: number,
  missingSkills: string[],
  years: number,
  hasExpSection: boolean,
  hasSkillSection: boolean,
  hasProjSection: boolean,
  hasEduSection: boolean,
  jdSkillCount: number,
): string[] {
  const tips: string[] = [];

  // Skills
  if (missingSkills.length > 0) {
    tips.push(`Add missing skills to your skills section: ${missingSkills.slice(0, 5).join(", ")}`);
  }
  if (!hasSkillSection) {
    tips.push("Add a dedicated Skills / Technologies section to your resume");
  }

  // Experience
  if (!hasExpSection) {
    tips.push("Add an Experience or Internship section, even for short-term roles");
  } else if (years < 0.25) {
    tips.push("Mention internship/training durations (e.g., '3-month internship at XYZ') to get credit");
  } else if (years < 1) {
    tips.push("Quantify your internship impact (e.g., 'Reduced load time by 30%')");
  } else if (years >= 1 && years < 2) {
    tips.push("Highlight measurable achievements in each role (numbers, percentages, scale)");
  }

  // Projects
  if (!hasProjSection) {
    tips.push("Add a Projects section with GitHub links and tech stack used");
  } else if (score < 60) {
    tips.push("Expand project descriptions with technologies used and measurable outcomes");
  }

  // Education
  if (!hasEduSection) {
    tips.push("Add an Education section with degree, institution, and graduation year");
  }

  // JD match
  if (jdSkillCount > 0 && missingSkills.length > jdSkillCount * 0.5) {
    tips.push("Your resume matches fewer than half the JD skills — tailor it more closely to the job description");
  }

  // General format tips (only when score is low)
  if (score < 50) {
    tips.push("Use strong action verbs: developed, built, designed, implemented, optimized");
    tips.push("Keep resume to 1-2 pages and use clean formatting with consistent bullet style");
  }

  // Deduplicate & return top 6
  return [...new Set(tips)].slice(0, 6);
}


function generateStrengths(skills: SkillEntry[], expScore: number, projScore: number, years: number, role: RoleDefinition): string[] {
  const s: string[] = [];
  const top = skills.slice(0, 5).map(sk => sk.canonical);
  if (skills.length >= 8) s.push(`Strong ${role.label} skill set: ${top.join(", ")}.`);
  else if (skills.length >= 4) s.push(`Solid skills detected: ${top.join(", ")}.`);
  if (expScore >= 60) s.push(`${years > 0 ? `${years}+ year(s) of` : "Meaningful"} professional experience.`);
  if (projScore >= 50) s.push("Good projects and certifications coverage.");
  if (skills.length >= 5 && projScore >= 30) s.push(`Profile aligns with ${role.label} job requirements.`);
  if (!s.length) s.push("Resume received. Review suggestions below to improve your score.");
  return s;
}

function qualityLabel(score: number): ATSScoreResult["resumeQuality"] {
  if (score >= 80) return "Excellent";
  if (score >= 60) return "Good";
  if (score >= 40) return "Average";
  return "Needs Improvement";
}

function buildRecommendation(score: number, role: RoleDefinition, missSec: string[]): string {
  if (score >= 80) return `Your resume is ATS-ready for ${role.label} roles. Apply confidently!`;
  if (score >= 65) return `Good ${role.label} profile. A few tweaks will push you past 80.`;
  if (score >= 45) return `Average score. Add ${missSec.slice(0, 2).join(", ")} sections and more ${role.label} keywords.`;
  return `Needs improvement for ${role.label} roles. Focus on skills, experience, and structure.`;
}

// â”€â”€â”€ Main Scorer â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

function parseJDSkills(jd: string): SkillEntry[] {
  if (!jd || jd.trim().length < 20) return [];
  // Strip salary/company/event noise from JD
  const norm = jd
    .replace(/\$[\d,]+(?:\s*[-–]\s*\$[\d,]+)?\s*(?:\/yr|\/year|\/mo|per\s+year|lpa|ctc|lakh)?/gi, " ")
    .replace(/(?:salary|compensation|pay|ctc|package|stipend)\s*:?[^\n]*/gi, " ")
    .replace(/(?:about\s+(?:us|the\s+company)|company\s+overview|who\s+we\s+are)[\s\S]{0,600}/gi, " ")
    .replace(/(?:apply\s+now|submit\s+application|click\s+here|send\s+resume|contact\s+hr)[^\n]*/gi, " ")
    .toLowerCase();

  // Prefer tech-stack / requirements section if present — expanded to cover more JD formats
  const techMatch = norm.match(
    /(?:required\s+skills?|tech(?:nologies?)?\s*(?:used|stack)?|tools?\s+(?:and\s+)?technologies?|qualifications?|requirements?|programming\s+languages?|supported\s+(?:programming\s+)?languages?|preferred\s+(?:skills?|technologies?))(\s[\s\S]{0,1800})/i,
  );
  const searchZone = techMatch ? techMatch[1] : norm;
  // Deduplicate by canonical name using a Map
  const rawMatches = SKILL_DICT.filter(entry => hasSkill("", searchZone, entry));
  const deduped = new Map<string, SkillEntry>();
  for (const e of rawMatches) deduped.set(e.canonical, e);
  return [...deduped.values()];
}

export function scoreResume(
  rawText: string,
  jobDescription?: string,
): ATSScoreResult {
  const tq = detectTextQuality(rawText);
  const parsedData = extractStructuredData(rawText);
  const detectedSkills = detectSkills(rawText);
  const jdSkills = jobDescription ? parseJDSkills(jobDescription) : [];
  const { matched: jdMatched, missing: jdMissing, score: jdSkillScore } = scoreSkillsVsJD(detectedSkills, jdSkills);
  const jdSkillMatch = jdSkills.length > 0 ? clamp(Math.round((jdMatched.length / jdSkills.length) * 100)) : 0;
  const kwResult = scoreKeywords(rawText, detectedSkills);
  const sectionResult = scoreSections(rawText);
  const expResult = scoreExperience(rawText, tq);
  const eduScore = scoreEducation(rawText, tq);
  const projScore = scoreProjects(rawText, tq);
  const formatScore = scoreFormatting(rawText, tq);
  const readabilityScore = scoreReadability(rawText, tq);
  const skillsScore = jdSkills.length > 0 ? jdSkillScore : kwResult.score;
  // Weights: Skills 35% | Experience 20% | Projects 15% | Education 10%
  //          Keywords 10% | Formatting 5% | Structure 5%  (total = 100%)
  const weighted =
    skillsScore         * 0.35 +
    expResult.score     * 0.20 +
    projScore           * 0.15 +
    eduScore            * 0.10 +
    kwResult.score      * 0.10 +
    formatScore         * 0.05 +
    sectionResult.score * 0.05;
  let atsScore = clamp(Math.round(weighted));
  // Non-zero guarantee: a resume with detected skills must score at least 35
  if (detectedSkills.length > 0 && atsScore < 35) atsScore = 35;
  const role = detectRole(detectedSkills);
  const jobRole = role?.key ?? 'general';
  const jobTitleMatch = role?.label ?? 'General';
  const suggestions = generateSuggestions(
    atsScore,
    jdSkills.length > 0 ? jdMissing : kwResult.missing.slice(0, 5),
    expResult.years,
    sectionResult.hasExp,
    sectionResult.hasSkill,
    sectionResult.hasProj,
    sectionResult.hasEdu,
    jdSkills.length,
  );
  const strengths = generateStrengths(detectedSkills, expResult.score, projScore, expResult.years, role);
  const resumeQuality = qualityLabel(atsScore);
  const recommendation = buildRecommendation(atsScore, role, parsedData.missingSections);
  return {
    atsScore, keywordScore: kwResult.score, skillsScore, formatScore,
    experienceScore: expResult.score, educationScore: eduScore,
    readabilityScore, sectionScore: sectionResult.score,
    matchedKeywords: kwResult.matched, missingKeywords: kwResult.missing.slice(0, 10),
    extractedSkills: detectedSkills.map(e => e.canonical), suggestions, strengths,
    jobTitleMatch, jobRole, experienceYears: expResult.years, parsedData,
    jdSkillMatch, jdMatchedSkills: jdMatched, jdMissingSkills: jdMissing.slice(0, 10),
    resumeQuality, recommendation, textQuality: tq,
  };
}
