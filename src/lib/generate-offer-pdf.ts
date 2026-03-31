/**
 * Shared Offer Letter PDF Generator
 * Used by both POST /api/portal/hr/offer-letters (email attachment)
 * and GET /api/portal/hr/offer-letters/[id]/pdf (download)
 * 
 * OPTIMIZED: Uses shared browser instance from pdf-browser.ts for fast PDF generation.
 */

import fs from "fs";
import path from "path";
import { getBrowser, scheduleBrowserClose } from "./pdf-browser";

export interface OfferPdfData {
  offerId: string;
  candidateName: string;
  position: string;
  department: string;
  salary: number;
  joiningDate: Date;
  acceptanceDeadline?: Date | null;
  createdAt: Date;
  issuedBy: string;
  // HR info
  hrName: string;
  hrDesignation: string;
  salaryType?: string;      // "per annum" | "per month"
  employmentType?: string;
  workLocation?: string;
  // Signatures
  founderSigBase64: string;  // data:image/... URI fetched from MongoDB
  logoBase64: string;        // data:image/... URI from filesystem
}

function readLogoBase64(): string {
  try {
    const buf = fs.readFileSync(
      path.join(process.cwd(), "public", "favicon", "white-removebg-preview1.png")
    );
    return `data:image/png;base64,${buf.toString("base64")}`;
  } catch {
    return "";
  }
}

export function readLogoBase64Export(): string {
  return readLogoBase64();
}

export function buildOfferHtml(d: OfferPdfData): string {
  const joiningDateStr = d.joiningDate.toLocaleDateString("en-IN", {
    day: "numeric", month: "long", year: "numeric",
  });
  const issueDateStr = d.createdAt.toLocaleDateString("en-IN", {
    day: "numeric", month: "long", year: "numeric",
  });

  // Use HR-specified deadline if available, else 7 days before joining as fallback
  const deadlineDate = d.acceptanceDeadline
    ? d.acceptanceDeadline
    : new Date(d.joiningDate.getTime() - 7 * 24 * 60 * 60 * 1000);
  const acceptanceDeadlineStr = deadlineDate.toLocaleDateString("en-IN", {
    day: "numeric", month: "long", year: "numeric",
  });

  const refNo = `FLUENZY-OFR-${d.createdAt.getFullYear()}-${d.offerId.slice(-5).toUpperCase()}`;

  return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="utf-8"/>
<link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap" rel="stylesheet">
<style>
  @page { size: A4; margin: 0; }
  * { margin: 0; padding: 0; box-sizing: border-box; }
  
  body {
    font-family: 'Inter', 'Helvetica Neue', sans-serif;
    font-size: 13px;
    color: #333;
    background: #FFFFFF;
    -webkit-print-color-adjust: exact;
    print-color-adjust: exact;
  }
  
  .page {
    width: 794px;
    min-height: 1123px;
    padding: 52px 60px;
    position: relative;
    background: #FFFFFF;
  }
  
  /* Left accent bar */
  .page::before {
    content: '';
    position: absolute;
    top: 0;
    left: 0;
    bottom: 0;
    width: 4px;
    background: #2E3A8C;
  }
  
  /* Right decorative border */
  .page::after {
    content: '';
    position: absolute;
    top: 0;
    right: 0;
    bottom: 0;
    width: 3px;
    background: rgba(46, 58, 140, 0.15);
  }
  
  /* Watermark */
  .watermark {
    position: absolute;
    top: 50%;
    left: 50%;
    transform: translate(-50%, -50%);
    font-size: 72px;
    font-weight: 900;
    color: rgba(46, 58, 140, 0.03);
    letter-spacing: 8px;
    white-space: nowrap;
    pointer-events: none;
    z-index: -1;
  }
  
  /* Header Zone */
  .header {
    display: flex;
    justify-content: space-between;
    align-items: flex-start;
    padding-bottom: 12px;
    border-bottom: 2px solid #2E3A8C;
    margin-bottom: 24px;
  }
  
  .header-left {
    display: flex;
    align-items: center;
    gap: 12px;
  }
  
  .logo {
    width: 48px;
    height: 48px;
    object-fit: contain;
  }
  
  .company-info .company-name {
    font-size: 22px;
    font-weight: 700;
    color: #1A1A2E;
    letter-spacing: 0.02em;
  }
  
  .company-info .tagline {
    font-size: 11px;
    color: #6b7280;
    margin-top: 2px;
  }
  
  .header-right {
    text-align: right;
    font-size: 11px;
    color: #374151;
    line-height: 1.6;
  }
  
  /* Date + Ref Line */
  .meta-row {
    display: flex;
    justify-content: space-between;
    font-size: 11px;
    color: #666;
    margin-bottom: 20px;
  }
  
  /* Addressee Block */
  .addressee {
    margin-bottom: 16px;
  }
  
  .addressee-name {
    font-size: 14px;
    font-weight: 700;
    color: #1A1A2E;
  }
  
  .addressee-detail {
    font-size: 12px;
    color: #555;
    line-height: 1.5;
  }
  
  /* Subject Line */
  .subject-line {
    font-size: 13px;
    font-weight: 700;
    color: #2E3A8C;
    text-decoration: underline;
    margin-bottom: 14px;
  }
  
  /* Salutation */
  .salutation {
    font-size: 13px;
    color: #333;
    margin-bottom: 10px;
  }
  
  /* Body Paragraphs */
  .body-text {
    font-size: 13px;
    line-height: 1.85;
    color: #333;
    text-align: justify;
    margin-bottom: 12px;
  }
  
  .body-text strong {
    color: #2E3A8C;
    font-weight: 600;
  }
  
  /* Terms Box */
  .terms-box {
    border: 1px solid #D0D4E8;
    border-radius: 8px;
    margin: 18px 0;
  }
  
  .terms-row {
    display: flex;
    border-bottom: 1px solid #E5E8F0;
    font-size: 12px;
  }
  
  .terms-row:last-child {
    border-bottom: none;
  }
  
  .terms-row:nth-child(even) {
    background: #F7F8FC;
  }
  
  .terms-row:nth-child(odd) {
    background: #FFFFFF;
  }
  
  .terms-row:first-child {
    border-radius: 8px 8px 0 0;
  }
  
  .terms-row:last-child {
    border-radius: 0 0 8px 8px;
  }
  
  .terms-label {
    width: 35%;
    padding: 10px 14px;
    font-weight: 600;
    color: #2E3A8C;
    flex-shrink: 0;
  }
  
  .terms-value {
    width: 65%;
    padding: 10px 14px;
    color: #333;
    line-height: 1.5;
  }
  
  /* Acceptance Clause */
  .acceptance-clause {
    font-size: 12px;
    font-style: italic;
    color: #666;
    text-align: center;
    margin: 16px 0;
  }
  
  /* Signature Zone */
  .signature-zone {
    display: flex;
    justify-content: space-between;
    padding-top: 16px;
    border-top: 1px solid #E5E8F0;
    margin-top: 20px;
  }
  
  .sig-block {
    width: 45%;
    text-align: center;
  }
  
  .sig-placeholder {
    height: 36px;
    display: flex;
    align-items: flex-end;
    justify-content: center;
  }
  
  .sig-img {
    max-height: 36px;
    max-width: 100px;
    object-fit: contain;
  }
  
  .sig-cursive {
    font-family: 'Brush Script MT', 'Segoe Script', cursive;
    font-size: 20px;
    color: #1A1A2E;
  }
  
  .sig-line {
    width: 100px;
    height: 1px;
    background: #333;
    margin: 6px auto;
  }
  
  .sig-name {
    font-size: 11px;
    font-weight: 600;
    color: #1A1A2E;
  }
  
  .sig-title {
    font-size: 9px;
    color: #666;
    margin-top: 2px;
  }
  
  /* Candidate Acceptance Box */
  .accept-box {
    margin-top: 16px;
    padding: 12px 14px;
    border: 1px dashed #D0D4E8;
    border-radius: 6px;
    font-size: 11px;
    color: #444;
  }
  
  .accept-box strong {
    display: block;
    margin-bottom: 8px;
    font-size: 12px;
    color: #1A1A2E;
  }
  
  /* Footer */
  .footer {
    text-align: center;
    padding-top: 10px;
    border-top: 1px solid #E0E3EF;
    margin-top: 16px;
  }
  
  .footer p {
    font-size: 8px;
    color: #999;
    letter-spacing: 0.04em;
  }
</style>
</head>
<body>
<div class="page">
  <!-- Watermark -->
  <div class="watermark">FLUENZY AI</div>
  
  <!-- Header Zone -->
  <div class="header">
    <div class="header-left">
      ${d.logoBase64 ? `<img src="${d.logoBase64}" class="logo" alt="Company Logo"/>` : '<div class="logo"></div>'}
      <div class="company-info">
        <div class="company-name">Fluenzy AI</div>
        <div class="tagline">AI-Powered Communication Training</div>
      </div>
    </div>
    <div class="header-right">
      <div>https://www.fluenzyai.app/</div>
    </div>
  </div>
  
  <!-- Date + Ref Line -->
  <div class="meta-row">
    <span>Date: ${issueDateStr}</span>
    <span>Ref No: ${refNo}</span>
  </div>
  
  <!-- Addressee Block -->
  <div class="addressee">
    <div class="addressee-name">${d.candidateName}</div>
    <div class="addressee-detail">${d.workLocation || 'India'}</div>
  </div>
  
  <!-- Subject Line -->
  <div class="subject-line">Subject: Offer of Employment — ${d.position}</div>
  
  <!-- Salutation -->
  <div class="salutation">Dear <strong>${d.candidateName.split(' ')[0]}</strong>,</div>
  
  <!-- Opening Paragraph -->
  <p class="body-text">
    We are pleased to offer you the position of <strong>${d.position}</strong> in the
    <strong>${d.department}</strong> department at <strong>Fluenzy AI</strong>.
    Your start date will be <strong>${joiningDateStr}</strong>.
  </p>
  
  <!-- Terms Table -->
  <div class="terms-box">
    <div class="terms-row"><div class="terms-label">Position / Role</div><div class="terms-value">${d.position}</div></div>
    <div class="terms-row"><div class="terms-label">Department</div><div class="terms-value">${d.department}</div></div>
    <div class="terms-row"><div class="terms-label">Start Date</div><div class="terms-value">${joiningDateStr}</div></div>
    <div class="terms-row"><div class="terms-label">Work Type</div><div class="terms-value">${d.workLocation || 'Remote / Hybrid'}</div></div>
    <div class="terms-row"><div class="terms-label">${d.salaryType === "per month" ? "Monthly Stipend" : "Salary (CTC)"}</div><div class="terms-value">₹${d.salary.toLocaleString("en-IN")} ${d.salaryType || "per annum"}</div></div>
    <div class="terms-row"><div class="terms-label">Employment Type</div><div class="terms-value">${d.employmentType || 'Full-Time'}</div></div>
    <div class="terms-row"><div class="terms-label">Accept By</div><div class="terms-value">${acceptanceDeadlineStr}</div></div>
  </div>
  
  <!-- Additional Info -->
  <p class="body-text">
    This offer is subject to satisfactory completion of background verification and submission of required documents.
    We look forward to having you join our team and contribute to Fluenzy AI's mission.
  </p>
  
  <!-- Acceptance Clause -->
  <div class="acceptance-clause">
    This offer is valid until ${acceptanceDeadlineStr}. Please sign and return a copy to confirm acceptance.
  </div>
  
  <!-- Signature Zone -->
  <div class="signature-zone">
    <div class="sig-block">
      <div class="sig-placeholder">
        <span class="sig-cursive">${d.hrName.split(" ").slice(0, 2).join(" ")}</span>
      </div>
      <div class="sig-line"></div>
      <div class="sig-name">${d.hrName}</div>
      <div class="sig-title">${d.hrDesignation}</div>
    </div>
    <div class="sig-block">
      <div class="sig-placeholder">
        ${d.founderSigBase64
          ? `<img src="${d.founderSigBase64}" class="sig-img" alt="Founder Signature"/>`
          : `<span class="sig-cursive">Achhuta Jha</span>`}
      </div>
      <div class="sig-line"></div>
      <div class="sig-name">ACHHUTA NAND JHA</div>
      <div class="sig-title">Founder & CEO</div>
    </div>
  </div>
  
  <!-- Candidate Acceptance Box -->
  <div class="accept-box">
    <strong>Candidate Acceptance</strong>
    I, ${d.candidateName}, hereby accept the above offer of employment and confirm my joining date of ${joiningDateStr}.
    <br/><br/>
    Signature: ________________________ &nbsp;&nbsp;&nbsp; Date: ________________________
  </div>
  
  <!-- Footer -->
  <div class="footer">
    <p>Fluenzy AI · https://www.fluenzyai.app/ · This offer letter is confidential and legally binding</p>
  </div>
</div>
</body>
</html>`;
}

export async function generateOfferPdfBuffer(d: OfferPdfData): Promise<Buffer> {
  const html = buildOfferHtml(d);
  const startTime = Date.now();
  
  // Use shared browser instance (much faster than launching new browser each time)
  const browser = await getBrowser();
  let page = null;
  
  try {
    page = await browser.newPage();
    page.setDefaultTimeout(15000);
    
    // Use domcontentloaded for faster rendering (no need to wait for external resources)
    await page.setContent(html, { waitUntil: "domcontentloaded" });
    
    // Small delay for CSS to fully apply
    await new Promise(resolve => setTimeout(resolve, 50));
    
    const pdfBuffer = await page.pdf({
      format: "A4",
      printBackground: true,
      margin: { top: "0", right: "0", bottom: "0", left: "0" },
    });
    
    console.log(`[OFFER-PDF] Generated in ${Date.now() - startTime}ms`);
    return Buffer.from(pdfBuffer);
  } finally {
    // Close page but keep browser running for next request
    if (page) {
      try { await page.close(); } catch {}
    }
    scheduleBrowserClose();
  }
}
