import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { callGeminiWithFallback } from '@/lib/gemini-router';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const maxDuration = 60;

const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5 MB
const MAX_OUTPUT_CHARS = 8_000;
const MIN_TEXT_CHARS = 80; // below this → assume scanned/image PDF

const EXTRACTION_PROMPT = `Extract ALL text content from this resume document.
Return ONLY the raw text content of the resume — no commentary, no markdown formatting, no JSON.
Include everything: name, contact info, education, work experience, projects, skills, certifications.
Preserve the structure so sections are clearly readable.
Do NOT add any preamble like "Here is the extracted text:" — output ONLY the resume text itself.`;

/**
 * POST /api/extract-resume
 *
 * Extraction strategy (cheapest → expensive):
 *   1. TXT  → FileReader in browser (already handled client-side)
 *   2. PDF  → pdf-parse (pure JS, ZERO quota, works on text-layer PDFs)
 *   3. PDF image-only / DOCX → Gemini multimodal (quota used only as last resort)
 *
 * Body: FormData { file: File (PDF / DOCX / TXT) }
 * Response: { text, length, method, warning? }
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
        { status: 400 },
      );
    }

    const fileName = file.name.toLowerCase();
    const isTxt  = fileName.endsWith('.txt');
    const isPdf  = fileName.endsWith('.pdf')  || file.type === 'application/pdf';
    const isDocx =
      fileName.endsWith('.docx') ||
      fileName.endsWith('.doc')  ||
      file.type === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document';

    console.log(`[RESUME_EXTRACT] Starting: ${file.name} (${file.size} bytes, type=${file.type})`);

    let extractedText = '';
    let method        = 'unknown';
    let warning: string | undefined;

    // ── Strategy 1: TXT — direct read, no AI ─────────────────────────────────
    if (isTxt) {
      extractedText = await file.text();
      method = 'txt-direct';
      console.log(`[RESUME_EXTRACT] TXT direct read: ${extractedText.length} chars`);
    }

    // ── Strategy 2: PDF — try pdf-parse first (no quota, no AI) ─────────────
    else if (isPdf) {
      const arrayBuffer = await file.arrayBuffer();
      const buffer      = Buffer.from(arrayBuffer);

      let pdfParseText = '';
      try {
        // Dynamic import to avoid edge runtime issues
        const pdfModule = await import('pdf-parse');
        const pdfParse = (pdfModule as any).default || pdfModule;
        const parsed   = await pdfParse(buffer);
        pdfParseText   = (parsed.text || '').trim();
        console.log(`[RESUME_EXTRACT] pdf-parse extracted: ${pdfParseText.length} chars`);
      } catch (pdfErr) {
        console.warn('[RESUME_EXTRACT] pdf-parse failed:', (pdfErr as Error).message);
      }

      if (pdfParseText.length >= MIN_TEXT_CHARS) {
        // Text layer found — no AI needed ✓
        extractedText = pdfParseText;
        method        = 'pdf-parse';
        console.log(`[RESUME_EXTRACT] Using pdf-parse result (${extractedText.length} chars) — no AI needed`);
      } else {
        // Scanned / image-only PDF — fall back to Gemini OCR
        console.log(`[RESUME_EXTRACT] pdf-parse returned < ${MIN_TEXT_CHARS} chars — scanned PDF, trying Gemini OCR`);
        const base64Data = buffer.toString('base64');
        try {
          const result = await callGeminiWithFallback({
            prompt: EXTRACTION_PROMPT,
            inlineData: { mimeType: 'application/pdf', data: base64Data },
            preferHighCapability: false,
          });
          extractedText = result.text;
          method        = `gemini-ocr-${result.model}`;
          console.log(`[RESUME_EXTRACT] Gemini OCR success: method=${method}, chars=${extractedText.length}`);
        } catch (geminiErr) {
          const msg = (geminiErr as Error).message;
          console.error('[RESUME_EXTRACT] Gemini OCR also failed:', msg);
          // Return what we have from pdf-parse (even if short)
          if (pdfParseText.length > 0) {
            extractedText = pdfParseText;
            method        = 'pdf-parse-partial';
            warning       = 'Limited text extracted. If your resume looks incorrect, please paste the text manually.';
          } else {
            return NextResponse.json(
              {
                error: 'Could not extract text from this PDF. It may be image-only and AI extraction is temporarily unavailable. Please paste your resume text manually.',
                details: msg,
              },
              { status: 500 },
            );
          }
        }
      }

      // Warn if still too short after both attempts
      if (extractedText.length < MIN_TEXT_CHARS && !warning) {
        warning = 'Very little text was extracted. The PDF may be image-only. Please paste your resume text manually.';
      }
    }

    // ── Strategy 3: DOCX — Gemini multimodal (no local parser available) ─────
    else if (isDocx) {
      const arrayBuffer = await file.arrayBuffer();
      const base64Data  = Buffer.from(arrayBuffer).toString('base64');
      try {
        const result = await callGeminiWithFallback({
          prompt: EXTRACTION_PROMPT,
          inlineData: {
            mimeType: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
            data: base64Data,
          },
          preferHighCapability: false,
        });
        extractedText = result.text;
        method        = `gemini-docx-${result.model}`;
        console.log(`[RESUME_EXTRACT] DOCX extraction: method=${method}, chars=${extractedText.length}`);
      } catch (err) {
        const msg = (err as Error).message;
        return NextResponse.json(
          {
            error: 'AI extraction is temporarily busy. Please paste your resume text manually.',
            details: msg,
          },
          { status: 500 },
        );
      }
    } else {
      return NextResponse.json(
        { error: 'Unsupported file type. Please upload PDF, DOCX, or TXT.' },
        { status: 400 },
      );
    }

    // ── Cap output length ─────────────────────────────────────────────────────
    const finalText =
      extractedText.length > MAX_OUTPUT_CHARS
        ? extractedText.slice(0, MAX_OUTPUT_CHARS) + '\n[...resume truncated for length]'
        : extractedText;

    console.log(
      `[RESUME_EXTRACT] Done. method=${method}, chars=${finalText.length}` +
        (warning ? `, WARNING: ${warning}` : ''),
    );

    return NextResponse.json({
      text:   finalText,
      length: finalText.length,
      method,
      ...(warning ? { warning } : {}),
    });

  } catch (error) {
    console.error('[RESUME_EXTRACT] Unexpected error:', error);
    return NextResponse.json(
      {
        error: 'Failed to extract resume text. Please paste your resume text manually.',
        details: error instanceof Error ? error.message : String(error),
      },
      { status: 500 },
    );
  }
}
