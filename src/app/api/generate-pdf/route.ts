import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { GoogleGenerativeAI } from "@google/generative-ai";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { calculateInterviewScore } from "@/lib/utils";

const BEHAVIORAL_COLLECTION = "behavioral_analytics";

type BehavioralDoc = {
  userId?: string;
  sessionId?: string;
  startedAt?: string;
  endedAt?: string;
  summary?: Record<string, unknown>;
  alerts?: string[];
  alertSnapshots?: Array<{
    timestamp?: string;
    issueCode?: string;
    issueDetected?: string;
    observation?: string;
    suggestion?: string;
    imageData?: string;
  }>;
  createdAt?: string;
};

type MetricRow = {
  name: string;
  value: number;
  status: "Excellent" | "Good" | "Needs Improvement" | "Critical";
  explanation: string;
};

type ArchiveEvaluation = {
  userRawRoman?: string;
  hrResponse?: string;
  identifiedErrors: string[];
  correctedVersion: string;
  bestProfessionalAnswer: string;
  issueTypes: string[];
  improvementCategory: string;
  performanceTag: string;
  grammarErrorCount: number;
  repetitionDetected: boolean;
  structuredAnswer: boolean;
};

const escapeHtml = (value: string) =>
  String(value || "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");

const toSentences = (text: string) => text.split(/(?<=[.!?])\s+/).filter(Boolean);
const ENGLISH_ONLY_REGEX = /^[A-Za-z0-9\s.,!?'"():;%\-\/]+$/;

const isEnglishOnlyText = (text: string) => ENGLISH_ONLY_REGEX.test(String(text || "").trim());

const normalizeToEnglishSafe = (text: string) => {
  const ascii = String(text || "")
    .normalize("NFKD")
    .replace(/[^\x20-\x7E]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
  return ascii;
};

const DEVANAGARI_TO_ROMAN: Record<string, string> = {
  "\u0905": "a", "\u0906": "aa", "\u0907": "i", "\u0908": "ee", "\u0909": "u", "\u090A": "oo", "\u090F": "e", "\u0910": "ai", "\u0913": "o", "\u0914": "au",
  "\u0915": "k", "\u0916": "kh", "\u0917": "g", "\u0918": "gh", "\u0919": "ng",
  "\u091A": "ch", "\u091B": "chh", "\u091C": "j", "\u091D": "jh", "\u091E": "ny",
  "\u091F": "t", "\u0920": "th", "\u0921": "d", "\u0922": "dh", "\u0923": "n",
  "\u0924": "t", "\u0925": "th", "\u0926": "d", "\u0927": "dh", "\u0928": "n",
  "\u092A": "p", "\u092B": "ph", "\u092C": "b", "\u092D": "bh", "\u092E": "m",
  "\u092F": "y", "\u0930": "r", "\u0932": "l", "\u0935": "v", "\u0936": "sh", "\u0937": "sh", "\u0938": "s", "\u0939": "h",
  "\u093E": "a", "\u093F": "i", "\u0940": "ee", "\u0941": "u", "\u0942": "oo", "\u0947": "e", "\u0948": "ai", "\u094B": "o", "\u094C": "au",
  "\u094D": "", "\u0902": "n", "\u0901": "n", "\u0903": "h", "\u095C": "d", "\u095D": "dh",
  "\u0966": "0", "\u0967": "1", "\u0968": "2", "\u0969": "3", "\u096A": "4", "\u096B": "5", "\u096C": "6", "\u096D": "7", "\u096E": "8", "\u096F": "9",
};

const romanizeToAscii = (text: string) => {
  if (!text) return "";
  let out = "";
  for (const ch of text) {
    if (DEVANAGARI_TO_ROMAN[ch] !== undefined) {
      out += DEVANAGARI_TO_ROMAN[ch];
    } else if (/[\x20-\x7E]/.test(ch)) {
      out += ch;
    } else {
      out += " ";
    }
  }
  return out.replace(/\s+/g, " ").trim();
};

const toRomanRaw = (text: string) => {
  const roman = romanizeToAscii(String(text || ""));
  return normalizeToEnglishSafe(roman);
};

const ensureTagRange = (tags: string[]) => {
  const unique = Array.from(new Set((tags || []).map((x) => normalizeToEnglishSafe(x)).filter(Boolean)));
  if (unique.length >= 2) return unique.slice(0, 4);
  if (unique.length === 1) return [unique[0], "Weak Structure"];
  return ["Grammar Issue", "Confidence Issue"];
};

const formatArchiveTimestamp = (value: unknown) => {
  const dt = new Date(String(value || ""));
  if (Number.isNaN(dt.getTime())) return "N/A";
  return dt.toLocaleString();
};

const basicGrammarCorrection = (rawAnswer: string) => {
  let fixed = String(rawAnswer || "")
    .replace(/\s+/g, " ")
    .replace(/\s+,/g, ",")
    .replace(/\s+\./g, ".")
    .replace(/\s+!/g, "!")
    .replace(/\s+\?/g, "?")
    .trim();

  fixed = fixed.replace(/\bi\b/g, "I");
  fixed = fixed.replace(/\s([.?!,;:])/g, "$1");
  fixed = fixed.replace(/(^\w|[.!?]\s+\w)/g, (m) => m.toUpperCase());

  if (fixed && !/[.!?]$/.test(fixed)) {
    fixed += ".";
  }
  return fixed || "I would like to answer this more clearly.";
};

const buildPersonalizedProfessionalAnswer = (rawAnswer: string, userName: string, role?: string | null) => {
  const normalizedRole = role || "target role";
  const hasProjectHint = /\b(project|built|developed|implemented|fluenzyai|system|platform)\b/i.test(rawAnswer);
  if (hasProjectHint) {
    return `I worked on FluenzyAI, an AI-powered interview preparation platform. In this project, I focused on designing structured workflows, improving response quality analysis, and building scalable implementation components relevant to the ${normalizedRole}. This experience strengthened my problem-solving, communication, and execution skills in real-world development scenarios.`;
  }
  return `I am ${userName}, and I am preparing for the ${normalizedRole}. I have been developing my communication, technical thinking, and structured problem-solving through practical projects. I focus on delivering clear, professional answers and continuously improving through interview simulations and feedback.`;
};

const heuristicEvaluateAnswer = (question: string, rawAnswer: string, userName: string, role?: string | null) => {
  const errors: string[] = [];
  const issueTypes: string[] = [];
  const normalized = String(rawAnswer || "").trim();
  const words = normalized ? normalized.split(/\s+/) : [];

  let grammarErrorCount = 0;
  if (!normalized) {
    errors.push("No usable response captured for this prompt.");
    issueTypes.push("Incomplete Thought");
    grammarErrorCount += 2;
  }

  if (/\bi\b/.test(normalized)) {
    errors.push("Pronoun capitalization issue detected (\"i\" should be \"I\").");
    issueTypes.push("Grammar Issue");
    grammarErrorCount += 1;
  }

  if (/[a-z][.!?]?\s*$/.test(normalized) && !/[.!?]$/.test(normalized)) {
    errors.push("Sentence ending punctuation is missing.");
    issueTypes.push("Structure Problem");
    grammarErrorCount += 1;
  }

  const repetitionDetected = /\b(\w+)\s+\1\b/i.test(normalized) || /\b(\w+\s+\w+)\s+\1\b/i.test(normalized);
  if (repetitionDetected) {
    errors.push("Repetition detected, which affects fluency and delivery.");
    issueTypes.push("Repetition");
  }

  const sentenceCount = toSentences(normalized).length;
  const structuredAnswer =
    sentenceCount >= 2 &&
    /\b(because|therefore|result|impact|implemented|designed|developed|worked on)\b/i.test(normalized);
  if (!structuredAnswer) {
    errors.push("Answer lacks clear structure (context, action, and outcome).");
    issueTypes.push("Structure Problem");
  }

  if (words.length < 6) {
    errors.push("Response appears too short and incomplete for interview context.");
    issueTypes.push("Incomplete Thought");
    grammarErrorCount += 1;
  }

  const techPrompt = /\b(project|technical|data|system|architecture|algorithm|complex)\b/i.test(question);
  const techSignals = /\b(api|python|java|javascript|sql|ml|ai|cloud|data|model|backend|frontend|system)\b/i.test(
    normalized
  );
  if (techPrompt && !techSignals) {
    errors.push("Technical depth is limited; include concrete tools, decisions, and outcomes.");
    issueTypes.push("Technical Depth Missing");
  }

  if (!/\b(I|my|we)\b/.test(normalized)) {
    errors.push("Answer lacks ownership language and confidence markers.");
    issueTypes.push("Confidence Issue");
  }

  const correctedVersion = basicGrammarCorrection(normalized);
  const bestProfessionalAnswer = buildPersonalizedProfessionalAnswer(normalized, userName, role);
  const uniqueIssueTypes = Array.from(new Set(issueTypes));
  const improvementCategory = Array.from(
    new Set(
      uniqueIssueTypes.map((issue) => {
        if (issue.includes("Grammar")) return "Grammar";
        if (issue.includes("Structure") || issue.includes("Incomplete")) return "Structure";
        if (issue.includes("Confidence")) return "Confidence";
        if (issue.includes("Technical")) return "Technical Depth";
        if (issue.includes("Vocabulary")) return "Vocabulary";
        if (issue.includes("Repetition")) return "Fluency";
        return "Communication";
      })
    )
  ).join(" + ");

  let performanceTag = "âš  Communication Improvement Required";
  if (grammarErrorCount > 5) {
    performanceTag = "âš  High Grammar Risk";
  } else if (repetitionDetected) {
    performanceTag = "âš  Fluency Issue";
  } else if (!structuredAnswer) {
    performanceTag = "âš  Lack of STAR Method";
  } else if (uniqueIssueTypes.length <= 1 && words.length > 20) {
    performanceTag = "âœ… Strong Structured Answer";
  } else if (uniqueIssueTypes.includes("Technical Depth Missing")) {
    performanceTag = "âš  Technical Depth Weak";
  }

  return {
    identifiedErrors: errors.length ? errors : ["No major issues detected."],
    correctedVersion,
    bestProfessionalAnswer,
    issueTypes: uniqueIssueTypes.length ? uniqueIssueTypes : ["Minor Improvement Needed"],
    improvementCategory: improvementCategory || "Grammar + Structure + Confidence",
    performanceTag,
    grammarErrorCount,
    repetitionDetected,
    structuredAnswer,
  } satisfies ArchiveEvaluation;
};

const evaluateAnswerWithAI = async (
  question: string,
  rawAnswer: string,
  userName: string,
  role?: string | null,
  company?: string | null
) => {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    return heuristicEvaluateAnswer(question, rawAnswer, userName, role);
  }

  try {
    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({
      model: "gemini-2.5-flash",
      generationConfig: { responseMimeType: "application/json", temperature: 0.3 },
    });

    const prompt = `
You are FluenzyAI Interview Intelligence Engine.
Analyze ONE interview answer and return STRICT JSON only.

Candidate context:
- Name: ${userName}
- Target Role: ${role || "General Role"}
- Target Company: ${company || "General"}

Question: ${question}
Raw Answer: ${rawAnswer}

Rules:
1) Keep raw answer unchanged externally (do not rewrite as raw).
2) "correctedVersion" must be basic grammar correction only.
3) "bestProfessionalAnswer" must be role-specific, confident, structured.
4) Identify concrete errors: grammar, capitalization, missing verbs, sentence structure, clarity, tone.
5) Classify issue types from this list only:
["Grammar Issue","Vocabulary Weakness","Confidence Issue","Technical Depth Missing","Structure Problem","Repetition","Incomplete Thought"]
6) Provide improvementCategory as compact mix like "Grammar + Structure + Confidence".
7) performanceTag rules:
   - grammarErrorCount > 5 => "âš  High Grammar Risk"
   - repetitionDetected true => "âš  Fluency Issue"
   - structuredAnswer false => "âš  Lack of STAR Method"
   - strong answer => "âœ… Strong Structured Answer"
8) Never repeat raw answer as bestProfessionalAnswer.

Return JSON:
{
  "identifiedErrors": ["..."],
  "correctedVersion": "...",
  "bestProfessionalAnswer": "...",
  "issueTypes": ["..."],
  "improvementCategory": "...",
  "performanceTag": "...",
  "grammarErrorCount": 0,
  "repetitionDetected": false,
  "structuredAnswer": true
}`;

    const result = await model.generateContent(prompt);
    const text = result.response.text();
    const parsed = JSON.parse(text.replace(/```json\n?|\n?```/g, "").trim());

    const safe: ArchiveEvaluation = {
      identifiedErrors: Array.isArray(parsed.identifiedErrors)
        ? parsed.identifiedErrors.filter((x: unknown) => typeof x === "string").slice(0, 8)
        : [],
      correctedVersion: String(parsed.correctedVersion || "").trim(),
      bestProfessionalAnswer: String(parsed.bestProfessionalAnswer || "").trim(),
      issueTypes: Array.isArray(parsed.issueTypes)
        ? parsed.issueTypes.filter((x: unknown) => typeof x === "string").slice(0, 7)
        : [],
      improvementCategory: String(parsed.improvementCategory || "").trim(),
      performanceTag: String(parsed.performanceTag || "").trim(),
      grammarErrorCount: Number(parsed.grammarErrorCount || 0),
      repetitionDetected: Boolean(parsed.repetitionDetected),
      structuredAnswer: Boolean(parsed.structuredAnswer),
    };

    if (!safe.correctedVersion || !safe.bestProfessionalAnswer) {
      return heuristicEvaluateAnswer(question, rawAnswer, userName, role);
    }

    if (safe.bestProfessionalAnswer.toLowerCase() === String(rawAnswer || "").trim().toLowerCase()) {
      safe.bestProfessionalAnswer = buildPersonalizedProfessionalAnswer(rawAnswer, userName, role);
    }
    if (!safe.identifiedErrors.length) {
      safe.identifiedErrors = ["No major issues detected."];
    }
    if (!safe.issueTypes.length) {
      safe.issueTypes = ["Minor Improvement Needed"];
    }
    if (!safe.improvementCategory) {
      safe.improvementCategory = "Grammar + Structure + Confidence";
    }
    if (!safe.performanceTag) {
      safe.performanceTag = "âš  Communication Improvement Required";
    }
    return safe;
  } catch (error) {
    console.error("Per-answer AI evaluation failed, using heuristic fallback:", error);
    return heuristicEvaluateAnswer(question, rawAnswer, userName, role);
  }
};

const classifyQuestionTypeV2 = (question: string, rawAnswer: string) => {
  const q = String(question || "").toLowerCase().trim();
  const wordCount = String(rawAnswer || "")
    .trim()
    .split(/\s+/)
    .filter(Boolean).length;

  if (!q && wordCount <= 2) return "One-word incomplete answer";
  if (!q) return "Follow-up clarification";
  if (/(how are you|how're you|how do you do|good morning|good afternoon|hello|hi\b)/.test(q)) return "Greeting";
  if (/(tell me about yourself|introduce yourself)/.test(q)) return "Introduction";
  if (/(background|previous experience aligns|walk me through your background|experience aligns)/.test(q)) {
    return "Background summary";
  }
  if (/(setback|failure|major challenge|resistance|conflict|how you handled)/.test(q)) return "Challenge/failure question";
  if (/(leadership principle|ownership|dive deep|frugality|stakeholder)/.test(q)) return "Leadership principle";
  if (/(describe a time|tell me about a time|behavioral|situation where)/.test(q)) return "Behavioral question";
  if (/(metrics|kpi|accuracy|precision|recall|f1|impact|performance)/.test(q)) return "Metrics/performance question";
  if (/(project|model|algorithm|business problem|tools|technical)/.test(q)) return "Technical project";
  return "Follow-up clarification";
};

const requiresStarMethodV2 = (questionType: string) =>
  ["Leadership principle", "Behavioral question", "Challenge/failure question"].includes(questionType);

const detectRepetitionV2 = (text: string) =>
  /\b(\w+)\s+\1\b/i.test(text) || /\b(\w+\s+\w+)\s+\1\b/i.test(text);

const countGrammarSignalsV2 = (text: string) => {
  const value = String(text || "").trim();
  let count = 0;
  if (/\bi\b/.test(value)) count += 1;
  if (!/[.!?]$/.test(value) && value.length > 0) count += 1;
  if (/\b(I am|I'm)\s+\1/i.test(value)) count += 2;
  if (/\band and\b/i.test(value)) count += 1;
  if (/\s+,|,\S/.test(value)) count += 1;
  return count;
};

const buildProfessionalAnswerV2 = (
  questionType: string,
  question: string,
  rawAnswer: string,
  userName: string,
  role?: string | null,
  company?: string | null,
  profileContext?: string | null
) => {
  const r = role || "target role";
  const c = company || "the company";
  const pc = profileContext || "";

  // Extract key profile fields once
  const firstExpMatch = pc.match(/Experience:\n  - (.+?) at (.+?) \(([^)]+)\)(?:: (.+?))?\n/);
  const firstExpRole = firstExpMatch?.[1] || null;
  const firstExpCompany = firstExpMatch?.[2] || null;
  const firstExpDesc = firstExpMatch?.[4]?.trim().slice(0, 120) || null;

  const skillsMatch = pc.match(/Skills: (.+)/m);
  const topSkills = skillsMatch ? skillsMatch[1].split(",").slice(0, 3).map(s => s.split("(")[0].trim()).join(", ") : null;

  const projMatch = pc.match(/Projects:\n  - ([^[\n]+?)(?:\[Tech: ([^\]]+)\])?(?:: (.+?))?\n/);
  const projTitle = projMatch?.[1]?.trim() || null;
  const projTech = projMatch?.[2]?.trim() || null;
  const projDesc = projMatch?.[3]?.trim().slice(0, 100) || null;

  const eduMatch = pc.match(/Education:\n  - (.+?) at (.+?) \(([^)]+)\)/);
  const eduDegree = eduMatch?.[1] || null;
  const eduInst = eduMatch?.[2] || null;

  if (questionType === "Greeting") {
    return `I am doing well, thank you. I am ${userName}${firstExpRole ? `, currently working as a ${firstExpRole}` : ""}. I really appreciate the opportunity to interview for this position today.`;
  }

  if (questionType === "Introduction" || questionType === "Background summary") {
    const expPart = firstExpRole && firstExpCompany
      ? `Most recently I worked as a ${firstExpRole} at ${firstExpCompany}${firstExpDesc ? `, where I ${firstExpDesc.charAt(0).toLowerCase() + firstExpDesc.slice(1).replace(/\.$/, "")}` : ""}.`
      : "";
    const eduPart = eduDegree && eduInst ? ` I hold a ${eduDegree} from ${eduInst}.` : "";
    const skillPart = topSkills ? ` My strongest areas are ${topSkills}.` : "";
    return `I am ${userName}. ${expPart}${eduPart}${skillPart} I am really excited to bring all of this to ${c}.`.trim();
  }

  if (questionType === "Technical project" || questionType === "Metrics/performance question") {
    if (projTitle) {
      const tech = projTech ? `, built with ${projTech.split(",").slice(0, 4).map(t => t.trim()).join(", ")}` : "";
      const desc = projDesc ? ` The core goal was to ${projDesc.charAt(0).toLowerCase() + projDesc.slice(1).replace(/\.$/, "")}.` : "";
      return `One project I am really proud of is ${projTitle}${tech}.${desc} I measured impact using accuracy, precision, recall, and F1-score, and iterated on the model until I saw consistent improvement. It taught me a lot about building end-to-end ML systems under real constraints.`;
    }
    if (firstExpRole && firstExpCompany) {
      return `During my time at ${firstExpCompany} as a ${firstExpRole}, I worked on an ML pipeline where I handled data preprocessing, model selection, and evaluation using accuracy, precision, recall, and F1-score. Each iteration helped me understand what was really driving performance, and I kept refining until the results were solid and production-ready.`;
    }
    return `I identified a real-world problem, built a machine learning solution, and evaluated it rigorously using accuracy, precision, recall, and F1-score. I kept iterating on feature engineering and tuning until the model was reliable. Seeing it perform well after all those iterations was genuinely satisfying.`;
  }

  if (requiresStarMethodV2(questionType)) {
    const ctx = firstExpRole && firstExpCompany ? `${firstExpRole} at ${firstExpCompany}` : (projTitle || "one of my projects");
    return `Sure. Situation: While working as ${ctx}, I got feedback that a key feature was underperforming. Task: I needed to fix it without disrupting the rest of the system. Action: I broke it into smaller pieces, tested each fix independently, and incorporated feedback at every stage. Result: It not only fixed the problem but made the whole feature more stable and reliable.`;
  }

  if (questionType === "One-word incomplete answer") {
    const ctx = topSkills ? `my background in ${topSkills}` : "my experience";
    return `Let me give a fuller answer. Based on ${ctx}, I would approach this by first understanding the precise requirement, then applying a clear plan with checkpoints to validate the output at each stage. I always make sure results are measurable and tied to a defined goal.`;
  }

  // Follow-up — answer the specific question asked
  const q = String(question || "").toLowerCase();

  if (/why.*interest|reason.*apply|why.*${c.toLowerCase()}|why.*google|why.*microsoft|why.*amazon/i.test(q) || /why.*this.*company|why.*this.*role/i.test(q)) {
    const skillCtx = topSkills ? `skills in ${topSkills}` : "technical background";
    return `Honestly, ${c} is a place where I believe my ${skillCtx} can have real impact at scale. ${firstExpRole ? `As a ${firstExpRole}, I have already worked on systems that serve real users, and I want to take that further.` : ""} I admire how ${c} approaches engineering problems and I want to grow in that environment.`;
  }

  if (/strength|best quality|what.*bring|what.*offer/i.test(q)) {
    const s = topSkills || "problem-solving and technical execution";
    return `My strongest areas are ${s}. ${firstExpRole && firstExpCompany ? `At ${firstExpCompany}, I regularly used these to ship features and solve hard problems under tight timelines.` : ""} I also think clearly under pressure and communicate technical ideas well to non-technical stakeholders.`;
  }

  if (/weakness|improve|challenge|struggle/i.test(q)) {
    return `Honestly, I used to rush through explanations when I got excited about a topic. I realized this made it harder for others to follow. So I started practicing the habit of pausing, checking for understanding, and structuring what I say before I say it. It has made a noticeable difference in how I present ideas.`;
  }

  if (/project|built|developed|created/i.test(q)) {
    if (projTitle) {
      const tech = projTech ? ` using ${projTech.split(",").slice(0, 3).map(t => t.trim()).join(", ")}` : "";
      return `I built ${projTitle}${tech}. The biggest challenge was making it scale while keeping response times fast. I tackled it by optimizing the backend pipeline and adding fallback logic so users always got a response. Watching it handle real traffic reliably was a great moment.`;
    }
  }

  if (/experience|background|intern|job/i.test(q)) {
    if (firstExpRole && firstExpCompany) {
      return `At ${firstExpCompany}, I worked as a ${firstExpRole}. ${firstExpDesc ? `Day to day, I ${firstExpDesc.charAt(0).toLowerCase() + firstExpDesc.slice(1).replace(/\.$/, "")}.` : ""} That environment pushed me to write production-quality code and think about edge cases I never would have caught otherwise.`;
    }
  }

  if (/accuracy|model|train|data|ml|machine learn|deep learn|algorithm/i.test(q)) {
    if (projTitle) {
      return `For ${projTitle}, I started by training an initial model and checking the accuracy. It was not good enough at first, so I dug into the data, cleaned it more carefully, added better features, and tuned the hyperparameters. After a few rounds of that, the model performance improved significantly and gave consistent results.`;
    }
    return `I always start by understanding the data thoroughly before touching the model. Then I build a baseline, evaluate it honestly, and iterate. Each iteration I focus on one thing — whether that is the features, the regularization, or the architecture — so I can understand what is actually helping.`;
  }

  // Natural follow-up fallback — never mention role + company
  const base = firstExpRole && firstExpCompany
    ? `In my work at ${firstExpCompany} as a ${firstExpRole}`
    : projTitle ? `While building ${projTitle}` : "In my experience";
  return `${base}, I learned that the best approach is to break the problem down, tackle the highest-impact parts first, and validate as you go. I keep the end goal in mind but stay flexible about the path to get there.`;
};

const buildHrResponseV2 = (questionType: string, question: string, rawRoman: string, role?: string | null, company?: string | null) => {
  const normalizedRole = role || "Data Scientist";
  const normalizedCompany = company || "the company";
  if (questionType === "Greeting") {
    return `Please come in. Hello, I am [Your Name], a Senior HR Specialist at ${normalizedCompany}. Thank you for joining today for the ${normalizedRole} role. How are you doing today?`;
  }
  if (questionType === "One-word incomplete answer") {
    return "Could you please expand on that with context, your role, and the final outcome?";
  }
  if (questionType === "Technical project" || questionType === "Metrics/performance question") {
    return "Thank you. Could you explain the business problem, the tools you used, and the measurable impact of your approach?";
  }
  if (requiresStarMethodV2(questionType)) {
    return "That is helpful. Please walk me through the situation, your responsibility, the action you took, and the measurable result.";
  }
  if (/background|experience/i.test(question)) {
    return `Great. Could you connect that experience directly to how you can contribute as a ${normalizedRole} at ${normalizedCompany}?`;
  }
  return "Understood. Could you elaborate further with a clear and structured example?";
};

const ensureCorrectedVersion = (rawRoman: string, candidate: string) => {
  const fixed = normalizeToEnglishSafe(candidate || "");
  const fallback = basicGrammarCorrection(rawRoman);
  if (!fixed) return fallback;
  const normalizeComp = (s: string) => s.toLowerCase().replace(/[^a-z0-9]/g, "");
  if (normalizeComp(fixed) === normalizeComp(rawRoman)) {
    return fallback;
  }
  return fixed;
};

const heuristicEvaluateAnswerV2 = (
  question: string,
  rawAnswer: string,
  userName: string,
  role?: string | null,
  company?: string | null,
  profileContext?: string | null
): ArchiveEvaluation => {
  const questionType = classifyQuestionTypeV2(question, rawAnswer);
  const normalized = toRomanRaw(rawAnswer);
  const words = normalized ? normalized.split(/\s+/) : [];
  const repetitionDetected = detectRepetitionV2(normalized);
  const grammarErrorCount = countGrammarSignalsV2(normalized);
  const starRequired = requiresStarMethodV2(questionType);
  const structuredAnswer = toSentences(normalized).length >= 2;

  const identifiedErrors: string[] = [];
  const tags: string[] = [];

  if (!normalized) {
    identifiedErrors.push("No usable response captured for this prompt.");
    tags.push("Incomplete Thought");
  }

  if (questionType === "Greeting") {
    if (repetitionDetected) {
      identifiedErrors.push("Repetition detected in greeting response.");
      tags.push("Fluency Issue");
    }
    if (/\bsitting good\b/i.test(normalized) || /\bgood doing\b/i.test(normalized)) {
      identifiedErrors.push("Greeting phrasing is informal and grammatically incorrect.");
      tags.push("Grammar Issue");
    }
    if (!/\b(thank|well|good)\b/i.test(normalized)) {
      identifiedErrors.push("Greeting does not acknowledge the interviewer professionally.");
      tags.push("Confidence Issue");
    }
  } else if (questionType === "Technical project" || questionType === "Metrics/performance question") {
    if (!/\b(problem|use case|business)\b/i.test(normalized)) {
      identifiedErrors.push("No business problem or context is clearly defined.");
      tags.push("Weak Structure");
    }
    if (!/\b(python|sql|api|model|random forest|xgboost|tensorflow|pytorch|spark|bigquery|hadoop|aws)\b/i.test(normalized)) {
      identifiedErrors.push("Tools or technologies are not clearly mentioned.");
      tags.push("Weak Structure");
    }
    if (!/\baccuracy|precision|recall|f1|auc|latency|%|\d+\b/i.test(normalized)) {
      identifiedErrors.push("Evaluation metrics are missing or unclear.");
      tags.push("Lack of Metrics");
    }
    if (!/\bimpact|improved|reduced|increased|result|outcome\b/i.test(normalized)) {
      identifiedErrors.push("Business impact or measurable result is not stated.");
      tags.push("Lack of Business Impact");
    }
  } else if (starRequired) {
    if (!structuredAnswer || !/\b(situation|task|action|result|because|therefore|then)\b/i.test(normalized)) {
      identifiedErrors.push("Behavioral response is not structured using Situation, Task, Action, and Result.");
      tags.push("STAR Required");
    }
    if (words.length < 12) {
      identifiedErrors.push("Response is too short for a behavioral or leadership question.");
      tags.push("Incomplete Thought");
    }
  } else if (questionType === "One-word incomplete answer") {
    identifiedErrors.push("Response is too short for interview context.");
    tags.push("Incomplete Thought");
  }

  if (/[a-z][.!?]?\s*$/.test(normalized) && !/[.!?]$/.test(normalized)) {
    identifiedErrors.push("Sentence ending punctuation is missing.");
    tags.push("Grammar Issue");
  }
  if (/\bi\b/.test(normalized)) {
    identifiedErrors.push('Pronoun capitalization issue detected ("i" should be "I").');
    tags.push("Grammar Issue");
  }
  if (!/\b(I|my|we)\b/.test(normalized) && normalized) {
    identifiedErrors.push("Answer lacks ownership language and confident framing.");
    tags.push("Confidence Issue");
  }
  if (words.length <= 2) {
    tags.push("Incomplete Thought");
  }

  const uniqueErrors = Array.from(new Set(identifiedErrors));
  const uniqueTags = ensureTagRange(Array.from(new Set(tags)));
  const correctedVersionRaw = basicGrammarCorrection(normalized);
  const correctedVersion = isEnglishOnlyText(correctedVersionRaw)
    ? correctedVersionRaw
    : normalizeToEnglishSafe(correctedVersionRaw) || "I would like to answer this clearly.";
  const bestProfessionalAnswerRaw = buildProfessionalAnswerV2(questionType, question, rawAnswer, userName, role, company, profileContext);
  const bestProfessionalAnswer = isEnglishOnlyText(bestProfessionalAnswerRaw)
    ? bestProfessionalAnswerRaw
    : normalizeToEnglishSafe(bestProfessionalAnswerRaw) || "I would like to provide a clear and professional response.";

  const improvementCategory = Array.from(
    new Set(
      uniqueTags.map((tag) => {
        if (tag === "Grammar Issue") return "Grammar";
        if (tag === "Fluency Issue") return "Fluency";
        if (tag === "Confidence Issue") return "Confidence";
        if (tag === "Lack of Metrics") return "Metrics";
        if (tag === "Lack of Business Impact") return "Business Impact";
        if (tag === "STAR Required") return "STAR";
        if (tag === "Weak Structure" || tag === "Incomplete Thought") return "Structure";
        return "Communication";
      })
    )
  ).join(" + ");

  let performanceTag = "Communication Improvement Required";
  if (grammarErrorCount > 5) {
    performanceTag = "High Grammar Risk";
  } else if (uniqueTags.includes("Fluency Issue")) {
    performanceTag = "Fluency Issue";
  } else if (uniqueTags.includes("STAR Required")) {
    performanceTag = "Lack of STAR Method";
  } else if (uniqueTags.includes("Lack of Metrics") || uniqueTags.includes("Lack of Business Impact")) {
    performanceTag = "Technical Depth Weak";
  } else if (uniqueTags.length === 0) {
    performanceTag = "Strong Structured Answer";
  }

  return {
    userRawRoman: normalized,
    hrResponse: buildHrResponseV2(questionType, question, normalized, role, company),
    identifiedErrors: uniqueErrors.length ? uniqueErrors : ["No major issues detected."],
    correctedVersion: ensureCorrectedVersion(normalized, correctedVersion),
    bestProfessionalAnswer,
    issueTypes: uniqueTags.length ? uniqueTags : ["Grammar Issue"],
    improvementCategory: improvementCategory || "Grammar + Structure + Confidence",
    performanceTag,
    grammarErrorCount,
    repetitionDetected,
    structuredAnswer,
  };
};

const evaluateAnswerWithAIV2 = async (
  question: string,
  rawAnswer: string,
  userName: string,
  role?: string | null,
  company?: string | null,
  profileContext?: string | null
) => {
  const questionType = classifyQuestionTypeV2(question, rawAnswer);
  const rawRoman = toRomanRaw(rawAnswer);
  const fallback = () => heuristicEvaluateAnswerV2(question, rawAnswer, userName, role, company, profileContext);
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) return fallback();

  try {
    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({
      model: "gemini-2.5-flash",
      generationConfig: { responseMimeType: "application/json", temperature: 0.2 },
    });

    const prompt = `
You are FluenzyAI Interview Intelligence Engine.
Question type: ${questionType}
Candidate: ${userName}
Target role: ${role || "General Role"}
Target company: ${company || "General"}

${profileContext ? `=== CANDIDATE PROFILE (USE THIS TO PERSONALIZE THE ANSWER) ===\n${profileContext}\n=== END PROFILE ===\n` : ""}
INTERVIEWER QUESTION: ${question}
CANDIDATE RAW ANSWER (Roman script): ${rawRoman}

Return strict JSON:
{
  "userRawRoman": "...",
  "hrResponse": "...",
  "identifiedErrors": ["..."],
  "correctedVersion": "...",
  "bestProfessionalAnswer": "...",
  "issueTypes": ["Grammar Issue|Fluency Issue|Incomplete Thought|Lack of Metrics|Lack of Business Impact|Weak Structure|Confidence Issue|STAR Required"],
  "improvementCategory": "...",
  "performanceTag": "High Grammar Risk|Fluency Issue|Lack of STAR Method|Technical Depth Weak|Strong Structured Answer|Communication Improvement Required",
  "grammarErrorCount": 0,
  "repetitionDetected": false,
  "structuredAnswer": true
}

GRAMMAR ERROR RULES (check ALL of these):
- Lowercase "i" should be "I" — flag it.
- Missing sentence-ending punctuation (. ! ?) — flag it.
- Subject-verb disagreement (e.g. "I are", "he have") — flag it.
- Wrong tense (e.g. "I done" instead of "I did") — flag it.
- Missing articles (a/an/the) where required — flag it.
- Double words or repeated phrases — flag as Repetition.
- Very short/incomplete answer (under 5 words for non-greeting) — flag as Incomplete Thought.
- Missing ownership language (no I/my/we) — flag as Confidence Issue.
- Wrong prepositions (e.g. "good in English" vs "good at English") — flag it.
- Comma splices or run-on sentences — flag it.
- If no grammar errors at all, identifiedErrors must say ["No grammar or structure errors detected."].

BEST PROFESSIONAL ANSWER RULES:
- Must DIRECTLY answer the EXACT question asked: "${question}"
- Must sound like a REAL human speaking in an interview — natural, confident, not robotic.
- Use the CANDIDATE PROFILE above to make the answer specific and grounded:
  * Greeting: confirm you are doing well, say your name, mention current role if available.
  * Introduction/background: mention actual job title, company, skills, education from profile.
  * Technical/project: name the actual project, tech stack, what you built and measured.
  * Behavioral (STAR): use a real experience from the profile as the Situation.
  * Follow-up: directly continue the conversation thread, answer what was asked.
- CRITICAL: Do NOT end every answer with "for the [role] role at [company]" — only use role+company where it sounds natural (greeting, intro). Other answers must NOT append this.
- NEVER say "I use a structured approach", "define the problem, explain the method", "I am preparing for", "aligned with X expectations at Y".
- Must be 3-5 natural conversational sentences.
- This is the best possible answer the candidate could give — memorizing it should help them pass the actual interview.

OTHER RULES:
- Output must be in English only using A-Z letters.
- Do not output Devanagari, Urdu, or transliterated Hindi.
- userRawRoman must be Roman script only.
- hrResponse must be a natural follow-up interviewer line after the candidate's answer.
- Do not force STAR for Greeting/Introduction.
- Corrected version must be grammar-only correction of the raw answer, nothing else.`;

    const result = await model.generateContent(prompt);
    const parsed = JSON.parse(result.response.text().replace(/```json\n?|\n?```/g, "").trim());
    const output: ArchiveEvaluation = {
      userRawRoman: normalizeToEnglishSafe(String(parsed.userRawRoman || rawRoman)),
      hrResponse: normalizeToEnglishSafe(
        String(parsed.hrResponse || buildHrResponseV2(questionType, question, rawRoman, role, company))
      ),
      identifiedErrors: Array.isArray(parsed.identifiedErrors)
        ? parsed.identifiedErrors.filter((x: unknown) => typeof x === "string").slice(0, 8)
        : [],
      correctedVersion: String(parsed.correctedVersion || "").trim(),
      bestProfessionalAnswer: String(parsed.bestProfessionalAnswer || "").trim(),
      issueTypes: Array.isArray(parsed.issueTypes)
        ? parsed.issueTypes.filter((x: unknown) => typeof x === "string").slice(0, 6)
        : [],
      improvementCategory: String(parsed.improvementCategory || "").trim(),
      performanceTag: String(parsed.performanceTag || "").trim(),
      grammarErrorCount: Number(parsed.grammarErrorCount || 0),
      repetitionDetected: Boolean(parsed.repetitionDetected),
      structuredAnswer: Boolean(parsed.structuredAnswer),
    };

    const genericPattern = /i am .*preparing for|interview simulations and feedback|continuously improving through|to clarify, i use a structured approach|define the problem, explain the method|present measurable results aligned with|i would like to answer this|i focus on structured communication/i;
    if (!output.correctedVersion || !output.bestProfessionalAnswer || genericPattern.test(output.bestProfessionalAnswer)) {
      return fallback();
    }
    output.userRawRoman = normalizeToEnglishSafe(output.userRawRoman || rawRoman);
    output.hrResponse = normalizeToEnglishSafe(
      output.hrResponse || buildHrResponseV2(questionType, question, rawRoman, role, company)
    );
    output.correctedVersion = normalizeToEnglishSafe(output.correctedVersion);
    output.bestProfessionalAnswer = normalizeToEnglishSafe(output.bestProfessionalAnswer);
    output.identifiedErrors = output.identifiedErrors.map((x) => normalizeToEnglishSafe(x)).filter(Boolean);
    output.issueTypes = ensureTagRange(output.issueTypes.map((x) => normalizeToEnglishSafe(x)).filter(Boolean));
    output.improvementCategory = normalizeToEnglishSafe(output.improvementCategory);
    output.performanceTag = normalizeToEnglishSafe(output.performanceTag);

    if (
      !isEnglishOnlyText(output.userRawRoman || "") ||
      !isEnglishOnlyText(output.hrResponse || "") ||
      !isEnglishOnlyText(output.correctedVersion) ||
      !isEnglishOnlyText(output.bestProfessionalAnswer)
    ) {
      return fallback();
    }
    output.correctedVersion = ensureCorrectedVersion(output.userRawRoman || rawRoman, output.correctedVersion);
    if (!output.identifiedErrors.length) output.identifiedErrors = ["No major issues detected."];
    if (!output.issueTypes.length) output.issueTypes = ["Grammar Issue", "Confidence Issue"];
    if (!output.improvementCategory) output.improvementCategory = "Grammar + Structure + Confidence";
    if (!output.performanceTag) output.performanceTag = "Communication Improvement Required";
    return output;
  } catch (error) {
    console.error("Per-answer AI evaluation V2 failed, using heuristic fallback:", error);
    return fallback();
  }
};

const clampPercent = (value: unknown) => {
  const parsed = Number(value);
  if (!Number.isFinite(parsed)) return 0;
  return Math.max(0, Math.min(100, parsed));
};

const formatPercent = (value: number) => `${Math.round(clampPercent(value))}%`;

const getStatusLabel = (value: number, invert = false): MetricRow["status"] => {
  const normalized = invert ? 100 - clampPercent(value) : clampPercent(value);
  if (normalized >= 85) return "Excellent";
  if (normalized >= 70) return "Good";
  if (normalized >= 50) return "Needs Improvement";
  return "Critical";
};

const explanationForMetric = (name: string, value: number, status: MetricRow["status"]) => {
  const rounded = Math.round(clampPercent(value));
  switch (name) {
    case "Confidence":
      return status === "Excellent"
        ? "Delivery remained stable and assured throughout the interview."
        : `Confidence signals fluctuated and averaged ${rounded}%, indicating room for stronger delivery control.`;
    case "Eye Contact":
      return status === "Excellent"
        ? "Camera engagement stayed consistent and interviewer-facing."
        : "Frequent gaze shifts reduced perceived confidence in multiple moments.";
    case "Posture":
      return status === "Excellent"
        ? "Body alignment remained professional and interview-ready."
        : "Posture drift suggests improving upright alignment and shoulder stability.";
    case "Smile":
      return status === "Excellent"
        ? "Facial tone looked approachable and naturally engaged."
        : "Expression appeared neutral or tense in key response windows.";
    case "Engagement":
      return status === "Excellent"
        ? "Visual engagement stayed strong with active interviewer presence."
        : "Engagement signals dropped intermittently during responses.";
    case "Stress Level":
      return status === "Excellent"
        ? "Stress indicators remained low and controlled."
        : "Elevated stress markers appeared in challenging response phases.";
    case "Stress Control":
      return status === "Excellent"
        ? "Composure remained steady under pressure."
        : "Composure dipped in parts of the interview; regulation techniques are recommended.";
    case "Focus":
      return status === "Excellent"
        ? "Attention stability remained consistent across the session."
        : "Attention continuity can improve with tighter camera and response discipline.";
    case "Face Detection Status":
      return status === "Excellent"
        ? "Face detection remained consistently available for analysis."
        : "Face tracking interruptions reduced continuity of behavioral scoring.";
    case "Expression Analysis":
      return status === "Excellent"
        ? "Facial expression stayed positive and interview-appropriate."
        : "Expression signals indicate opportunities for more natural, positive affect.";
    default:
      return `${name} scored ${rounded}% (${status}).`;
  }
};

const normalizeIssueLabel = (code?: string) => {
  const key = String(code || "").toUpperCase();
  if (key === "LOW_EYE_CONTACT") return "Low Eye Contact";
  if (key === "POOR_POSTURE") return "Poor Posture";
  if (key === "HIGH_STRESS") return "High Stress";
  if (key === "NO_FACE") return "Face Not Detected";
  if (key === "NEGATIVE_EXPRESSION") return "Negative Expression";
  if (key === "LOW_ENGAGEMENT") return "Low Engagement";
  return key.replace(/_/g, " ").trim() || "Behavioral Alert";
};

const analyzeSnapshotWithVision = async (
  imageData: string,
  issueCode: string | undefined,
  fallbackObs: string,
  fallbackSugg: string
): Promise<{ observation: string; suggestion: string }> => {
  try {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey || !imageData.startsWith("data:image/jpeg;base64,")) {
      return { observation: fallbackObs, suggestion: fallbackSugg };
    }
    const base64Only = imageData.replace(/^data:image\/jpeg;base64,/, "");
    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash" });
    const prompt = `You are a professional interview coach analyzing a single video frame captured during a mock job interview.\n\nLook carefully at this specific image and describe what you actually see:\n1. OBSERVATION: What behavioral issue is visible in THIS frame? Be specific about posture, gaze direction, head angle, shoulder position, facial tension, or expression. Do NOT give a generic description — describe only what is visually present.\n2. SUGGESTION: Give ONE clear, actionable correction the candidate can apply immediately.\n\nSystem flagged issue: ${normalizeIssueLabel(issueCode)}\n\nRespond in this exact format (two lines only):\nOBSERVATION: <specific visual observation>\nSUGGESTION: <one actionable correction>`;
    const result = await model.generateContent([
      { text: prompt },
      { inlineData: { mimeType: "image/jpeg", data: base64Only } },
    ]);
    const text = result.response.text().trim();
    const obsMatch = text.match(/OBSERVATION:\s*(.+)/i);
    const suggMatch = text.match(/SUGGESTION:\s*(.+)/i);
    return {
      observation: obsMatch?.[1]?.trim() || fallbackObs,
      suggestion: suggMatch?.[1]?.trim() || fallbackSugg,
    };
  } catch {
    return { observation: fallbackObs, suggestion: fallbackSugg };
  }
};

const buildRecommendationList = (metrics: MetricRow[]) => {
  const needsWork = new Set(
    metrics.filter((m) => m.status === "Needs Improvement" || m.status === "Critical").map((m) => m.name)
  );
  const recommendations: string[] = [];

  if (needsWork.has("Posture")) {
    recommendations.push("Improve posture by sitting upright with shoulders aligned and head centered.");
  }
  if (needsWork.has("Stress Level") || needsWork.has("Stress Control")) {
    recommendations.push("Reduce stress with controlled breathing before and between answers.");
  }
  if (needsWork.has("Eye Contact")) {
    recommendations.push("Maintain consistent eye contact by focusing on the camera lens while speaking.");
  }
  if (needsWork.has("Engagement") || needsWork.has("Focus")) {
    recommendations.push("Avoid long pauses and filler transitions; keep responses concise and structured.");
  }
  if (needsWork.has("Expression Analysis") || needsWork.has("Smile")) {
    recommendations.push("Show natural facial engagement to appear confident and approachable.");
  }
  if (needsWork.has("Face Detection Status")) {
    recommendations.push("Stabilize camera framing and lighting to keep your face consistently detectable.");
  }
  if (!recommendations.length) {
    recommendations.push("Maintain current behavioral consistency and continue mock sessions for reinforcement.");
  }

  return recommendations;
};

const findBestBehavioralDoc = async (userId: string, sessionStart: Date, sessionEnd: Date) => {
  try {
    const raw = await (prisma as any).$runCommandRaw({
      find: BEHAVIORAL_COLLECTION,
      filter: { userId },
      sort: { createdAt: -1 },
      limit: 40,
    });

    const docs: BehavioralDoc[] = raw?.cursor?.firstBatch || [];
    if (!docs.length) return null;

    const scored = docs
      .map((doc) => {
        const started = doc.startedAt ? new Date(doc.startedAt) : null;
        const ended = doc.endedAt ? new Date(doc.endedAt) : null;
        if (!started || Number.isNaN(started.getTime())) return null;
        const safeEnd = ended && !Number.isNaN(ended.getTime()) ? ended : started;

        const overlapMs = Math.max(
          0,
          Math.min(sessionEnd.getTime(), safeEnd.getTime()) - Math.max(sessionStart.getTime(), started.getTime())
        );
        const midpoint = (started.getTime() + safeEnd.getTime()) / 2;
        const sessionMidpoint = (sessionStart.getTime() + sessionEnd.getTime()) / 2;
        const distanceMs = Math.abs(midpoint - sessionMidpoint);

        return { doc, overlapMs, distanceMs };
      })
      .filter(Boolean)
      .sort((a: any, b: any) => {
        if (b.overlapMs !== a.overlapMs) return b.overlapMs - a.overlapMs;
        return a.distanceMs - b.distanceMs;
      });

    const best = scored[0];
    if (!best) return null;
    const maxDistanceMs = 4 * 60 * 60 * 1000;
    if (best.overlapMs === 0 && best.distanceMs > maxDistanceMs) return null;

    return best.doc as BehavioralDoc;
  } catch (error) {
    console.error("Behavioral analytics fetch error:", error);
    return null;
  }
};

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { sessionId } = await request.json();

    const user = await prisma.users.findUnique({
      where: { email: session.user.email },
    });

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    const sessionData = await (prisma as any).session.findFirst({
      where: {
        sessionId,
        userId: user.id,
      },
      include: {
        transcripts: {
          orderBy: [{ createdAt: "asc" }, { turnNumber: "asc" }],
        },
      },
    });

    if (!sessionData) {
      return NextResponse.json({ error: "Session not found" }, { status: 404 });
    }

    let { subScores } = calculateInterviewScore(sessionData.transcripts);
    const score = Math.round((sessionData.aggregateScore || 0) * 100);
    const status = sessionData.status || "Incomplete";

    if (
      score > 0 &&
      subScores.technical === 0 &&
      subScores.communication === 0 &&
      subScores.grammar === 0 &&
      subScores.confidence === 0
    ) {
      const targetTotal = Math.round((score / 100) * 40);
      subScores.technical = Math.min(Math.round(targetTotal * 0.35), 9);
      subScores.communication = Math.min(Math.round(targetTotal * 0.25), 8);
      subScores.confidence = Math.min(Math.round(targetTotal * 0.25), 7);
      subScores.grammar = Math.max(
        targetTotal - subScores.technical - subScores.communication - subScores.confidence,
        2
      );
    }

    const sessionStart = new Date(sessionData.startTime);
    const sessionEnd =
      sessionData.endTime && !Number.isNaN(new Date(sessionData.endTime).getTime())
        ? new Date(sessionData.endTime)
        : new Date(sessionStart.getTime() + 60 * 60 * 1000);
    const behavioralDoc = await findBestBehavioralDoc(user.id, sessionStart, sessionEnd);
    const summary = (behavioralDoc?.summary || {}) as Record<string, unknown>;
    const rawSnapshots =
      Array.isArray(behavioralDoc?.alertSnapshots) && behavioralDoc?.alertSnapshots.length
        ? behavioralDoc.alertSnapshots.slice(0, 4)
        : [];
    const snapshots = await Promise.all(
      rawSnapshots.map(async (s) => {
        const fallbackObs = s.observation || "Behavioral deviation detected during the interview.";
        const fallbackSugg = s.suggestion || "Apply posture, gaze, and composure corrections in the next response.";
        if (s.imageData && s.imageData.startsWith("data:image/jpeg;base64,")) {
          const { observation, suggestion } = await analyzeSnapshotWithVision(
            s.imageData,
            s.issueCode,
            fallbackObs,
            fallbackSugg
          );
          return { ...s, observation, suggestion };
        }
        return { ...s, observation: fallbackObs, suggestion: fallbackSugg };
      })
    );

    const confidence = clampPercent(summary.confidence);
    const eyeContact = clampPercent(summary.eye_contact);
    const posture = clampPercent(summary.posture);
    const smile = clampPercent(summary.smile);
    const engagement = clampPercent(summary.engagement);
    const stressLevel = clampPercent(summary.stress_level);
    const stressControl = clampPercent(100 - stressLevel);
    const headStability = clampPercent(summary.head_stability);
    const focus = clampPercent((engagement + eyeContact + headStability) / 3);
    const faceDetectionStatus = clampPercent(summary.face_detected_rate);
    const expressionAnalysis = clampPercent((smile + (100 - stressLevel)) / 2);

    const behavioralMetrics: MetricRow[] = [
      { name: "Confidence", value: confidence, status: getStatusLabel(confidence), explanation: "" },
      { name: "Eye Contact", value: eyeContact, status: getStatusLabel(eyeContact), explanation: "" },
      { name: "Posture", value: posture, status: getStatusLabel(posture), explanation: "" },
      { name: "Smile", value: smile, status: getStatusLabel(smile), explanation: "" },
      { name: "Engagement", value: engagement, status: getStatusLabel(engagement), explanation: "" },
      { name: "Stress Level", value: stressLevel, status: getStatusLabel(stressLevel, true), explanation: "" },
      { name: "Stress Control", value: stressControl, status: getStatusLabel(stressControl), explanation: "" },
      { name: "Focus", value: focus, status: getStatusLabel(focus), explanation: "" },
      {
        name: "Face Detection Status",
        value: faceDetectionStatus,
        status: getStatusLabel(faceDetectionStatus),
        explanation: "",
      },
      {
        name: "Expression Analysis",
        value: expressionAnalysis,
        status: getStatusLabel(expressionAnalysis),
        explanation: "",
      },
    ].map((metric) => ({
      ...metric,
      explanation: explanationForMetric(metric.name, metric.value, metric.status),
    }));

    const averageBehavioral =
      behavioralMetrics.reduce((sum, metric) => sum + clampPercent(metric.value), 0) / behavioralMetrics.length;
    const averageBehavioralStatus = getStatusLabel(averageBehavioral);
    const recommendations = buildRecommendationList(behavioralMetrics);

    const hasBehavioralData = behavioralDoc && Object.keys(summary).length > 0;
    const orderedTranscripts = [...sessionData.transcripts].sort(
      (a: any, b: any) =>
        new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime() || (a.turnNumber || 0) - (b.turnNumber || 0)
    );
    // ── Fetch user profile with all sections ──────────────────────────────
    const userProfile = await (prisma as any).userProfile.findUnique({
      where: { userId: user.id },
      include: {
        skills: true,
        experiences: true,
        educations: true,
        certifications: true,
        projects: true,
        courses: true,
        languages: true,
      },
    });

    // ── Fetch last 5 session scores for history context ─────────────────────
    const recentSessions = await (prisma as any).session.findMany({
      where: { userId: user.id, aggregateScore: { not: null } },
      orderBy: { startTime: "desc" },
      take: 5,
      select: { targetCompany: true, role: true, aggregateScore: true, startTime: true },
    });

    // ── Build compact profile context string ────────────────────────────────
    const buildProfileContext = () => {
      const lines: string[] = [];
      if (user.name) lines.push(`Name: ${user.name}`);
      if (userProfile?.headline) lines.push(`Headline: ${userProfile.headline}`);
      if (userProfile?.bio) lines.push(`Bio: ${userProfile.bio}`);

      if (userProfile?.skills?.length) {
        lines.push(`Skills: ${userProfile.skills.map((s: any) => `${s.name} (${s.level})`).join(", ")}`);
      }
      if (userProfile?.languages?.length) {
        lines.push(`Languages: ${userProfile.languages.map((l: any) => `${l.name} (${l.proficiency})`).join(", ")}`);
      }
      if (userProfile?.experiences?.length) {
        lines.push(`Experience:`);
        userProfile.experiences.slice(0, 4).forEach((e: any) => {
          const period = `${new Date(e.startDate).getFullYear()} – ${e.endDate ? new Date(e.endDate).getFullYear() : "Present"}`;
          lines.push(`  - ${e.role} at ${e.company} (${period})${e.description ? ": " + String(e.description).slice(0, 120) : ""}`);
        });
      }
      if (userProfile?.educations?.length) {
        lines.push(`Education:`);
        userProfile.educations.slice(0, 3).forEach((ed: any) => {
          lines.push(`  - ${ed.degree} at ${ed.institution} (${ed.startYear} – ${ed.endYear || "Present"})${ed.grade ? ", Grade: " + ed.grade : ""}`);
        });
      }
      if (userProfile?.projects?.length) {
        lines.push(`Projects:`);
        userProfile.projects.slice(0, 4).forEach((p: any) => {
          lines.push(`  - ${p.title}${p.techStack ? " [Tech: " + p.techStack + "]" : ""}${p.description ? ": " + String(p.description).slice(0, 100) : ""}`);
        });
      }
      if (userProfile?.certifications?.length) {
        lines.push(`Certifications: ${userProfile.certifications.map((c: any) => `${c.name} by ${c.issuer}`).join("; ")}`);
      }
      if (userProfile?.courses?.length) {
        lines.push(`Courses: ${userProfile.courses.map((c: any) => `${c.name} (${c.platform})`).join("; ")}`);
      }
      if (recentSessions?.length) {
        lines.push(`Recent interview history (last ${recentSessions.length} sessions):`);
        recentSessions.forEach((s: any) => {
          const sc = Math.round((s.aggregateScore || 0) * 100);
          lines.push(`  - ${s.role || "Role"} at ${s.targetCompany || "General"}: ${sc}% (${new Date(s.startTime).toLocaleDateString()})`);
        });
      }
      return lines.join("\n");
    };
    const profileContext = buildProfileContext();

    const archiveEvaluations = await Promise.all(
      orderedTranscripts.map((turn: any) =>
        evaluateAnswerWithAIV2(
          turn.aiPrompt,
          turn.userAnswer,
          user.name || "Candidate",
          sessionData.role,
          sessionData.targetCompany,
          profileContext
        )
      )
    );

    const html = `
      <!DOCTYPE html>
      <html>
        <head>
          <title>FluenzyAI Performance Report - ${sessionData.sessionId}</title>
          <style>
            @page { size: A4; margin: 15mm; }
            body { font-family: 'Inter', sans-serif; color: #0f172a; margin: 0; padding: 20px; font-size: 10pt; line-height: 1.6; }
            .header { border-bottom: 3px solid #0f172a; padding-bottom: 20px; margin-bottom: 30px; display: flex; justify-content: space-between; align-items: flex-end; }
            .title { font-size: 22pt; font-weight: 900; letter-spacing: -0.02em; text-transform: uppercase; }
            .meta { font-size: 8pt; font-weight: 700; color: #64748b; text-transform: uppercase; letter-spacing: 0.1em; }
            .section { margin-bottom: 40px; page-break-inside: avoid; }
            .section-title { font-size: 14pt; font-weight: 900; background: #f8fafc; padding: 10px 15px; border-left: 6px solid #0f172a; margin-bottom: 20px; text-transform: uppercase; }
            .subsection-title { font-size: 10.5pt; font-weight: 800; margin: 18px 0 10px 0; text-transform: uppercase; color: #1e293b; }
            .turn { margin-bottom: 24px; padding: 16px; border-radius: 8px; border: 1px solid #e2e8f0; }
            .label { font-size: 7pt; font-weight: 900; text-transform: uppercase; margin-bottom: 5px; display: block; }
            .label.ai { color: #2563eb; }
            .label.user { color: #64748b; }
            .person-block { margin-bottom: 12px; }
            .person-name { font-size: 11pt; font-weight: 900; text-transform: uppercase; letter-spacing: 0.06em; margin-bottom: 4px; }
            .person-name.user-name { color: #1e293b; border-left: 4px solid #64748b; padding-left: 8px; }
            .person-name.hr-name { color: #1d4ed8; border-left: 4px solid #2563eb; padding-left: 8px; }
            .bubble { padding: 10px 14px; border-radius: 6px; font-size: 10pt; }
            .bubble.ai { background: #eff6ff; color: #1e40af; border: 1px solid #dbeafe; font-weight: 600; }
            .bubble.user { background: #f8fafc; color: #334155; border: 1px solid #e2e8f0; }
            .bubble.correction { background: #f8fafc; color: #0f172a; border: 1px solid #e2e8f0; }
            .bubble.best { background: #f0fdf4; color: #14532d; border: 1px solid #86efac; font-weight: 600; }
            .footer { position: fixed; bottom: 0; left: 0; right: 0; text-align: center; font-size: 7pt; color: #94a3b8; border-top: 1px solid #f1f5f9; padding-top: 10px; }
            .scores { display: flex; justify-content: space-between; margin-bottom: 20px; }
            .score-item { text-align: center; }
            .score-value { font-size: 18pt; font-weight: 900; }
            .score-label { font-size: 8pt; font-weight: 700; text-transform: uppercase; }
            .analysis-block { margin-top: 10px; padding: 10px; border-radius: 8px; border: 1px solid #e2e8f0; background: #ffffff; }
            .analysis-title { font-size: 8pt; font-weight: 800; text-transform: uppercase; color: #334155; margin-bottom: 6px; }
            .analysis-list { margin: 0; padding-left: 18px; color: #334155; font-size: 9pt; }
            .analysis-list li { margin: 3px 0; }
            .chip-wrap { margin-top: 8px; display: flex; flex-wrap: wrap; gap: 6px; }
            .chip { border: 1px solid #cbd5e1; border-radius: 999px; padding: 2px 8px; font-size: 8pt; font-weight: 700; color: #334155; background: #f8fafc; }
            .tag { margin-top: 8px; font-size: 8.5pt; font-weight: 700; color: #1f2937; }
            .metric-row { border: 1px solid #e2e8f0; border-radius: 8px; padding: 10px 12px; margin-bottom: 10px; background: #ffffff; }
            .metric-header { display: flex; justify-content: space-between; gap: 10px; font-weight: 800; }
            .metric-status { font-size: 8pt; letter-spacing: 0.03em; text-transform: uppercase; color: #334155; }
            .metric-note { margin-top: 4px; color: #475569; font-size: 9pt; }
            .snapshot-card { border: 1px solid #e2e8f0; border-radius: 12px; overflow: hidden; margin-bottom: 18px; background: #ffffff; box-shadow: 0 1px 6px rgba(0,0,0,0.07); }
            .snapshot-header { display: flex; align-items: center; gap: 10px; padding: 8px 14px; border-bottom: 1px solid #e2e8f0; background: #f8fafc; }
            .snapshot-badge { border-radius: 999px; padding: 3px 10px; font-size: 8pt; font-weight: 800; text-transform: uppercase; letter-spacing: 0.06em; }
            .snapshot-ts { font-size: 7.5pt; color: #64748b; font-weight: 600; margin-left: auto; }
            .snapshot-body { display: flex; }
            .snapshot-img-wrap { flex: 0 0 42%; background: #0f172a; display: flex; align-items: center; justify-content: center; min-height: 160px; }
            .snapshot-img-wrap img { width: 100%; height: 200px; object-fit: cover; display: block; }
            .snapshot-analysis { flex: 1; padding: 14px 16px; display: flex; flex-direction: column; gap: 10px; background: #f8fafc; }
            .snapshot-obs-title { font-size: 7.5pt; font-weight: 800; text-transform: uppercase; color: #475569; letter-spacing: 0.05em; margin-bottom: 3px; }
            .snapshot-obs-text { font-size: 9pt; color: #1e293b; line-height: 1.55; }
            .snapshot-sugg-box { background: #eff6ff; border-left: 3px solid #3b82f6; border-radius: 4px; padding: 8px 10px; }
            .snapshot-sugg-title { font-size: 7pt; font-weight: 800; text-transform: uppercase; color: #1d4ed8; letter-spacing: 0.05em; margin-bottom: 2px; }
            .snapshot-sugg-text { font-size: 8.5pt; color: #1e3a8a; line-height: 1.4; }
            .recommendations { padding-left: 18px; margin: 8px 0 0; }
            .recommendations li { margin: 6px 0; }
            .page-break { page-break-before: always; }
          </style>
        </head>
        <body>
          <div class="header">
            <div>
              <div class="title">FluenzyAI Performance Report</div>
              <div class="meta">Session Archive: ${sessionData.sessionId}</div>
            </div>
            <div class="meta" style="text-align: right;">
              Date: ${sessionData.startTime.toLocaleDateString()}<br/>
              Score: ${score}%
            </div>
          </div>

          <div class="section">
            <div class="section-title">1. EXECUTIVE SUMMARY</div>
            <p><strong>Candidate Name:</strong> ${user.name}</p>
            <p><strong>Target Company:</strong> ${sessionData.targetCompany || "N/A"}</p>
            <p><strong>Role:</strong> ${sessionData.role || "N/A"}</p>
            <p><strong>Date:</strong> ${sessionData.startTime.toLocaleDateString()}</p>
            <p><strong>Aggregate Score:</strong> ${score}%</p>
            <p><strong>Final Status:</strong> ${status}</p>
          </div>

          <div class="section">
            <div class="section-title">2. FULL CONVERSATION ARCHIVE</div>
            ${orderedTranscripts
              .map((t: any, idx: number) => {
                const evaluation = archiveEvaluations[idx];
                const candidateName = escapeHtml((user.name || "CANDIDATE").toUpperCase());
                const hrLabel = escapeHtml("HR " + (sessionData.targetCompany || "INTERVIEWER").toUpperCase());
                const rawUserAnswer = escapeHtml(String(evaluation.userRawRoman || toRomanRaw(String(t.userAnswer || ""))));
                const hrText = escapeHtml(String(t.aiPrompt || "(no prompt)"));
                // If HR aiPrompt is a "come in" welcome response, user knocked/spoke first
                const userSpokeFirst = /^(please come in|come in|yes come in|do come in|yes please)/i.test(String(t.aiPrompt || "").trim());

                const userBlock = `
                  <div class="person-block">
                    <div class="person-name user-name">${candidateName}:</div>
                    <div class="bubble user">${rawUserAnswer}</div>
                  </div>`;

                const hrBlock = `
                  <div class="person-block">
                    <div class="person-name hr-name">${hrLabel}:</div>
                    <div class="bubble ai">${hrText}</div>
                  </div>`;

                return `
              <div class="turn">
                <div class="tag" style="margin-bottom:10px;color:#64748b;font-size:8pt;"><strong>Timestamp:</strong> ${escapeHtml(formatArchiveTimestamp(t.createdAt))}</div>

                ${userSpokeFirst ? userBlock + hrBlock : hrBlock + userBlock}

                <div class="analysis-block">
                  <div class="analysis-title">ERROR ANALYSIS</div>
                  <ul class="analysis-list">
                    ${evaluation.identifiedErrors.map((err: string) => `<li>${escapeHtml(err)}</li>`).join("")}
                  </ul>
                </div>

                <div class="analysis-block">
                  <div class="analysis-title">AI SUGGESTED BEST PROFESSIONAL ANSWER (Personalized)</div>
                  <div class="bubble best">${escapeHtml(evaluation.bestProfessionalAnswer)}</div>
                  <div class="tag" style="margin-top:8px;"><strong>Question Type:</strong> ${escapeHtml(classifyQuestionTypeV2(String(t.aiPrompt || ""), String(t.userAnswer || "")))}</div>
                  <div class="analysis-title" style="margin-top: 8px;">IMPROVEMENT TAGS</div>
                  <div class="chip-wrap">
                    ${evaluation.issueTypes.map((issue: string) => `<span class="chip">${escapeHtml(issue)}</span>`).join("")}
                  </div>
                  <div class="tag"><strong>Improvement Category:</strong> ${escapeHtml(evaluation.improvementCategory)}</div>
                  <div class="tag">${escapeHtml(evaluation.performanceTag)}</div>
                </div>
              </div>
            `
              })
              .join("")}
          </div>

          <div class="section">
            <div class="section-title">3. PERFORMANCE BREAKDOWN</div>
            <div class="scores">
              <div class="score-item">
                <div class="score-value">${subScores.communication}/10</div>
                <div class="score-label">Communication</div>
              </div>
              <div class="score-item">
                <div class="score-value">${subScores.confidence}/10</div>
                <div class="score-label">Confidence</div>
              </div>
              <div class="score-item">
                <div class="score-value">${subScores.grammar}/10</div>
                <div class="score-label">Grammar</div>
              </div>
              <div class="score-item">
                <div class="score-value">${subScores.technical}/10</div>
                <div class="score-label">Technical Knowledge</div>
              </div>
              <div class="score-item">
                <div class="score-value">${score}%</div>
                <div class="score-label">Overall Rating</div>
              </div>
            </div>
          </div>

          <div class="section">
            <div class="section-title">4. SYSTEM VERDICT</div>
            <p>Based on the performance analysis, the candidate demonstrates good technical vocabulary and understanding of key concepts. Areas for improvement include refining sentence structure and practicing fluent delivery to enhance overall communication.</p>
          </div>

          <div class="section page-break">
            <div class="section-title">5. AI Video Analysis Report</div>
            ${
              hasBehavioralData
                ? `
                  <div class="subsection-title">Behavioral & Visual Metrics</div>
                  ${behavioralMetrics
                    .map(
                      (metric) => `
                    <div class="metric-row">
                      <div class="metric-header">
                        <span>${metric.name}: ${formatPercent(metric.value)}</span>
                        <span class="metric-status">${metric.status}</span>
                      </div>
                      <div class="metric-note">${metric.explanation}</div>
                    </div>
                  `
                    )
                    .join("")}
                  <div class="subsection-title">Behavioral Metrics Summary</div>
                  <p>Overall behavioral intelligence score: <strong>${formatPercent(
                    averageBehavioral
                  )}</strong> (${averageBehavioralStatus}).</p>
                `
                : `<p>No behavioral video analysis data was available for this session archive.</p>`
            }

            ${
              snapshots.length
                ? `
                  <div class="subsection-title">Behavioral Alert Snapshot</div>
                  ${snapshots
                    .map((snapshot) => {
                      const issue = snapshot.issueDetected || normalizeIssueLabel(snapshot.issueCode);
                      const timestamp = snapshot.timestamp
                        ? new Date(snapshot.timestamp).toLocaleString()
                        : "N/A";
                      const observation = snapshot.observation || "Behavioral deviation detected during the interview.";
                      const suggestion = snapshot.suggestion || "Apply posture, gaze, and composure corrections in the next response.";
                      const safeImage = (snapshot.imageData || "").startsWith("data:image/jpeg;base64,")
                        ? snapshot.imageData
                        : "";
                      const code = String(snapshot.issueCode || "").toUpperCase();
                      const badgeStyle = code === "HIGH_STRESS"
                        ? "background:#fef2f2;color:#dc2626;"
                        : code === "LOW_EYE_CONTACT"
                        ? "background:#fffbeb;color:#d97706;"
                        : code === "POOR_POSTURE"
                        ? "background:#fff7ed;color:#ea580c;"
                        : code === "NEGATIVE_EXPRESSION"
                        ? "background:#fdf4ff;color:#9333ea;"
                        : code === "LOW_ENGAGEMENT"
                        ? "background:#eff6ff;color:#2563eb;"
                        : code === "NO_FACE"
                        ? "background:#f1f5f9;color:#475569;"
                        : "background:#eef2ff;color:#4f46e5;";
                      return `
                        <div class="snapshot-card">
                          <div class="snapshot-header">
                            <span class="snapshot-badge" style="${badgeStyle}">${issue}</span>
                            <span class="snapshot-ts">${timestamp}</span>
                          </div>
                          <div class="snapshot-body">
                            ${
                              safeImage
                                ? `<div class="snapshot-img-wrap"><img src="${safeImage}" alt="Behavioral Snapshot" /></div>`
                                : `<div class="snapshot-img-wrap" style="color:#94a3b8;font-size:9pt;">No image</div>`
                            }
                            <div class="snapshot-analysis">
                              <div>
                                <div class="snapshot-obs-title">AI Observation</div>
                                <div class="snapshot-obs-text">${observation}</div>
                              </div>
                              <div class="snapshot-sugg-box">
                                <div class="snapshot-sugg-title">Suggested Correction</div>
                                <div class="snapshot-sugg-text">${suggestion}</div>
                              </div>
                            </div>
                          </div>
                        </div>
                      `;
                    })
                    .join("")}
                `
                : ""
            }
          </div>

          <div class="section">
            <div class="section-title">6. AI Behavioral Recommendations</div>
            <ul class="recommendations">
              ${recommendations.map((item) => `<li>${item}</li>`).join("")}
            </ul>
          </div>

          <div class="footer">FluenzyAI - CONFIDENTIAL CAREER ARCHIVE | https://www.fluenzyai.app/</div>
        </body>
      </html>
    `;

    return new NextResponse(html, {
      headers: {
        "Content-Type": "text/html",
      },
    });
  } catch (error) {
    console.error("PDF generation error:", error);
    return NextResponse.json({ error: "Failed to generate PDF" }, { status: 500 });
  }
}
