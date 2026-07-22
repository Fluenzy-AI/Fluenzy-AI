import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { GoogleGenerativeAI } from '@google/generative-ai';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5 MB
const MAX_OUTPUT_CHARS = 8000;

/**
 * POST /api/extract-resume
 *
 * Lightweight resume text extraction for the Company Interview simulator.
 * Uses Gemini's multimodal document understanding so it handles:
 *  - Text-layer PDFs (standard)
 *  - Scanned / image-based PDFs
 *  - DOCX files
 *  - Plain TXT files
 *
 * Body: FormData
 *   - file: File  (PDF, DOCX, DOC, TXT)
 *
 * Response:
 *   { text: string, length: number, method: string, warning?: string }
 */
export async function POST(request: NextRequest) {
  try {
    // ── Auth ─────────────────────────────────────────────────────────────────
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // ── Parse form data ───────────────────────────────────────────────────────
    const formData = await request.formData();
    const file = formData.get('file') as File | null;

    if (!file) {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 });
    }

    if (file.size > MAX_FILE_SIZE) {
      return NextResponse.json(
        { error: 'File too large. Maximum 5 MB.' },
        { status: 400 }
      );
    }

    const fileName = file.name.toLowerCase();
    const isTxt = fileName.endsWith('.txt');
    const isPdf = fileName.endsWith('.pdf') || file.type === 'application/pdf';
    const isDocx =
      fileName.endsWith('.docx') ||
      fileName.endsWith('.doc') ||
      file.type === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document';

    console.log(
      `[RESUME_EXTRACT] Starting extraction: ${file.name} (${file.size} bytes, type=${file.type})`
    );

    let extractedText = '';
    let method = 'unknown';
    let warning: string | undefined;

    // ── TXT: read directly ───────────────────────────────────────────────────
    if (isTxt) {
      extractedText = await file.text();
      method = 'text-direct';
      console.log(`[RESUME_EXTRACT] TXT direct read: ${extractedText.length} chars`);
    }

    // ── PDF / DOCX: use Gemini multimodal document understanding ─────────────
    else if (isPdf || isDocx) {
      const apiKey =
        process.env.GEMINI_API_KEY || process.env.NEXT_PUBLIC_GEMINI_API_KEY;

      if (!apiKey) {
        console.error('[RESUME_EXTRACT] No Gemini API key configured — cannot extract PDF/DOCX');
        return NextResponse.json(
          { error: 'Server not configured for PDF extraction. Please paste your resume text directly.' },
          { status: 500 }
        );
      }

      const genAI = new GoogleGenerativeAI(apiKey);
      const model = genAI.getGenerativeModel({ model: 'gemini-2.0-flash' });

      // Convert file to base64 for Gemini
      const arrayBuffer = await file.arrayBuffer();
      const base64Data = Buffer.from(arrayBuffer).toString('base64');

      const mimeType = isPdf ? 'application/pdf' : 'application/vnd.openxmlformats-officedocument.wordprocessingml.document';

      const extractionPrompt = `Extract ALL text content from this resume document. 
Return ONLY the raw text content of the resume — no commentary, no markdown formatting, no JSON.
Include everything: name, contact info, education, work experience, projects, skills, certifications.
Preserve the structure so sections are clearly readable.
Do NOT add any preamble like "Here is the extracted text:" — output ONLY the resume text itself.`;

      console.log(`[RESUME_EXTRACT] Calling Gemini multimodal for ${isPdf ? 'PDF' : 'DOCX'}...`);

      const result = await model.generateContent([
        extractionPrompt,
        {
          inlineData: {
            mimeType,
            data: base64Data,
          },
        },
      ]);

      extractedText = result.response.text().trim();
      method = 'gemini-vision';
      console.log(`[RESUME_EXTRACT] Gemini extracted ${extractedText.length} chars from ${file.name}`);

      // If Gemini returned near-nothing, it might be a scanned image PDF with no layers
      if (extractedText.length < 50) {
        warning =
          'Could not extract readable text from this file. It may be a scanned image. Please paste your resume text manually.';
        console.warn(`[RESUME_EXTRACT] Gemini returned < 50 chars — likely scanned image: "${extractedText}"`);
      }
    } else {
      return NextResponse.json(
        { error: 'Unsupported file type. Please upload PDF, DOCX, or TXT.' },
        { status: 400 }
      );
    }

    // ── Cap output length ────────────────────────────────────────────────────
    const finalText =
      extractedText.length > MAX_OUTPUT_CHARS
        ? extractedText.slice(0, MAX_OUTPUT_CHARS) + '\n[...resume truncated for length]'
        : extractedText;

    console.log(
      `[RESUME_EXTRACT] Done. method=${method}, chars=${finalText.length}` +
        (warning ? `, WARNING: ${warning}` : '')
    );

    return NextResponse.json({
      text: finalText,
      length: finalText.length,
      method,
      ...(warning ? { warning } : {}),
    });
  } catch (error) {
    console.error('[RESUME_EXTRACT] Extraction failed:', error);
    return NextResponse.json(
      {
        error: 'Failed to extract resume text. Please paste your resume text manually.',
        details: error instanceof Error ? error.message : String(error),
      },
      { status: 500 }
    );
  }
}
