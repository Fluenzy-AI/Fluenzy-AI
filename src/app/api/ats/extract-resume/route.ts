import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import {
  extractTextWithAdobe,
  isAdobeConfigured,
} from "@/lib/adobe-pdf-extract";
import {
  parseResumeStructured,
  ParsedResumeStructured,
} from "@/lib/resume-parser-ai";
import { parseResume } from "@/lib/ats-engine";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5 MB

/**
 * POST /api/ats/extract-resume
 * 
 * Extract and parse resume data using Adobe PDF Services and AI
 * 
 * Body: FormData with:
 *   - resume: File (PDF or DOCX)
 *   - useAdobe?: boolean (default true - use Adobe PDF Services)
 *   - useAI?: boolean (default true - use AI parsing)
 * 
 * Returns: Structured resume data in ATS-optimized JSON format
 */
export async function POST(request: NextRequest) {
  try {
    // Auth check
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Parse multipart form
    const formData = await request.formData();
    const file = formData.get("resume") as File | null;
    const pastedText = (formData.get("resumeText") as string | null)?.trim();
    const useAdobe = formData.get("useAdobe") !== "false";
    const useAI = formData.get("useAI") !== "false";

    let rawText = "";
    let extractionMethod: "adobe" | "fallback" | "pasted" = "fallback";
    let extractionWarning: string | undefined;

    // Handle pasted text
    if (pastedText && pastedText.length > 50) {
      rawText = pastedText;
      extractionMethod = "pasted";
    }
    // Handle file upload
    else if (file) {
      // Validate file type
      const allowedTypes = [
        "application/pdf",
        "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
      ];
      
      if (!allowedTypes.includes(file.type)) {
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

      const buffer = Buffer.from(await file.arrayBuffer());
      const isPdf = file.type === "application/pdf";

      // Try Adobe PDF Services first for PDFs
      if (isPdf && useAdobe && isAdobeConfigured()) {
        console.log("[Extract Resume] Using Adobe PDF Services");
        const adobeResult = await extractTextWithAdobe(buffer, file.name);
        
        if (adobeResult.success && adobeResult.text.length > 50) {
          rawText = adobeResult.text;
          extractionMethod = "adobe";
        } else {
          extractionWarning = adobeResult.error || "Adobe extraction returned insufficient text";
          console.warn("[Extract Resume] Adobe extraction failed, falling back:", extractionWarning);
        }
      }

      // Fallback to local parsing if Adobe didn't work
      if (!rawText || rawText.length < 50) {
        console.log("[Extract Resume] Using local parser fallback");
        const localResult = await parseResume(buffer, file.type);
        rawText = localResult.text;
        extractionMethod = "fallback";
        if (localResult.parseWarning) {
          extractionWarning = localResult.parseWarning;
        }
      }
    } else {
      return NextResponse.json(
        { error: "No resume file or text provided." },
        { status: 400 }
      );
    }

    // Sanitize text
    const sanitizedText = rawText
      .replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/g, " ")
      .slice(0, 50000);

    if (sanitizedText.length < 50) {
      return NextResponse.json(
        {
          error: "Could not extract sufficient text from the resume.",
          extractionMethod,
          extractionWarning,
        },
        { status: 400 }
      );
    }

    // Parse the resume text into structured format
    const parseResult = await parseResumeStructured(sanitizedText, useAI);

    // Return the structured data
    return NextResponse.json({
      success: true,
      data: parseResult.data,
      metadata: {
        extractionMethod,
        parsingMethod: parseResult.method,
        extractionWarning,
        parsingError: parseResult.error,
        textLength: sanitizedText.length,
        wordCount: sanitizedText.split(/\s+/).length,
      },
    });
  } catch (err) {
    console.error("[Extract Resume Error]", err);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

/**
 * GET /api/ats/extract-resume
 * 
 * Check if Adobe PDF Services is configured
 */
export async function GET() {
  return NextResponse.json({
    adobeConfigured: isAdobeConfigured(),
    capabilities: {
      pdfExtraction: true,
      docxExtraction: true,
      aiParsing: !!(process.env.GEMINI_API_KEY || process.env.NEXT_PUBLIC_GEMINI_API_KEY),
      adobePdfServices: isAdobeConfigured(),
    },
  });
}
