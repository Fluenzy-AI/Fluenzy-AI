const fs = require("fs");
var src = fs.readFileSync("src/lib/ats-engine.ts", "utf8");

// Remove everything up to and including the broken section (first 102 lines)
var lines = src.split("\n");
// Find where the ats engine comment starts (the real start of logic)
var realStart = -1;
for (var i = 0; i < lines.length; i++) {
  if (lines[i].indexOf("Advanced ATS Scoring Engine") !== -1) {
    realStart = i;
    break;
  }
}
if (realStart === -1) { console.error("Cannot find engine start"); process.exit(1); }
console.log("Real content starts at line:", realStart + 1);

var rest = lines.slice(realStart).join("\n");

// Build clean header
var bs = String.fromCharCode(92);
var q = String.fromCharCode(34);
var header = [
  'import pdfParse from ' + q + 'pdf-parse' + q + ';',
  'import mammoth from ' + q + 'mammoth' + q + ';',
  '',
  '/**',
  ' * Parse raw text from a resume buffer (PDF or DOCX).',
  ' * Falls through multiple strategies, never throws.',
  ' */',
  'export async function parseResume(',
  '  buffer: Buffer,',
  '  mimeType: string,',
  '): Promise<{ text: string; parseWarning?: string }> {',
  '  const isPdf = mimeType === ' + q + 'application/pdf' + q + ' || mimeType.includes(' + q + 'pdf' + q + ');',
  '  const isDocx = mimeType.includes(' + q + 'wordprocessingml' + q + ') || mimeType.includes(' + q + 'docx' + q + ');',
  '',
  '  if (isPdf) {',
  '    try {',
  '      const data = await pdfParse(buffer);',
  '      if (data.text && data.text.trim().length > 50) return { text: data.text };',
  '    } catch { /* fall through */ }',
  '    try {',
  '      const data = await pdfParse(buffer, { pagerender: () => Promise.resolve(' + q + q + ') });',
  '      if (data.text && data.text.trim().length > 20) return { text: data.text };',
  '    } catch { /* fall through */ }',
  '    return { text: buffer.toString(' + q + 'latin1' + q + '), parseWarning: ' + q + 'binary PDF fallback' + q + ' };',
  '  }',
  '  if (isDocx) {',
  '    try {',
  '      const result = await mammoth.extractRawText({ buffer });',
  '      if (result.value && result.value.trim().length > 20) return { text: result.value };',
  '    } catch { /* fall through */ }',
  '    return { text: ' + q + q + ', parseWarning: ' + q + 'DOCX parse failed' + q + ' };',
  '  }',
  '  return { text: buffer.toString(' + q + 'utf8' + q + ') };',
  '}',
  ''
].join("\n");

var out = header + rest;
fs.writeFileSync("src/lib/ats-engine.ts", out, "utf8");
console.log("Done. Lines:", out.split("\n").length);
