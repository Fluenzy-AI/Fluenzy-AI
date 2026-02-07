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
  strengths: string;
  weaknesses: string;
}

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

Your mission is to create a 100% personalized, ready-to-memorize interview guide for the user, based strictly on their personal data below.

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

**Self-Identified Strengths:**
${data.strengths || "Not specified"}

**Self-Identified Weaknesses:**
${data.weaknesses || "Not specified"}

═══════════════════════════════════════════════════════════════
INSTRUCTIONS - GENERATE THE FOLLOWING SECTIONS
═══════════════════════════════════════════════════════════════

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
        "question": "Question based on user's projects/skills",
        "answer": "Clear explanation with interview-ready answer"
      }
    ]
  },
  
  "section5_companySpecific": {
    "title": "Company-Specific Questions",
    "whyThisCompany": "Customized answer for target company",
    "cultureFit": "How user fits the company culture",
    "roleExpectations": "What the role expects and how user meets it",
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

1. ❌ Do NOT give generic answers - EVERYTHING must be personalized to user's profile
2. ✅ Use simple, clear, confident English - no complex vocabulary
3. ✅ Answers must be memorizable word-by-word
4. ✅ Sound natural and human, not robotic
5. ✅ ${data.experienceLevel === "Fresher" ? "Be supportive and encouraging for fresher" : "Be sharp and professional for experienced candidate"}
6. ✅ Include at least 25-30 HR questions
7. ✅ Include 5-6 questions per technical difficulty level
8. ✅ Include 5 mock interview questions
9. ✅ All STAR method examples should use user's actual projects/experience
10. ✅ Company-specific section should be detailed if company is provided

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
    const { targetRole, targetCompany, strengths, weaknesses, communicationLevel } = body;

    // Fetch user and profile data
    const user = await prisma.users.findUnique({
      where: { email: session.user.email },
    });

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
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
      strengths: strengths || "",
      weaknesses: weaknesses || "",
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
        strengths: guideInput.strengths || null,
        weaknesses: guideInput.weaknesses || null,
        generatedContent: guide,
      },
    });

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
