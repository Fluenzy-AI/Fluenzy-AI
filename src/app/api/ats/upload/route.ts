import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { parseResume, scoreResume } from "@/lib/ats-engine";
import { extractTextWithAdobe, isAdobeConfigured } from "@/lib/adobe-pdf-extract";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5 MB
const ALLOWED_TYPES = [
  "application/pdf",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  "application/msword",
];

export async function POST(request: NextRequest) {
  try {
    // Auth check
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

    // Spam prevention – max 10 uploads per user
    const uploadCount = await (prisma as any).aTSResume.count({
      where: { userId: user.id },
    });
    if (uploadCount >= 10) {
      return NextResponse.json(
        { error: "Upload limit reached (10 resumes). Please delete old ones first." },
        { status: 429 }
      );
    }

    // Parse multipart form
    const formData = await request.formData();
    const file = formData.get("resume") as File | null;
    const pastedText = (formData.get("resumeText") as string | null)?.trim() ?? "";
    const jobDescription = (formData.get("jobDescription") as string | null) ?? "";

    // ── Text-paste mode (no file needed) ──────────────────────────────────────
    if (!file && pastedText.length > 0) {
      const sanitizedText = pastedText
        .replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/g, " ")
        .slice(0, 50000);

      const scores = scoreResume(sanitizedText, jobDescription);

      let collegeName: string | null = null;
      try {
        const profile = await (prisma as any).userProfile.findUnique({
          where: { userId: user.id },
          select: { educations: true },
        });
        if (profile?.educations?.length > 0) {
          collegeName = profile.educations[0]?.institution ?? null;
        }
      } catch { /* non-critical */ }

      const resumeRecord = await (prisma as any).aTSResume.create({
        data: {
          userId: user.id,
          fileName: "pasted-resume.txt",
          fileUrl: "",
          fileType: "txt",
          fileSize: pastedText.length,
          rawText: sanitizedText,
          parsedData: {
            wordCount: sanitizedText.split(/\s+/).length,
            extractedSkills: scores.extractedSkills,
            jobTitleMatch: scores.jobTitleMatch,
            parseWarning: null,
            parsedName: scores.parsedData.name,
            parsedEmail: scores.parsedData.email,
            parsedPhone: scores.parsedData.phone,
            missingSections: scores.parsedData.missingSections,
          },
        },
      });

      const analysis = await (prisma as any).aTSAnalysis.create({
        data: {
          resumeId: resumeRecord.id,
          userId: user.id,
          atsScore: scores.atsScore,
          keywordScore: scores.keywordScore,
          skillsScore: scores.skillsScore,
          formatScore: scores.formatScore,
          experienceScore: scores.experienceScore,
          educationScore: scores.educationScore,
          readabilityScore: scores.readabilityScore,
          sectionScore: scores.sectionScore,
          matchedKeywords: scores.matchedKeywords,
          missingKeywords: scores.missingKeywords,
          extractedSkills: scores.extractedSkills,
          suggestions: scores.suggestions,
          strengths: scores.strengths,
          jobTitleMatch: scores.jobTitleMatch,
          experienceYears: scores.experienceYears,
        },
      });

      const allAnalyses = await (prisma as any).aTSAnalysis.findMany({
        orderBy: { atsScore: "desc" },
        select: { id: true, userId: true, atsScore: true },
      });
      for (let i = 0; i < allAnalyses.length; i++) {
        const a = allAnalyses[i];
        const existingRanking = await (prisma as any).aTSRanking.findFirst({ where: { analysisId: a.id } });
        if (existingRanking) {
          await (prisma as any).aTSRanking.update({ where: { id: existingRanking.id }, data: { rank: i + 1, totalScore: a.atsScore } });
        } else {
          await (prisma as any).aTSRanking.create({ data: { userId: a.userId, analysisId: a.id, rank: i + 1, totalScore: a.atsScore, college: collegeName, jobRole: scores.jobRole ?? "general" } });
        }
      }

      return NextResponse.json({ success: true, analysisId: analysis.id, scores, parseWarning: null, message: "Resume analyzed successfully!" });
    }

    // ── File upload mode ───────────────────────────────────────────────────────
    if (!file) {
      return NextResponse.json({ error: "No resume file or text provided." }, { status: 400 });
    }

    // Validate type
    if (!ALLOWED_TYPES.includes(file.type)) {
      return NextResponse.json(
        { error: "Invalid file type. Only PDF and DOCX are allowed." },
        { status: 400 }
      );
    }

    // Validate size
    if (file.size > MAX_FILE_SIZE) {
      return NextResponse.json(
        { error: "File too large. Maximum size is 5 MB." },
        { status: 400 }
      );
    }

    // Convert to buffer
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    // Parse resume text using Adobe PDF Services (preferred) or fallback
    let rawText = "";
    let parseWarning: string | undefined;
    let extractionMethod = "fallback";

    const isPdf = file.type === "application/pdf";
    const adobeAvailable = isAdobeConfigured();
    
    console.log("[ATS Upload] File type:", file.type, "isPdf:", isPdf, "adobeConfigured:", adobeAvailable);

    // Try Adobe PDF Services first for PDFs
    if (isPdf && adobeAvailable) {
      console.log("[ATS Upload] Using Adobe PDF Services for extraction");
      try {
        const adobeResult = await extractTextWithAdobe(buffer, file.name);
        if (adobeResult.success && adobeResult.text && adobeResult.text.trim().length > 100) {
          rawText = adobeResult.text;
          extractionMethod = "adobe";
          console.log(`[ATS Upload] Adobe extraction successful: ${rawText.length} chars`);
        } else {
          console.warn("[ATS Upload] Adobe extraction returned insufficient text:", adobeResult.error);
          parseWarning = adobeResult.error || "Adobe extraction returned insufficient text";
        }
      } catch (adobeError) {
        console.error("[ATS Upload] Adobe extraction error:", adobeError);
        parseWarning = "Adobe PDF extraction failed";
      }
    } else {
      console.log("[ATS Upload] Skipping Adobe - isPdf:", isPdf, "adobeConfigured:", adobeAvailable);
    }

    // Fallback to local parsing if Adobe didn't work
    if (!rawText || rawText.trim().length < 100) {
      console.log("[ATS Upload] Using local parser fallback");
      const localResult = await parseResume(buffer, file.type);
      rawText = localResult.text;
      extractionMethod = "fallback";
      if (localResult.parseWarning) {
        parseWarning = localResult.parseWarning;
      }
    }

    // Sanitize text
    const sanitizedText = rawText
      .replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/g, " ")
      .slice(0, 50000); // max 50k chars

    // Compute ATS score (pass optional job description for JD-aware scoring)
    const scores = scoreResume(sanitizedText, jobDescription ?? "");

    // Get college from user profile if available
    let collegeName: string | null = null;
    try {
      const profile = await (prisma as any).userProfile.findUnique({
        where: { userId: user.id },
        select: { educations: true },
      });
      if (profile?.educations?.length > 0) {
        collegeName = profile.educations[0]?.institution ?? null;
      }
    } catch { /* non-critical */ }

    // Store resume record
    const resumeRecord = await (prisma as any).aTSResume.create({
      data: {
        userId: user.id,
        fileName: file.name,
        fileUrl: "", // store URL after upload to cloud if applicable
        fileType: file.type.includes("pdf") ? "pdf" : "docx",
        fileSize: file.size,
        rawText: sanitizedText,
        parsedData: {
          wordCount: sanitizedText.split(/\s+/).length,
          extractedSkills: scores.extractedSkills,
          jobTitleMatch: scores.jobTitleMatch,
          parseWarning: parseWarning ?? null,
          parsedName: scores.parsedData.name,
          parsedEmail: scores.parsedData.email,
          parsedPhone: scores.parsedData.phone,
          missingSections: scores.parsedData.missingSections,
        },
      },
    });

    // Store analysis
    const analysis = await (prisma as any).aTSAnalysis.create({
      data: {
        resumeId: resumeRecord.id,
        userId: user.id,
        atsScore: scores.atsScore,
        keywordScore: scores.keywordScore,
        skillsScore: scores.skillsScore,
        formatScore: scores.formatScore,
        experienceScore: scores.experienceScore,
        educationScore: scores.educationScore,
        readabilityScore: scores.readabilityScore,
        sectionScore: scores.sectionScore,
        matchedKeywords: scores.matchedKeywords,
        missingKeywords: scores.missingKeywords,
        extractedSkills: scores.extractedSkills,
        suggestions: scores.suggestions,
        strengths: scores.strengths,
        jobTitleMatch: scores.jobTitleMatch,
        experienceYears: scores.experienceYears,
      },
    });

    // Upsert ranking
    const allAnalyses = await (prisma as any).aTSAnalysis.findMany({
      orderBy: { atsScore: "desc" },
      select: { id: true, userId: true, atsScore: true },
    });

    // Recalculate ranks
    for (let i = 0; i < allAnalyses.length; i++) {
      const a = allAnalyses[i];
      const existingRanking = await (prisma as any).aTSRanking.findFirst({
        where: { analysisId: a.id },
      });
      if (existingRanking) {
        await (prisma as any).aTSRanking.update({
          where: { id: existingRanking.id },
          data: { rank: i + 1, totalScore: a.atsScore },
        });
      } else {
        await (prisma as any).aTSRanking.create({
          data: {
            userId: a.userId,
            analysisId: a.id,
            rank: i + 1,
            totalScore: a.atsScore,
            college: collegeName,
            jobRole: scores.jobRole ?? "general",
          },
        });
      }
    }

    return NextResponse.json({
      success: true,
      analysisId: analysis.id,
      scores,
      parseWarning: parseWarning ?? null,
      extractionMethod,
      message: "Resume analyzed successfully!",
    });
  } catch (err) {
    console.error("[ATS Upload Error]", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
