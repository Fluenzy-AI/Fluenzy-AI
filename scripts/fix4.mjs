import fs from 'fs';
let src = fs.readFileSync('src/lib/ats-engine.ts','utf8');

// Prepend imports and parseResume export at the very top
const prepend = `import pdfParse from "pdf-parse";
import mammoth from "mammoth";

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
    // Strategy 1: pdf-parse standard
    try {
      const data = await pdfParse(buffer);
      if (data.text && data.text.trim().length > 50) return { text: data.text };
    } catch { /* fall through */ }

    // Strategy 2: pdf-parse raw (no renderer)
    try {
      const data = await pdfParse(buffer, { pagerender: () => Promise.resolve("") });
      if (data.text && data.text.trim().length > 20) return { text: data.text };
    } catch { /* fall through */ }

    // Strategy 3: raw buffer as latin1 string (handles some encrypted/linearized PDFs)
    try {
      const raw = buffer.toString("latin1");
      const textChunks = raw.match(/BT[\s\S]*?ET/g) ?? [];
      const extracted = textChunks
        .join(" ")
        .replace(/[^\x20-\x7E\n]/g, " ")
        .replace(/\s{2,}/g, " ")
        .trim();
      if (extracted.length > 50) return { text: extracted, parseWarning: "low-fidelity PDF extraction" };
    } catch { /* fall through */ }

    return { text: buffer.toString("utf8"), parseWarning: "binary PDF fallback" };
  }

  if (isDocx) {
    try {
      const result = await mammoth.extractRawText({ buffer });
      if (result.value && result.value.trim().length > 20) return { text: result.value };
    } catch { /* fall through */ }
    return { text: "", parseWarning: "DOCX parse failed" };
  }

  // Plain text / other formats
  return { text: buffer.toString("utf8") };
}

`;

src = prepend + src;
fs.writeFileSync('src/lib/ats-engine.ts', src, 'utf8');
console.log('Done. Lines:', src.split('\n').length);
