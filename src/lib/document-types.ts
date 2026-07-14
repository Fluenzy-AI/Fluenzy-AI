/**
 * Document Types & Naming Conventions
 * 
 * Defines all document types supported by the PDF pipeline,
 * their R2 folder paths, and deterministic file naming functions.
 * 
 * GOLDEN RULE: File names must be deterministic and collision-free.
 * Format: FLUENZY-{TYPE_CODE}-{YEAR}-{UNIQUE_ID}.pdf
 */

// ── Document Types ───────────────────────────────────────────────────────────

export type DocumentType =
  | "certificate"
  | "offer-letter"
  | "receipt"
  | "invoice"
  | "college-receipt"
  | "resume"
  | "interview-report"
  | "payroll"
  | "salary-slip"
  | "relieving-letter"
  | "experience-letter"
  | "training-certificate"
  | "appreciation-certificate"
  | "competition-certificate"
  | "hr-report"
  | "candidate-report"
  | "gd-report"
  | "technical-report"
  | "ai-score-report"
  | "audit-pdf";

// ── R2 Folder Mapping ────────────────────────────────────────────────────────

const FOLDER_MAP: Record<DocumentType, string> = {
  "certificate":               "certificates",
  "offer-letter":              "offer-letters",
  "receipt":                   "receipts",
  "invoice":                   "invoices",
  "college-receipt":           "college-receipts",
  "resume":                    "resumes",
  "interview-report":          "reports/interviews",
  "payroll":                   "payroll",
  "salary-slip":               "payroll/salary-slips",
  "relieving-letter":          "relieving-letters",
  "experience-letter":         "experience-letters",
  "training-certificate":      "training",
  "appreciation-certificate":  "certificates/appreciation",
  "competition-certificate":   "competition",
  "hr-report":                 "reports/hr",
  "candidate-report":          "reports/candidates",
  "gd-report":                 "reports/gd",
  "technical-report":          "reports/technical",
  "ai-score-report":           "reports/ai-scores",
  "audit-pdf":                 "audit-pdfs",
};

/**
 * Get R2 folder path for a document type
 */
export function getDocumentFolder(type: DocumentType): string {
  return FOLDER_MAP[type] ?? "misc";
}

// ── Type Code Mapping (for file names) ───────────────────────────────────────

const TYPE_CODE_MAP: Record<DocumentType, string> = {
  "certificate":               "CERT",
  "offer-letter":              "OFFER",
  "receipt":                   "RECEIPT",
  "invoice":                   "INVOICE",
  "college-receipt":           "COLLEGE",
  "resume":                    "RESUME",
  "interview-report":          "REPORT",
  "payroll":                   "PAYROLL",
  "salary-slip":               "SALARY",
  "relieving-letter":          "REL",
  "experience-letter":         "EXP",
  "training-certificate":      "TRN",
  "appreciation-certificate":  "APR",
  "competition-certificate":   "COMP",
  "hr-report":                 "HR",
  "candidate-report":          "CAND",
  "gd-report":                 "GD",
  "technical-report":          "TECH",
  "ai-score-report":           "AISCORE",
  "audit-pdf":                 "AUDIT",
};

/**
 * Get the short type code for file naming
 */
export function getTypeCode(type: DocumentType): string {
  return TYPE_CODE_MAP[type] ?? "DOC";
}

// ── Deterministic File Naming ────────────────────────────────────────────────

/**
 * Build a deterministic, collision-free file name for a document.
 * 
 * Format: FLUENZY-{TYPE_CODE}-{YEAR}-{UNIQUE_ID}.pdf
 * 
 * @param type - Document type
 * @param uniqueId - A unique identifier (certificate number, order ID, user ID, etc.)
 * @param year - Year (defaults to current year)
 * @returns Deterministic file name (e.g., "FLUENZY-INT-2026-WZHIF.pdf")
 * 
 * @example
 * buildDocumentFileName("certificate", "WZHIF")
 * // → "FLUENZY-CERT-2026-WZHIF.pdf"
 * 
 * buildDocumentFileName("receipt", "order_abc123")
 * // → "FLUENZY-RECEIPT-2026-ORDER_ABC123.pdf"
 */
export function buildDocumentFileName(
  type: DocumentType,
  uniqueId: string,
  year?: number
): string {
  const typeCode = getTypeCode(type);
  const y = year ?? new Date().getFullYear();
  // Sanitize uniqueId: uppercase, remove unsafe characters
  const safeId = uniqueId
    .toUpperCase()
    .replace(/[^A-Z0-9_-]/g, "")
    .slice(0, 64); // Cap length
  return `FLUENZY-${typeCode}-${y}-${safeId}.pdf`;
}

/**
 * Build a complete R2 storage key (folder + owner + filename).
 * 
 * Format: {folder}/{ownerId}/{filename}
 * 
 * @example
 * buildDocumentStorageKey("certificate", "user_abc", "FLUENZY-CERT-2026-WZHIF.pdf")
 * // → "certificates/user_abc/FLUENZY-CERT-2026-WZHIF.pdf"
 */
export function buildDocumentStorageKey(
  type: DocumentType,
  ownerId: string,
  fileName: string
): string {
  const folder = getDocumentFolder(type);
  const safeOwner = ownerId.replace(/[^a-zA-Z0-9_-]/g, "");
  return `${folder}/${safeOwner}/${fileName}`;
}

/**
 * Build a deterministic cache lookup key.
 * Used to check if a document already exists in the FileRecord table.
 * 
 * @returns A string that uniquely identifies this document for caching
 */
export function buildCacheLookupKey(
  type: DocumentType,
  documentId: string
): string {
  return `${type}:${documentId}`;
}

// ── Certificate-Specific Naming ──────────────────────────────────────────────

const CERT_TYPE_CODE: Record<string, string> = {
  INTERNSHIP:   "INT",
  EXPERIENCE:   "EXP",
  OFFER:        "OFF",
  RELIEVING:    "REL",
  APPRECIATION: "APR",
  TRAINING:     "TRN",
};

/**
 * Build file name specifically for HR certificates using their existing
 * certificate number format (FLUENZY-INT-2026-XXXXX).
 * 
 * @param certificateNumber - Existing cert number (e.g., "FLUENZY-INT-2026-WZHIF")
 * @returns File name (e.g., "FLUENZY-INT-2026-WZHIF.pdf")
 */
export function buildCertificateFileName(certificateNumber: string): string {
  // Certificate numbers are already deterministic — just append .pdf
  return `${certificateNumber}.pdf`;
}

/**
 * Get the certificate type code for folder organization
 */
export function getCertificateTypeCode(type: string): string {
  return CERT_TYPE_CODE[type] ?? "CERT";
}
