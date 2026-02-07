import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { GoogleGenerativeAI } from "@google/generative-ai";

interface UserGuideInput {
  name: string;
  education: Array<{
    degree: string;
    institution: string;
    startYear: number;
    endYear?: number;
    grade?: string;
  }>;
  skills: Array<{
    name: string;
    level: string;
  }>;
  experiences: Array<{
    role: string;
    company: string;
    startDate: string;
    endDate?: string;
    description?: string;
  }>;
  projects: Array<{
    title: string;
    description?: string;
    techStack?: string;
  }>;
  certifications: Array<{
    name: string;
    issuer: string;
  }>;
  languages: Array<{
    name: string;
    proficiency: string;
  }>;
  targetRole: string;
  targetCompany: string;
  experienceLevel: "Fresher" | "Experienced";
  communicationLevel: "Beginner" | "Intermediate" | "Advanced";
  jobDescription: string;
  derivedStrengths: string;
  derivedWeaknesses: string;
}

// Usage limits by plan (separate from training modules)
const INTERVIEW_GUIDE_LIMITS: Record<string, number | null> = {
  Free: 3,
  Standard: null, // Unlimited
  Pro: 100,
};

// Helper function to check and reset monthly usage for interview guides
async function checkInterviewGuideMonthlyReset(user: any) {
  const now = new Date();
  const currentMonth = now.getMonth();
  const currentYear = now.getFullYear();

  // Get global settings for this plan
  const planSettings = await (prisma as any).globalPlanSettings.findUnique({
    where: { plan: user.plan?.toString() || 'Free' },
  });

  if (!planSettings || planSettings.status !== 'active') {
    // Return default limits if no settings
    return { needsReset: false };
  }

  const lastReset = new Date(planSettings.lastReset);
  const lastResetMonth = lastReset.getMonth();
  const lastResetYear = lastReset.getFullYear();

  const needsReset = currentMonth !== lastResetMonth || currentYear !== lastResetYear;

  if (needsReset) {
    // Reset interview guide usage along with other modules
    await (prisma.users.update as any)({
      where: { id: user.id },
      data: {
        interviewGuideUsage: 0,
      },
    });

    // Update last reset time
    await (prisma as any).globalPlanSettings.update({
      where: { plan: user.plan?.toString() || 'Free' },
      data: { lastReset: now },
    });

    return { needsReset: true, resetUsage: 0 };
  }

  return { needsReset: false };
}

// Derive strengths and weaknesses from profile data and job description
const deriveStrengthsAndWeaknesses = (
  skills: Array<{ name: string; level: string }>,
  experiences: Array<{ role: string; company: string; description?: string }>,
  projects: Array<{ title: string; description?: string; techStack?: string }>,
  jobDescription: string
): { strengths: string; weaknesses: string } => {
  // Extract key skills and strengths
  const strongSkills = skills
    .filter((s) => s.level === "Expert" || s.level === "Advanced")
    .map((s) => s.name);
  
  const intermediateSkills = skills
    .filter((s) => s.level === "Intermediate")
    .map((s) => s.name);
  
  const beginnerSkills = skills
    .filter((s) => s.level === "Beginner")
    .map((s) => s.name);

  // Derive strengths
  const strengthsList: string[] = [];
  
  if (strongSkills.length > 0) {
    strengthsList.push(`Strong technical expertise in ${strongSkills.slice(0, 5).join(", ")}`);
  }
  
  if (experiences.length > 0) {
    strengthsList.push(`${experiences.length}+ years of practical work experience`);
    const roles = [...new Set(experiences.map((e) => e.role))];
    if (roles.length > 1) {
      strengthsList.push("Diverse experience across multiple roles");
    }
  }
  
  if (projects.length >= 3) {
    strengthsList.push(`Hands-on project experience (${projects.length}+ projects)`);
  }
  
  // Common positive traits to add based on profile completeness
  if (skills.length >= 5) {
    strengthsList.push("Quick learner with diverse skill set");
  }
  
  strengthsList.push("Problem-solving mindset and analytical thinking");
  strengthsList.push("Team collaboration and communication skills");

  // Derive weaknesses (areas for improvement based on skill gaps)
  const weaknessesList: string[] = [];
  
  if (beginnerSkills.length > 0) {
    weaknessesList.push(`Still developing proficiency in ${beginnerSkills.slice(0, 3).join(", ")}`);
  }
  
  if (experiences.length === 0) {
    weaknessesList.push("Limited industry experience (eager to learn and grow)");
  }
  
  // Common acceptable weaknesses for interviews
  weaknessesList.push("Sometimes overly detail-oriented (working on balancing speed with quality)");
  
  if (projects.length < 2) {
    weaknessesList.push("Building more hands-on project portfolio");
  }

  return {
    strengths: strengthsList.join("; "),
    weaknesses: weaknessesList.slice(0, 3).join("; "),
  };
};

const generateGuidePrompt = (data: UserGuideInput): string => {
  const educationStr = data.education
    .map(
      (e) =>
        `${e.degree} from ${e.institution} (${e.startYear}-${e.endYear || "Present"})${e.grade ? `, Grade: ${e.grade}` : ""}`
    )
    .join("; ");

  const skillsStr = data.skills.map((s) => `${s.name} (${s.level})`).join(", ");

  const experienceStr = data.experiences.length
    ? data.experiences
        .map(
          (e) =>
            `${e.role} at ${e.company} (${e.startDate} - ${e.endDate || "Present"}): ${e.description || "N/A"}`
        )
        .join("\n")
    : "No prior work experience (Fresher)";

  const projectsStr = data.projects.length
    ? data.projects
        .map(
          (p) =>
            `${p.title}: ${p.description || "N/A"} | Tech: ${p.techStack || "N/A"}`
        )
        .join("\n")
    : "No projects listed";

  const certsStr = data.certifications.length
    ? data.certifications.map((c) => `${c.name} by ${c.issuer}`).join(", ")
    : "None";

  const languagesStr = data.languages.length
    ? data.languages.map((l) => `${l.name} (${l.proficiency})`).join(", ")
    : "English";

  return `
You are an Elite AI Interview Coach & Career Strategist with 15+ years of experience in HR interviews, technical interviews, behavioral assessments, and communication training.

Your mission is to create a 100% personalized, ready-to-memorize interview guide for the user, based strictly on their personal data and job description below.

The output should be so strong that the user can memorize the answers and confidently clear the interview.

═══════════════════════════════════════════════════════════════
USER PROFILE DATA
═══════════════════════════════════════════════════════════════

**Name:** ${data.name}
**Target Role:** ${data.targetRole || "General Software Role"}
**Target Company:** ${data.targetCompany || "Not specified"}
**Experience Level:** ${data.experienceLevel}
**Communication Level:** ${data.communicationLevel}

**Education:**
${educationStr || "Not provided"}

**Skills:**
${skillsStr || "Not provided"}

**Work Experience:**
${experienceStr}

**Projects:**
${projectsStr}

**Certifications:**
${certsStr}

**Languages Known:**
${languagesStr}

═══════════════════════════════════════════════════════════════
JOB DESCRIPTION (ANALYZE THIS CAREFULLY)
═══════════════════════════════════════════════════════════════

${data.jobDescription}

═══════════════════════════════════════════════════════════════
AUTO-DERIVED STRENGTHS & WEAKNESSES (Based on Profile + JD)
═══════════════════════════════════════════════════════════════

**Derived Strengths:**
${data.derivedStrengths}

**Derived Weaknesses (framed positively):**
${data.derivedWeaknesses}

═══════════════════════════════════════════════════════════════
INSTRUCTIONS - GENERATE THE FOLLOWING SECTIONS
═══════════════════════════════════════════════════════════════

IMPORTANT: Analyze the Job Description carefully to:
1. Match user's skills with JD requirements
2. Highlight relevant projects and experience
3. Craft answers that directly address what the employer is looking for
4. Identify skill gaps and prepare defensive answers

Generate a COMPLETE Interview Guide in JSON format with the following structure:

{
  "section1_preparation": {
    "title": "Before the Interview - Preparation Guide",
    "oneDayBefore": ["list of 5-7 specific tips"],
    "oneHourBefore": ["list of 3-5 specific tips"],
    "duringInterview": {
      "sitting": "How to sit properly",
      "talking": "How to talk effectively",
      "thinking": "How to think and pause appropriately",
      "answering": "Answer structuring tips"
    },
    "commonMistakes": ["list of 5-7 common mistakes to avoid"],
    "nervousnessControl": ["list of 4-5 techniques"],
    "starMethod": {
      "situation": "Explain with example from user's profile",
      "task": "Explain with example",
      "action": "Explain with example",
      "result": "Explain with example"
    }
  },
  
  "section2_introduction": {
    "title": "Personal Introduction - Tell Me About Yourself",
    "short30sec": "Complete 30-second introduction script",
    "medium60sec": "Complete 60-second introduction script",
    "long90sec": "Complete 90-second introduction script",
    "tips": ["list of 3-4 delivery tips"]
  },
  
  "section3_hrQuestions": {
    "title": "HR Interview Questions with Perfect Answers",
    "questions": [
      {
        "question": "Question text",
        "answer": "Complete, word-by-word memorizable answer tailored to user",
        "tips": "Quick delivery tip"
      }
    ]
  },
  
  "section4_technicalQuestions": {
    "title": "Technical / Role-Specific Questions",
    "beginner": [
      {
        "question": "Question",
        "answer": "Clear explanation with interview-ready answer"
      }
    ],
    "intermediate": [
      {
        "question": "Question",
        "answer": "Clear explanation with interview-ready answer"
      }
    ],
    "advanced": [
      {
        "question": "Question based on user's projects/skills and JD requirements",
        "answer": "Clear explanation with interview-ready answer"
      }
    ]
  },
  
  "section5_companySpecific": {
    "title": "Company-Specific Questions",
    "whyThisCompany": "Customized answer for target company based on JD",
    "whyThisRole": "Why this specific role matches user's career goals",
    "cultureFit": "How user fits the company culture",
    "roleExpectations": "What the role expects (from JD) and how user meets it",
    "valueAddition": "How user adds unique value to this company"
  },
  
  "section6_communication": {
    "title": "Communication & English Polishing",
    "fillerWordsToAvoid": ["list of 8-10 filler words"],
    "betterReplacements": [
      {"avoid": "word", "useInstead": "better phrase"}
    ],
    "powerPhrases": ["list of 10-12 powerful interview phrases"],
    "sentenceStructures": ["list of 5-6 confident sentence patterns"],
    "howToStartAnswers": ["list of 5 professional opening phrases"],
    "howToEndAnswers": ["list of 5 professional closing phrases"]
  },
  
  "section7_cheatSheet": {
    "title": "Rapid Memorization Cheat Sheet",
    "bulletSummaries": ["10-12 key bullet points to remember"],
    "keyLinesToMemorize": ["8-10 powerful one-liners"],
    "oneLinerAnswers": [
      {"question": "Quick question", "answer": "One-line powerful answer"}
    ],
    "finalChecklist": ["10 point final revision checklist"]
  },
  
  "section8_mockInterview": {
    "title": "Mock Interview Simulation",
    "questions": [
      {
        "question": "Rapid-fire question",
        "idealAnswer": "How to answer this perfectly",
        "feedback": "Quick feedback on what makes this answer great"
      }
    ]
  }
}

═══════════════════════════════════════════════════════════════
CRITICAL RULES (MUST FOLLOW - NO EXCEPTIONS)
═══════════════════════════════════════════════════════════════

1. ❌ Do NOT give generic answers - EVERYTHING must be personalized to user's profile AND tailored to the Job Description
2. ✅ Use simple, clear, confident English - no complex vocabulary
3. ✅ Answers must be memorizable word-by-word
4. ✅ Sound natural and human, not robotic
5. ✅ ${data.experienceLevel === "Fresher" ? "Be supportive and encouraging for fresher" : "Be sharp and professional for experienced candidate"}
6. ✅ Include at least 25-30 HR questions
7. ✅ Include 5-6 questions per technical difficulty level
8. ✅ Include 5 mock interview questions
9. ✅ All STAR method examples should use user's actual projects/experience
10. ✅ Company-specific section should be detailed and reference JD requirements
11. ✅ Strengths answer must use the derived strengths, framed professionally
12. ✅ Weaknesses answer must use the derived weaknesses, framed positively with improvement plan

🚨🚨🚨 ABSOLUTE RULE FOR "TELL ME ABOUT YOURSELF" 🚨🚨🚨

ALL "Tell Me About Yourself" answers (short30sec, medium60sec, long90sec) MUST:
- START WITH: "My name is ${data.name}, and I am..."
- NEVER start with "I am...", "Myself...", "I'm...", or any other variation
- The FIRST words must always be "My name is ${data.name}"

WRONG EXAMPLES (NEVER DO THIS):
❌ "I am a software engineer..."
❌ "Myself Rahul, I am..."
❌ "I'm currently working..."

CORRECT EXAMPLE (ALWAYS DO THIS):
✅ "My name is ${data.name}, and I am a ${data.targetRole} with..."

This rule is NON-NEGOTIABLE. Violating this rule makes the entire guide INVALID.

Generate the complete JSON response now.
  `;
};

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { targetRole, targetCompany, communicationLevel, jobDescription } = body;

    // Validate mandatory job description
    if (!jobDescription || jobDescription.trim().length < 50) {
      return NextResponse.json(
        { error: "Job Description is required (minimum 50 characters)" },
        { status: 400 }
      );
    }

    // Fetch user and profile data
    const user = await prisma.users.findUnique({
      where: { email: session.user.email },
    });

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    // Check usage limits
    const userPlan = user.plan?.toString() || "Free";
    const limit = INTERVIEW_GUIDE_LIMITS[userPlan];
    
    // Check for monthly reset
    const { needsReset, resetUsage } = await checkInterviewGuideMonthlyReset(user);
    const currentUsage = needsReset ? (resetUsage ?? 0) : ((user as any).interviewGuideUsage || 0);

    if (limit !== null && currentUsage >= limit) {
      return NextResponse.json(
        {
          error: "Usage limit reached",
          message: `You've used all ${limit} Interview Guides for this month on ${userPlan} plan. Upgrade to get more!`,
          limit,
          used: currentUsage,
          remaining: 0,
          redirectToPricing: true,
        },
        { status: 403 }
      );
    }

    const profile = await (prisma as any).userProfile.findUnique({
      where: { userId: user.id },
      include: {
        skills: true,
        experiences: true,
        educations: true,
        certifications: true,
        projects: true,
        languages: true,
      },
    });

    // Determine experience level
    const hasWorkExperience = profile?.experiences?.length > 0;
    const experienceLevel = hasWorkExperience ? "Experienced" : "Fresher";

    // Derive strengths and weaknesses from profile and JD
    const { strengths: derivedStrengths, weaknesses: derivedWeaknesses } = deriveStrengthsAndWeaknesses(
      profile?.skills || [],
      profile?.experiences || [],
      profile?.projects || [],
      jobDescription
    );

    // Build user guide input
    const guideInput: UserGuideInput = {
      name: user.name,
      education:
        profile?.educations?.map((e: any) => ({
          degree: e.degree,
          institution: e.institution,
          startYear: e.startYear,
          endYear: e.endYear,
          grade: e.grade,
        })) || [],
      skills:
        profile?.skills?.map((s: any) => ({
          name: s.name,
          level: s.level,
        })) || [],
      experiences:
        profile?.experiences?.map((e: any) => ({
          role: e.role,
          company: e.company,
          startDate: e.startDate?.toISOString().split("T")[0] || "",
          endDate: e.endDate?.toISOString().split("T")[0] || undefined,
          description: e.description,
        })) || [],
      projects:
        profile?.projects?.map((p: any) => ({
          title: p.title,
          description: p.description,
          techStack: p.techStack,
        })) || [],
      certifications:
        profile?.certifications?.map((c: any) => ({
          name: c.name,
          issuer: c.issuer,
        })) || [],
      languages:
        profile?.languages?.map((l: any) => ({
          name: l.name,
          proficiency: l.proficiency,
        })) || [],
      targetRole: targetRole || "Software Developer",
      targetCompany: targetCompany || "",
      experienceLevel,
      communicationLevel: communicationLevel || "Intermediate",
      jobDescription,
      derivedStrengths,
      derivedWeaknesses,
    };

    // Generate guide using Gemini AI
    const apiKey = process.env.NEXT_PUBLIC_GEMINI_API_KEY;
    if (!apiKey) {
      console.error("CRITICAL: NEXT_PUBLIC_GEMINI_API_KEY is missing in .env");
      return NextResponse.json(
        { error: "API key configuration error" },
        { status: 500 }
      );
    }

    const genAI = new GoogleGenerativeAI(apiKey);
    const prompt = generateGuidePrompt(guideInput);

    let result;
    try {
      // Primary: Gemini 2.5 Pro
      const modelPro = genAI.getGenerativeModel({
        model: "gemini-2.5-pro",
        generationConfig: { responseMimeType: "application/json" },
      });
      result = await modelPro.generateContent(prompt);
    } catch (proError: any) {
      console.warn("Gemini 2.5 Pro busy, switching to 2.5 Flash...");
      // Fallback: Gemini 2.5 Flash
      const modelFlash = genAI.getGenerativeModel({
        model: "gemini-2.5-flash",
        generationConfig: { responseMimeType: "application/json" },
      });
      result = await modelFlash.generateContent(prompt);
    }

    const response = await result.response;
    const text = response.text();

    // Parse JSON response
    let guide;
    try {
      guide = JSON.parse(text);
    } catch (parseError) {
      // Cleanup backticks if JSON mode wasn't strictly followed
      const cleanedText = text.replace(/```json\n?|\n?```/g, "").trim();
      guide = JSON.parse(cleanedText);
    }

    // Post-process: Ensure "Tell Me About Yourself" starts correctly
    if (guide.section2_introduction) {
      const correctStart = `My name is ${user.name}, and I am`;
      const wrongPatterns = [/^I am\s/i, /^Myself\s/i, /^I'm\s/i, /^My self\s/i];
      
      ["short30sec", "medium60sec", "long90sec"].forEach((key) => {
        if (guide.section2_introduction[key]) {
          let intro = guide.section2_introduction[key];
          // Check if it starts incorrectly
          for (const pattern of wrongPatterns) {
            if (pattern.test(intro)) {
              intro = intro.replace(pattern, `${correctStart} `);
              break;
            }
          }
          // Ensure it starts with "My name is..."
          if (!intro.toLowerCase().startsWith("my name is")) {
            intro = `${correctStart} ${intro.charAt(0).toLowerCase()}${intro.slice(1)}`;
          }
          guide.section2_introduction[key] = intro;
        }
      });
    }

    // Save guide to database
    const savedGuide = await (prisma as any).interviewGuide.create({
      data: {
        userId: user.id,
        targetRole: guideInput.targetRole,
        targetCompany: guideInput.targetCompany || null,
        experienceLevel,
        communicationLevel: guideInput.communicationLevel,
        jobDescription: jobDescription,
        generatedContent: guide,
      },
    });

    // Increment usage counter
    await (prisma.users.update as any)({
      where: { id: user.id },
      data: {
        interviewGuideUsage: { increment: 1 },
      },
    });

    // Calculate remaining uses
    const newUsage = currentUsage + 1;
    const remaining = limit === null ? "Unlimited" : Math.max(0, limit - newUsage);

    return NextResponse.json({
      success: true,
      guide,
      guideId: savedGuide.id,
      userProfile: {
        name: user.name,
        experienceLevel,
        targetRole: guideInput.targetRole,
        targetCompany: guideInput.targetCompany,
      },
      usage: {
        used: newUsage,
        limit: limit === null ? "Unlimited" : limit,
        remaining,
      },
    });
  } catch (error: any) {
    console.error("Interview Guide Generation Error:", error);
    return NextResponse.json(
      {
        error: "Failed to generate interview guide",
        details: error.message,
      },
      { status: 500 }
    );
  }
}

// GET endpoint to check usage
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const user = await prisma.users.findUnique({
      where: { email: session.user.email },
    });

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    const userPlan = user.plan?.toString() || "Free";
    const limit = INTERVIEW_GUIDE_LIMITS[userPlan];
    
    // Check for monthly reset
    const { needsReset, resetUsage } = await checkInterviewGuideMonthlyReset(user);
    const currentUsage = needsReset ? (resetUsage ?? 0) : ((user as any).interviewGuideUsage || 0);

    return NextResponse.json({
      plan: userPlan,
      limit: limit === null ? "Unlimited" : limit,
      used: currentUsage,
      remaining: limit === null ? "Unlimited" : Math.max(0, limit - currentUsage),
      canGenerate: limit === null || currentUsage < limit,
      redirectToPricing: limit !== null && currentUsage >= limit,
    });
  } catch (error: any) {
    console.error("Usage check error:", error);
    return NextResponse.json(
      { error: "Failed to check usage" },
      { status: 500 }
    );
  }
}
