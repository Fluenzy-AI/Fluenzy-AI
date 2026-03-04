// patch-ats-engine.mjs
// Patches ats-engine.ts to v4: fixes garbled-char functions, adds internship months,
// standalone parseJDSkills, contextual suggestions, and updated scoring weights.

import fs from 'fs';
const FILE = 'src/lib/ats-engine.ts';
let src = fs.readFileSync(FILE, 'utf8');

// ─────────────────────────────────────────────────────────────────────────────
// 1. Fix scoreExperience — add internship months
// ─────────────────────────────────────────────────────────────────────────────
const OLD_SCORE_EXP_START = src.indexOf('function scoreExperience(');
const OLD_SCORE_EXP_END   = src.indexOf('function scoreEducation(');
if (OLD_SCORE_EXP_START === -1 || OLD_SCORE_EXP_END === -1) {
  console.error('Could not locate scoreExperience / scoreEducation — aborting');
  process.exit(1);
}

const NEW_SCORE_EXP = `function scoreExperience(rawText: string, tq: string): { score: number; years: number } {
  const t = rawText.toLowerCase();
  let years = 0;
  const now = new Date().getFullYear();

  // Strategy 1: "2020 - 2022" / "2020 to 2022" / "2020 – 2022"
  for (const m of t.matchAll(/\\b(20\\d{2}|19\\d{2})\\s*[-\\u2013\\u2014to]+\\s*(20\\d{2}|present|current|now)\\b/gi)) {
    const s2 = parseInt(m[1]);
    const e2 = /present|current|now/i.test(m[2]) ? now : parseInt(m[2]);
    if (e2 >= s2 && e2 - s2 <= 35) years += e2 - s2;
  }

  // Strategy 2: "3+ years of experience"
  const expMatch = t.match(/(\\d+)\\+?\\s*(?:years?|yrs?)\\s+(?:of\\s+)?(?:experience|exp)/);
  if (expMatch) { const n = parseInt(expMatch[1]); if (n > years && n <= 50) years = n; }

  // Strategy 3: "6 months internship" / "6-month intern"
  const internRe = /(\\d+\\.?\\d*)\\s*[-\\s]?months?\\s*(?:internship|intern|training)/gi;
  let im: RegExpExecArray | null;
  while ((im = internRe.exec(t)) !== null) {
    const mo = parseFloat(im[1]);
    if (mo > 0 && mo <= 24) years += mo / 12;
  }

  // Strategy 4: "intern" keyword without explicit duration → assume 0.5 yr min
  if (/(internship|intern(?:ed)?|industrial\\s+training)/i.test(t) && years === 0) {
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

`;

src = src.slice(0, OLD_SCORE_EXP_START) + NEW_SCORE_EXP + src.slice(OLD_SCORE_EXP_END);
console.log('✅ scoreExperience patched');

// ─────────────────────────────────────────────────────────────────────────────
// 2. Fix scoreSections — better flex regex patterns
// ─────────────────────────────────────────────────────────────────────────────
const OLD_SCORE_SECT_START = src.indexOf('function scoreSections(');
const OLD_SCORE_SECT_END   = src.indexOf('function scoreProjects(');
if (OLD_SCORE_SECT_START === -1 || OLD_SCORE_SECT_END === -1) {
  console.error('Could not locate scoreSections / scoreProjects — aborting');
  process.exit(1);
}

const NEW_SCORE_SECT = `function scoreSections(rawText: string): {
  hasExp: boolean; hasSkill: boolean; hasEdu: boolean; hasProj: boolean;
  score: number;
} {
  const t = rawText.toLowerCase();
  const sections = [
    { key: "skills",     re: /(skill|technolog|proficien|tech\\s*stack|programming|tools)/,                              points: 15 },
    { key: "experience", re: /(experience|employment|work\\s+history|internship|intern|worked\\s+at|work\\s+at)/,         points: 15 },
    { key: "education",  re: /(education|degree|university|college|school|b\\.?tech|b\\.?e\\.?|m\\.?tech|mca|bca|bsc)/,  points: 10 },
    { key: "projects",   re: /(project|work\\s+sample|portfolio|github|personal\\s+project|academic\\s+project)/,        points: 10 },
    { key: "summary",    re: /(summary|objective|profile|about\\s+me|career\\s+goal)/,                                   points: 5  },
    { key: "contact",    re: /(email|phone|linkedin|github\\.com|@|contact)/,                                             points: 5  },
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

`;

src = src.slice(0, OLD_SCORE_SECT_START) + NEW_SCORE_SECT + src.slice(OLD_SCORE_SECT_END);
console.log('✅ scoreSections patched');

// ─────────────────────────────────────────────────────────────────────────────
// 3. Fix scoreProjects — strip garbled bullet chars from regex
// ─────────────────────────────────────────────────────────────────────────────
const OLD_SCORE_PROJ_START = src.indexOf('function scoreProjects(');
const OLD_SCORE_PROJ_END   = src.indexOf('function scoreSections(') !== -1
  ? src.indexOf('function scoreSections(')
  : src.indexOf('function generateSuggestions(');
// Actually scoreSections is now BEFORE scoreProjects in the new order. Let's just find the end differently.
const OLD_SCORE_PROJ_END_MARKER = src.indexOf('\nfunction ', OLD_SCORE_PROJ_START + 50);
if (OLD_SCORE_PROJ_START === -1 || OLD_SCORE_PROJ_END_MARKER === -1) {
  console.error('Could not locate scoreProjects — skipping');
} else {
  const oldProj = src.slice(OLD_SCORE_PROJ_START, OLD_SCORE_PROJ_END_MARKER);
  // Replace garbled bullet chars with safe unicode
  const fixedProj = oldProj
    .replace(/â€¢/g, '\\u2022')
    .replace(/â–º/g, '\\u25ba')
    .replace(/â–ª/g, '\\u25aa')
    .replace(/â"€/g, '\\u2500')
    .replace(/â€"/g, '\\u2013')
    .replace(/â€"/g, '\\u2014')
    .replace(/â€™/g, '\\u2019');
  src = src.slice(0, OLD_SCORE_PROJ_START) + fixedProj + src.slice(OLD_SCORE_PROJ_START + oldProj.length);
  console.log('✅ scoreProjects garbled chars patched');
}

// ─────────────────────────────────────────────────────────────────────────────
// 4. Fix generateSuggestions — contextual (no dupes, no "add X section" if present)
// ─────────────────────────────────────────────────────────────────────────────
const OLD_GEN_SUGG_START = src.indexOf('function generateSuggestions(');
const OLD_GEN_SUGG_END   = src.indexOf('\nfunction ', OLD_GEN_SUGG_START + 50);
if (OLD_GEN_SUGG_START === -1 || OLD_GEN_SUGG_END === -1) {
  console.error('Could not locate generateSuggestions — aborting');
  process.exit(1);
}

const NEW_GEN_SUGG = `function generateSuggestions(
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
    tips.push(\`Add missing skills to your skills section: \${missingSkills.slice(0, 5).join(", ")}\`);
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

`;

src = src.slice(0, OLD_GEN_SUGG_START) + NEW_GEN_SUGG + src.slice(OLD_GEN_SUGG_END);
console.log('✅ generateSuggestions patched');

// ─────────────────────────────────────────────────────────────────────────────
// 5. Inject parseJDSkills BEFORE scoreResume
// ─────────────────────────────────────────────────────────────────────────────
const SCORE_RESUME_MARKER = 'export function scoreResume(';
const scoreResumeIdx = src.indexOf(SCORE_RESUME_MARKER);
if (scoreResumeIdx === -1) {
  console.error('Could not find scoreResume — aborting');
  process.exit(1);
}

// Only inject if not already present
if (!src.includes('function parseJDSkills(')) {
  const PARSE_JD_FN = `function parseJDSkills(jd: string): SkillEntry[] {
  if (!jd || jd.trim().length < 20) return [];
  // Strip salary/company/event noise from JD
  const norm = jd
    .replace(/\\$[\\d,]+(?:\\s*[-–]\\s*\\$[\\d,]+)?\\s*(?:\\/yr|\\/year|\\/mo|per\\s+year|lpa|ctc|lakh)?/gi, " ")
    .replace(/(?:salary|compensation|pay|ctc|package|stipend)\\s*:?[^\\n]*/gi, " ")
    .replace(/(?:about\\s+(?:us|the\\s+company)|company\\s+overview|who\\s+we\\s+are)[\\s\\S]{0,600}/gi, " ")
    .replace(/(?:apply\\s+now|submit\\s+application|click\\s+here|send\\s+resume|contact\\s+hr)[^\\n]*/gi, " ")
    .toLowerCase();

  // Prefer tech-stack / requirements section if present
  const techMatch = norm.match(/(?:required\\s+skills?|tech\\s+stack|technologies|qualifications?|requirements?)([\\s\\S]{0,1800})/i);
  const searchZone = techMatch ? techMatch[1] : norm;
  return SKILL_DICT.filter(entry => hasSkill("", searchZone, entry));
}

`;
  src = src.slice(0, scoreResumeIdx) + PARSE_JD_FN + src.slice(scoreResumeIdx);
  console.log('✅ parseJDSkills injected before scoreResume');
} else {
  console.log('⏭  parseJDSkills already present — skipping');
}

// ─────────────────────────────────────────────────────────────────────────────
// 6. Fix scoreResume — new weights, use parseJDSkills, pass flags to suggestions
// ─────────────────────────────────────────────────────────────────────────────
const SCORE_RESUME_START = src.indexOf('export function scoreResume(');
const SCORE_RESUME_END   = src.lastIndexOf('\n}') + 2; // last closing brace in file

if (SCORE_RESUME_START === -1) {
  console.error('scoreResume not found');
  process.exit(1);
}

const NEW_SCORE_RESUME = `export function scoreResume(
  rawText: string,
  jobDescription?: string,
): ATSScore {
  const tq = textQuality(rawText);
  const normText = normalizeText(rawText);

  // Skills
  const detectedSkills = detectSkills(rawText, normText);
  const jdSkills = jobDescription ? parseJDSkills(jobDescription) : [];
  const matchedJD = jdSkills.filter(e => detectedSkills.find(d => d.canonical === e.canonical));
  const missingJD = jdSkills.filter(e => !detectedSkills.find(d => d.canonical === e.canonical));
  const skillScore = scoreSkills(detectedSkills, jdSkills);

  // Sections
  const sectionResult = scoreSections(rawText);

  // Experience
  const expResult = scoreExperience(rawText, tq);

  // Education
  const eduScore = scoreEducation(rawText);

  // Projects
  const projScore = scoreProjects(rawText, tq);

  // Format
  const formatScore = scoreFormat(rawText, tq);

  // JD keyword score (extra top-up when JD provided)
  let keywordScore = 50; // default when no JD
  if (jdSkills.length > 0) {
    const pct = matchedJD.length / jdSkills.length;
    keywordScore = clamp(Math.round(pct * 100));
  }

  // Weighted final score:
  // Skills 35% | Projects 20% | Experience 15% | Education 10%
  // Keywords 10% | Format 5% | Structure 5%
  const weighted =
    skillScore      * 0.35 +
    projScore       * 0.20 +
    expResult.score * 0.15 +
    eduScore        * 0.10 +
    keywordScore    * 0.10 +
    formatScore     * 0.05 +
    sectionResult.score * 0.05;

  const finalScore = clamp(Math.round(weighted));

  // Suggestions
  const suggestions = generateSuggestions(
    finalScore,
    missingJD.map(e => e.canonical),
    expResult.years,
    sectionResult.hasExp,
    sectionResult.hasSkill,
    sectionResult.hasProj,
    sectionResult.hasEdu,
    jdSkills.length,
  );

  // Job role detection
  const jobRole = detectJobRole(rawText);

  return {
    overall:       finalScore,
    skills:        skillScore,
    experience:    expResult.score,
    education:     eduScore,
    projects:      projScore,
    format:        formatScore,
    keywords:      keywordScore,
    structure:     sectionResult.score,
    detectedSkills: detectedSkills.map(e => e.canonical),
    matchedKeywords: matchedJD.map(e => e.canonical),
    missingKeywords: missingJD.map(e => e.canonical).slice(0, 8),
    suggestions,
    jobRole,
    yearsOfExperience: expResult.years,
    textQuality: tq,
  };
}
`;

src = src.slice(0, SCORE_RESUME_START) + NEW_SCORE_RESUME + '\n';
console.log('✅ scoreResume patched');

// ─────────────────────────────────────────────────────────────────────────────
// Write back
// ─────────────────────────────────────────────────────────────────────────────
fs.writeFileSync(FILE, src, 'utf8');
console.log('');
console.log('✅ All patches applied. File written: ' + FILE);
console.log('Total lines:', src.split('\n').length);
