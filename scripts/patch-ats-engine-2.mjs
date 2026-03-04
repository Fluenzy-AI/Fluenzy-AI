import fs from 'fs';
const FILE = 'src/lib/ats-engine.ts';
let src = fs.readFileSync(FILE, 'utf8');

function removeFnByIdx(code, idx) {
  let depth=0,i=idx,started=false;
  while(i<code.length){if(code[i]==='{'){depth++;started=true;}else if(code[i]==='}'){depth--;if(started&&depth===0){i++;break;}}i++;}
  while(i<code.length&&(code[i]==='\n'||code[i]==='\r'))i++;
  return code.slice(0,idx)+code.slice(i);
}

const sig1='function scoreSections(rawText: string, tq: string):';
let i1=src.indexOf(sig1);
if(i1!==-1){src=removeFnByIdx(src,i1);console.log('Removed old scoreSections(tq)');}

const sig2='function scoreProjects(rawText: string, tq: string):';
const p1=src.indexOf(sig2);const p2=p1!==-1?src.indexOf(sig2,p1+10):-1;
if(p2!==-1){src=removeFnByIdx(src,p2);console.log('Removed 2nd scoreProjects');}

const sig3='function scoreReadability(rawText: string, tq: string):';
const r1=src.indexOf(sig3);const r2=r1!==-1?src.indexOf(sig3,r1+10):-1;
if(r2!==-1){src=removeFnByIdx(src,r2);console.log('Removed 2nd scoreReadability');}

const srIdx=src.indexOf('export function scoreResume(');
if(srIdx===-1){console.error('No scoreResume');process.exit(1);}
src=src.slice(0,srIdx).trimEnd()+'\n\n';

src+=`export function scoreResume(
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
  const weighted =
    skillsScore         * 0.35 +
    projScore           * 0.20 +
    expResult.score     * 0.15 +
    eduScore            * 0.10 +
    kwResult.score      * 0.10 +
    formatScore         * 0.05 +
    sectionResult.score * 0.05;
  const atsScore = clamp(Math.round(weighted));
  const role = detectRole(detectedSkills);
  const jobRole = role?.name ?? 'general';
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
`;

fs.writeFileSync(FILE,src,'utf8');
console.log('Done. Lines:',src.split('\n').length);
