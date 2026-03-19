/**
 * Certificate PDF Generation Library
 * Generates professional certificates with QR codes and digital signatures
 */

import puppeteer from "puppeteer-core";
import chromium from "@sparticuz/chromium";
import fs from "fs";
import path from "path";

// Try to require regular puppeteer as fallback for local development
let puppeteerLocal: typeof puppeteer | null = null;
try {
  puppeteerLocal = require("puppeteer");
} catch {
  // puppeteer not available, will use puppeteer-core with chromium
}

export interface CertificateData {
  certificateNumber: string;
  type: "INTERNSHIP" | "EXPERIENCE" | "OFFER" | "RELIEVING" | "APPRECIATION" | "TRAINING";
  candidateName: string;
  candidateEmail?: string;
  
  // Common fields
  issueDate: Date;
  companyName?: string;
  
  // Type-specific data
  position?: string;
  department?: string;
  startDate?: Date;
  endDate?: Date;
  duration?: string;
  salary?: number;
  joiningDate?: Date;
  
  // Additional details
  projectDescription?: string;
  performanceNotes?: string;
  responsibilities?: string;
  achievements?: string;
  trainingName?: string;
  grade?: string;
  
  // HR & Signatures
  hrName: string;
  hrDesignation: string;
  hrSignatureBase64?: string;
  founderSignatureBase64?: string;
  companySealBase64?: string;
  
  // Verification
  qrCodeDataUrl: string; // QR code as data URL
  verificationUrl: string;
  
  // Logo
  logoBase64?: string;
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

/**
 * Generate QR Code Data URL
 * Uses canvas to generate QR code (lightweight solution)
 */
export function generateQRCode(text: string): string {
  // For server-side, we'll return a placeholder
  // In production, use a proper QR library or generate client-side
  // For now, use a QR code API
  return `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(text)}`;
}

/**
 * Calculate duration between two dates
 */
function calculateDuration(startDate: Date, endDate: Date): string {
  const months = Math.floor((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24 * 30));
  const years = Math.floor(months / 12);
  const remainingMonths = months % 12;
  
  if (years > 0 && remainingMonths > 0) {
    return `${years} year${years > 1 ? 's' : ''} and ${remainingMonths} month${remainingMonths > 1 ? 's' : ''}`;
  } else if (years > 0) {
    return `${years} year${years > 1 ? 's' : ''}`;
  } else {
    return `${months} month${months > 1 ? 's' : ''}`;
  }
}

/**
 * Build Internship Certificate HTML
 * Premium enterprise-grade A4 certificate (794×1123px)
 */
function buildInternshipCertificateHtml(d: CertificateData): string {
  const issueDateStr = d.issueDate.toLocaleDateString("en-IN", {
    day: "numeric", month: "long", year: "numeric"
  });
  const startDateStr = d.startDate?.toLocaleDateString("en-IN", {
    day: "numeric", month: "long", year: "numeric"
  });
  const endDateStr = d.endDate?.toLocaleDateString("en-IN", {
    day: "numeric", month: "long", year: "numeric"
  });
  
  const duration = d.duration || (d.startDate && d.endDate ? calculateDuration(d.startDate, d.endDate) : "");
  
  return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="utf-8"/>
<link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&family=Playfair+Display:wght@700&display=swap" rel="stylesheet">
<style>
  @page { size: A4; margin: 0; }
  * { margin: 0; padding: 0; box-sizing: border-box; }
  
  body {
    font-family: 'Inter', 'Helvetica Neue', sans-serif;
    font-size: 12px;
    color: #333;
    background: #FFFFFF;
    -webkit-print-color-adjust: exact;
    print-color-adjust: exact;
  }
  
  .page {
    width: 794px;
    min-height: 1123px;
    padding: 40px 52px;
    position: relative;
    background: #FFFFFF;
  }
  
  /* Decorative side borders */
  .page::before,
  .page::after {
    content: '';
    position: absolute;
    top: 0;
    bottom: 0;
    width: 3px;
    background: rgba(46, 58, 140, 0.15);
  }
  .page::before { left: 0; }
  .page::after { right: 0; }
  
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
    margin-bottom: 12px;
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
    display: flex;
    align-items: flex-start;
    gap: 16px;
  }
  
  .contact-info {
    text-align: right;
    font-size: 11px;
    color: #374151;
    line-height: 1.6;
  }
  
  .qr-box {
    width: 64px;
    height: 64px;
    padding: 6px;
    background: #FFFFFF;
    border: 1px solid #E5E8F0;
    border-radius: 4px;
    flex-shrink: 0;
  }
  
  .qr-box img {
    width: 100%;
    height: 100%;
    object-fit: contain;
  }
  
  /* Title Banner */
  .title-banner {
    background: #2E3A8C;
    text-align: center;
    padding: 12px 20px;
    margin: 0 -52px 10px -52px;
  }
  
  .title-banner h1 {
    font-size: 16px;
    font-weight: 600;
    color: #FFFFFF;
    letter-spacing: 0.2em;
    text-transform: uppercase;
    margin: 0;
  }
  
  .title-banner .subtitle {
    font-size: 10px;
    color: rgba(255, 255, 255, 0.75);
    margin-top: 3px;
  }
  
  /* Certificate Number */
  .cert-number {
    text-align: center;
    font-size: 10px;
    color: #666;
    letter-spacing: 0.05em;
    font-style: italic;
    margin: 6px 0;
  }
  
  /* Candidate Name Block */
  .candidate-name-block {
    text-align: center;
    margin: 8px 0;
  }
  
  .candidate-name {
    font-family: 'Playfair Display', serif;
    font-size: 26px;
    font-weight: 700;
    color: #2E3A8C;
    letter-spacing: 0.06em;
    text-transform: uppercase;
  }
  
  .name-underline {
    width: 50px;
    height: 2px;
    background: #2E3A8C;
    margin: 6px auto 0;
  }
  
  /* Description Text */
  .description {
    text-align: center;
    margin: 8px auto;
    max-width: 520px;
  }
  
  .description p {
    font-size: 12px;
    line-height: 1.7;
    color: #333;
  }
  
  .description strong {
    color: #2E3A8C;
    font-weight: 600;
  }
  
  /* Details Box - using divs instead of table */
  .details-box {
    border: 1px solid #D0D4E8;
    border-radius: 8px;
    margin: 12px 0;
  }
  
  .detail-row {
    display: flex;
    border-bottom: 1px solid #E5E8F0;
    font-size: 11px;
  }
  
  .detail-row:last-child {
    border-bottom: none;
  }
  
  .detail-row:nth-child(even) {
    background: #F7F8FC;
  }
  
  .detail-row:nth-child(odd) {
    background: #FFFFFF;
  }
  
  .detail-row:first-child {
    border-radius: 8px 8px 0 0;
  }
  
  .detail-row:last-child {
    border-radius: 0 0 8px 8px;
  }
  
  .detail-label {
    width: 30%;
    padding: 8px 12px;
    font-weight: 600;
    color: #2E3A8C;
    flex-shrink: 0;
  }
  
  .detail-value {
    width: 70%;
    padding: 8px 12px;
    color: #333;
    line-height: 1.5;
  }
  
  /* Performance Block - MUST come after details box */
  .performance-block {
    margin-top: 14px;
    margin-bottom: 10px;
    padding: 10px 14px;
    background: #F8F9FC;
    border: 1px solid #E5E8F0;
    border-radius: 6px;
    font-size: 11px;
    line-height: 1.6;
    color: #444;
    text-align: justify;
  }
  
  .performance-block strong {
    font-weight: 700;
    color: #1A1A2E;
  }
  
  /* Closing Line */
  .closing-line {
    margin: 12px 0;
    font-size: 11px;
    font-style: italic;
    color: #555;
    text-align: center;
    line-height: 1.5;
  }
  
  /* Signature Zone */
  .signature-zone {
    display: flex;
    justify-content: space-between;
    padding-top: 16px;
    border-top: 1px solid #E5E8F0;
    margin-top: 16px;
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
  
  /* Footer */
  .footer {
    text-align: center;
    padding-top: 10px;
    border-top: 1px solid #E0E3EF;
    margin-top: 12px;
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
        <div class="company-name">${d.companyName || 'Fluenzy AI'}</div>
        <div class="tagline">AI-Powered Communication Training</div>
      </div>
    </div>
    <div class="header-right">
      <div class="contact-info">
        <div>https://www.fluenzyai.app/</div>
      </div>
      <div class="qr-box">
        <img src="${d.qrCodeDataUrl}" alt="QR Code"/>
      </div>
    </div>
  </div>
  
  <!-- Title Banner -->
  <div class="title-banner">
    <h1>Certificate of Internship</h1>
    <div class="subtitle">This is to certify that</div>
  </div>
  
  <!-- Certificate Number -->
  <div class="cert-number">Certificate No: ${d.certificateNumber}</div>
  
  <!-- Candidate Name Block -->
  <div class="candidate-name-block">
    <div class="candidate-name">${d.candidateName}</div>
    <div class="name-underline"></div>
  </div>
  
  <!-- Description Text -->
  <div class="description">
    <p>
      has successfully completed the internship program at <strong>${d.companyName || 'Fluenzy AI'}</strong>
      ${d.position ? ` as <strong>${d.position}</strong>` : ''}
      ${d.department ? ` in the <strong>${d.department}</strong> department` : ''}.
    </p>
  </div>
  
  <!-- Details Box (div-based, not table) -->
  <div class="details-box">
    ${d.position ? `<div class="detail-row"><div class="detail-label">Position / Role</div><div class="detail-value">${d.position}</div></div>` : ''}
    ${d.department ? `<div class="detail-row"><div class="detail-label">Department</div><div class="detail-value">${d.department}</div></div>` : ''}
    ${startDateStr ? `<div class="detail-row"><div class="detail-label">Start Date</div><div class="detail-value">${startDateStr}</div></div>` : ''}
    ${endDateStr ? `<div class="detail-row"><div class="detail-label">End Date</div><div class="detail-value">${endDateStr}</div></div>` : ''}
    ${duration ? `<div class="detail-row"><div class="detail-label">Duration</div><div class="detail-value">${duration}</div></div>` : ''}
    ${d.projectDescription ? `<div class="detail-row"><div class="detail-label">Project / Work</div><div class="detail-value">${d.projectDescription}</div></div>` : ''}
  </div>
  
  <!-- Performance Block - comes AFTER details box -->
  ${d.performanceNotes ? `
  <div class="performance-block">
    <strong>Performance:</strong> ${d.performanceNotes}
  </div>
  ` : ''}
  
  <!-- Closing Line -->
  <div class="closing-line">
    ${d.candidateName.toUpperCase()} demonstrated professionalism, dedication, and strong learning abilities throughout the internship. We wish them success in their future endeavors.
  </div>
  
  <!-- Signature Zone -->
  <div class="signature-zone">
    <div class="sig-block">
      <div class="sig-placeholder">
        ${d.hrSignatureBase64
          ? `<img src="${d.hrSignatureBase64}" class="sig-img" alt="HR Signature"/>`
          : `<span class="sig-cursive">${d.hrName.split(" ").slice(0, 2).join(" ")}</span>`}
      </div>
      <div class="sig-line"></div>
      <div class="sig-name">${d.hrName}</div>
      <div class="sig-title">${d.hrDesignation}</div>
    </div>
    <div class="sig-block">
      <div class="sig-placeholder">
        ${d.founderSignatureBase64
          ? `<img src="${d.founderSignatureBase64}" class="sig-img" alt="CEO Signature"/>`
          : `<span class="sig-cursive">Achhuta Jha</span>`}
      </div>
      <div class="sig-line"></div>
      <div class="sig-name">ACHHUTA NAND JHA</div>
      <div class="sig-title">Founder & CEO</div>
    </div>
  </div>
  
  <!-- Footer -->
  <div class="footer">
    <p>${d.companyName || 'Fluenzy AI'} · Date of Issue: ${issueDateStr} · This is a computer-generated certificate · Certificate ID: ${d.certificateNumber}</p>
  </div>
</div>
</body>
</html>`;
}

/**
 * Build Experience Letter HTML - Enterprise Redesign
 */
function buildExperienceLetterHtml(d: CertificateData): string {
  const issueDateStr = d.issueDate.toLocaleDateString("en-IN", {
    day: "numeric", month: "long", year: "numeric"
  });
  const startDateStr = d.startDate?.toLocaleDateString("en-IN", {
    day: "numeric", month: "long", year: "numeric"
  });
  const endDateStr = d.endDate?.toLocaleDateString("en-IN", {
    day: "numeric", month: "long", year: "numeric"
  });
  
  const duration = d.duration || (d.startDate && d.endDate ? calculateDuration(d.startDate, d.endDate) : "");
  
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
  
  /* Decorative side borders */
  .page::before,
  .page::after {
    content: '';
    position: absolute;
    top: 0;
    bottom: 0;
    width: 3px;
    background: rgba(46, 58, 140, 0.15);
  }
  .page::before { left: 0; }
  .page::after { right: 0; }
  
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
    display: flex;
    align-items: flex-start;
    gap: 16px;
  }
  
  .contact-info {
    text-align: right;
    font-size: 11px;
    color: #374151;
    line-height: 1.6;
  }
  
  .qr-box {
    width: 64px;
    height: 64px;
    padding: 6px;
    background: #FFFFFF;
    border: 1px solid #E5E8F0;
    border-radius: 4px;
    flex-shrink: 0;
  }
  
  .qr-box img {
    width: 100%;
    height: 100%;
    object-fit: contain;
  }
  
  /* Date Line */
  .date-line {
    font-size: 12px;
    color: #333;
    margin-bottom: 20px;
  }
  
  /* Title */
  .title {
    font-size: 14px;
    font-weight: 700;
    color: #1A1A2E;
    letter-spacing: 0.08em;
    text-transform: uppercase;
    margin-bottom: 16px;
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
  
  /* Performance Paragraph */
  .performance-text {
    font-size: 12px;
    line-height: 1.75;
    color: #444;
    font-style: italic;
    text-align: justify;
    margin-bottom: 20px;
  }
  
  /* Details Box */
  .details-box {
    border: 1px solid #D0D4E8;
    border-radius: 8px;
    margin: 20px 0;
  }
  
  .detail-row {
    display: flex;
    border-bottom: 1px solid #E5E8F0;
    font-size: 12px;
  }
  
  .detail-row:last-child {
    border-bottom: none;
  }
  
  .detail-row:nth-child(even) {
    background: #F7F8FC;
  }
  
  .detail-row:nth-child(odd) {
    background: #FFFFFF;
  }
  
  .detail-row:first-child {
    border-radius: 8px 8px 0 0;
  }
  
  .detail-row:last-child {
    border-radius: 0 0 8px 8px;
  }
  
  .detail-label {
    width: 35%;
    padding: 10px 14px;
    font-weight: 600;
    color: #2E3A8C;
    flex-shrink: 0;
  }
  
  .detail-value {
    width: 65%;
    padding: 10px 14px;
    color: #333;
    line-height: 1.5;
  }
  
  /* Signature Zone */
  .signature-zone {
    display: flex;
    justify-content: space-between;
    padding-top: 20px;
    border-top: 1px solid #E5E8F0;
    margin-top: 28px;
  }
  
  .sig-block {
    width: 45%;
    text-align: center;
  }
  
  .sig-placeholder {
    height: 40px;
    display: flex;
    align-items: flex-end;
    justify-content: center;
  }
  
  .sig-img {
    max-height: 40px;
    max-width: 120px;
    object-fit: contain;
  }
  
  .sig-cursive {
    font-family: 'Brush Script MT', 'Segoe Script', cursive;
    font-size: 22px;
    color: #1A1A2E;
  }
  
  .sig-line {
    width: 120px;
    height: 1px;
    background: #333;
    margin: 8px auto;
  }
  
  .sig-name {
    font-size: 12px;
    font-weight: 600;
    color: #1A1A2E;
  }
  
  .sig-title {
    font-size: 10px;
    color: #666;
    margin-top: 2px;
  }
  
  /* Footer */
  .footer {
    text-align: center;
    padding-top: 12px;
    border-top: 1px solid #E0E3EF;
    margin-top: 20px;
  }
  
  .footer p {
    font-size: 9px;
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
        <div class="company-name">${d.companyName || 'Fluenzy AI'}</div>
        <div class="tagline">AI-Powered Communication Training</div>
      </div>
    </div>
    <div class="header-right">
      <div class="contact-info">
        <div>https://www.fluenzyai.app/</div>
      </div>
      <div class="qr-box">
        <img src="${d.qrCodeDataUrl}" alt="QR Code"/>
      </div>
    </div>
  </div>
  
  <!-- Date Line -->
  <div class="date-line">Date: ${issueDateStr}</div>
  
  <!-- Title -->
  <div class="title">TO WHOMSOEVER IT MAY CONCERN</div>
  
  <!-- Salutation -->
  <div class="salutation">This is to certify that</div>
  
  <!-- Body Paragraph 1 -->
  <p class="body-text">
    <strong>${d.candidateName}</strong> was employed with <strong>${d.companyName || 'Fluenzy AI'}</strong>
    ${d.position ? ` as a <strong>${d.position}</strong>` : ''}
    ${d.department ? ` in the <strong>${d.department}</strong> department` : ''}
    from <strong>${startDateStr}</strong> to <strong>${endDateStr}</strong>,
    a total duration of <strong>${duration}</strong>.
  </p>
  
  <!-- Body Paragraph 2 -->
  <p class="body-text">
    During the tenure, ${d.candidateName} demonstrated excellent professionalism and technical skills.
    ${d.projectDescription ? d.projectDescription : 'They contributed effectively to various projects and initiatives.'}
    We found them to be hardworking, reliable, and a collaborative team member.
  </p>
  
  <!-- Performance Paragraph -->
  <p class="performance-text">
    ${d.performanceNotes ? d.performanceNotes : `During their tenure, ${d.candidateName} consistently delivered high-quality work and contributed meaningfully to ${d.department || 'team'} goals.`}
    We wish them continued success in all future professional endeavors.
  </p>
  
  <!-- Details Box -->
  <div class="details-box">
    <div class="detail-row"><div class="detail-label">Full Name</div><div class="detail-value">${d.candidateName}</div></div>
    ${d.position ? `<div class="detail-row"><div class="detail-label">Designation</div><div class="detail-value">${d.position}</div></div>` : ''}
    ${d.department ? `<div class="detail-row"><div class="detail-label">Department</div><div class="detail-value">${d.department}</div></div>` : ''}
    <div class="detail-row"><div class="detail-label">Period</div><div class="detail-value">${startDateStr} to ${endDateStr}</div></div>
    ${duration ? `<div class="detail-row"><div class="detail-label">Duration</div><div class="detail-value">${duration}</div></div>` : ''}
  </div>
  
  <!-- Signature Zone -->
  <div class="signature-zone">
    <div class="sig-block">
      <div class="sig-placeholder">
        ${d.hrSignatureBase64
          ? `<img src="${d.hrSignatureBase64}" class="sig-img" alt="HR Signature"/>`
          : `<span class="sig-cursive">${d.hrName.split(" ").slice(0, 2).join(" ")}</span>`}
      </div>
      <div class="sig-line"></div>
      <div class="sig-name">${d.hrName}</div>
      <div class="sig-title">${d.hrDesignation}</div>
    </div>
    <div class="sig-block">
      <div class="sig-placeholder">
        ${d.founderSignatureBase64
          ? `<img src="${d.founderSignatureBase64}" class="sig-img" alt="CEO Signature"/>`
          : `<span class="sig-cursive">Achhuta Jha</span>`}
      </div>
      <div class="sig-line"></div>
      <div class="sig-name">ACHHUTA NAND JHA</div>
      <div class="sig-title">Founder & CEO</div>
    </div>
  </div>
  
  <!-- Footer -->
  <div class="footer">
    <p>${d.companyName || 'Fluenzy AI'} · Date of Issue: ${issueDateStr} · This is a computer-generated letter · Ref: ${d.certificateNumber}</p>
  </div>
</div>
</body>
</html>`;
}

/**
 * Build Relieving Letter HTML - Enterprise Redesign
 */
function buildRelievingLetterHtml(d: CertificateData): string {
  const issueDateStr = d.issueDate.toLocaleDateString("en-IN", {
    day: "numeric", month: "long", year: "numeric"
  });
  const startDateStr = d.startDate?.toLocaleDateString("en-IN", {
    day: "numeric", month: "long", year: "numeric"
  });
  const endDateStr = d.endDate?.toLocaleDateString("en-IN", {
    day: "numeric", month: "long", year: "numeric"
  });
  
  const duration = d.duration || (d.startDate && d.endDate ? calculateDuration(d.startDate, d.endDate) : "");
  
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
  
  /* Decorative side borders */
  .page::before,
  .page::after {
    content: '';
    position: absolute;
    top: 0;
    bottom: 0;
    width: 3px;
    background: rgba(46, 58, 140, 0.15);
  }
  .page::before { left: 0; }
  .page::after { right: 0; }
  
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
    border-bottom: 2px solid #C8A951;
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
    display: flex;
    align-items: flex-start;
    gap: 16px;
  }
  
  .contact-info {
    text-align: right;
    font-size: 11px;
    color: #374151;
    line-height: 1.6;
  }
  
  .qr-box {
    width: 64px;
    height: 64px;
    padding: 6px;
    background: #FFFFFF;
    border: 1px solid #E5E8F0;
    border-radius: 4px;
    flex-shrink: 0;
  }
  
  .qr-box img {
    width: 100%;
    height: 100%;
    object-fit: contain;
  }
  
  /* Date Line */
  .date-line {
    font-size: 12px;
    color: #333;
    margin-bottom: 20px;
  }
  
  /* Title Block */
  .title-block {
    margin-bottom: 18px;
  }
  
  .title {
    font-size: 16px;
    font-weight: 700;
    color: #1A1A2E;
    letter-spacing: 0.15em;
    text-transform: uppercase;
  }
  
  .title-underline {
    width: 40px;
    height: 2px;
    background: #2E3A8C;
    margin-top: 6px;
  }
  
  /* To Block */
  .to-block {
    margin-bottom: 14px;
    font-size: 13px;
    line-height: 1.6;
  }
  
  .to-block .to-label {
    color: #333;
  }
  
  .to-block .to-name {
    font-weight: 700;
    color: #1A1A2E;
  }
  
  .to-block .to-designation {
    font-size: 12px;
    color: #555;
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
  
  /* Closing Paragraph */
  .closing-text {
    font-size: 12px;
    line-height: 1.75;
    color: #444;
    font-style: italic;
    text-align: justify;
    margin-bottom: 18px;
  }
  
  /* Summary Box */
  .summary-box {
    border: 1px solid #D0D4E8;
    border-radius: 8px;
    margin: 18px 0;
  }
  
  .summary-row {
    display: flex;
    border-bottom: 1px solid #E5E8F0;
    font-size: 12px;
  }
  
  .summary-row:last-child {
    border-bottom: none;
  }
  
  .summary-row:nth-child(even) {
    background: #F7F8FC;
  }
  
  .summary-row:nth-child(odd) {
    background: #FFFFFF;
  }
  
  .summary-row:first-child {
    border-radius: 8px 8px 0 0;
  }
  
  .summary-row:last-child {
    border-radius: 0 0 8px 8px;
  }
  
  .summary-label {
    width: 35%;
    padding: 10px 14px;
    font-weight: 600;
    color: #2E3A8C;
    flex-shrink: 0;
  }
  
  .summary-value {
    width: 65%;
    padding: 10px 14px;
    color: #333;
    line-height: 1.5;
  }
  
  /* Signature Zone - Right aligned single signature */
  .signature-zone {
    display: flex;
    justify-content: flex-end;
    padding-top: 20px;
    border-top: 1px solid #E5E8F0;
    margin-top: 24px;
  }
  
  .sig-block {
    width: 45%;
    text-align: center;
  }
  
  .sig-placeholder {
    height: 40px;
    display: flex;
    align-items: flex-end;
    justify-content: center;
  }
  
  .sig-img {
    max-height: 40px;
    max-width: 120px;
    object-fit: contain;
  }
  
  .sig-cursive {
    font-family: 'Brush Script MT', 'Segoe Script', cursive;
    font-size: 22px;
    color: #1A1A2E;
  }
  
  .sig-line {
    width: 120px;
    height: 1px;
    background: #333;
    margin: 8px auto;
  }
  
  .sig-name {
    font-size: 12px;
    font-weight: 600;
    color: #1A1A2E;
  }
  
  .sig-title {
    font-size: 10px;
    color: #666;
    margin-top: 2px;
  }
  
  .sig-date {
    font-size: 10px;
    color: #666;
    margin-top: 4px;
  }
  
  /* Footer */
  .footer {
    text-align: center;
    padding-top: 12px;
    border-top: 1px solid #E0E3EF;
    margin-top: 20px;
  }
  
  .footer p {
    font-size: 9px;
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
        <div class="company-name">${d.companyName || 'Fluenzy AI'}</div>
        <div class="tagline">AI-Powered Communication Training</div>
      </div>
    </div>
    <div class="header-right">
      <div class="contact-info">
        <div>https://www.fluenzyai.app/</div>
      </div>
      <div class="qr-box">
        <img src="${d.qrCodeDataUrl}" alt="QR Code"/>
      </div>
    </div>
  </div>
  
  <!-- Date Line -->
  <div class="date-line">Date: ${issueDateStr}</div>
  
  <!-- Title Block -->
  <div class="title-block">
    <div class="title">RELIEVING LETTER</div>
    <div class="title-underline"></div>
  </div>
  
  <!-- To Block -->
  <div class="to-block">
    <div class="to-label">To,</div>
    <div class="to-name">${d.candidateName}</div>
    <div class="to-designation">${d.position || 'Employee'}${d.department ? `, ${d.department}` : ''}</div>
  </div>
  
  <!-- Body Paragraph 1 -->
  <p class="body-text">
    This is to certify that <strong>${d.candidateName}</strong> has been relieved from their
    duties as <strong>${d.position || 'Employee'}</strong>
    ${d.department ? ` in the <strong>${d.department}</strong> department` : ''} at <strong>${d.companyName || 'Fluenzy AI'}</strong>,
    effective <strong>${endDateStr}</strong>.
  </p>
  
  <!-- Body Paragraph 2 -->
  <p class="body-text">
    They joined us on <strong>${startDateStr}</strong> and served until <strong>${endDateStr}</strong>,
    completing a tenure of <strong>${duration}</strong>. All formalities including handover of
    responsibilities and clearance have been completed satisfactorily.
  </p>
  
  <!-- Closing Paragraph -->
  <p class="closing-text">
    We appreciate ${d.candidateName}'s contributions to the team and wish them all the
    best in their future endeavors.
  </p>
  
  <!-- Summary Box -->
  <div class="summary-box">
    <div class="summary-row"><div class="summary-label">Name</div><div class="summary-value">${d.candidateName}</div></div>
    ${d.position ? `<div class="summary-row"><div class="summary-label">Designation</div><div class="summary-value">${d.position}</div></div>` : ''}
    ${d.department ? `<div class="summary-row"><div class="summary-label">Department</div><div class="summary-value">${d.department}</div></div>` : ''}
    <div class="summary-row"><div class="summary-label">Date of Joining</div><div class="summary-value">${startDateStr}</div></div>
    <div class="summary-row"><div class="summary-label">Last Working Date</div><div class="summary-value">${endDateStr}</div></div>
    ${duration ? `<div class="summary-row"><div class="summary-label">Total Duration</div><div class="summary-value">${duration}</div></div>` : ''}
  </div>
  
  <!-- Signature Zone - Right aligned -->
  <div class="signature-zone">
    <div class="sig-block">
      <div class="sig-placeholder">
        ${d.hrSignatureBase64
          ? `<img src="${d.hrSignatureBase64}" class="sig-img" alt="HR Signature"/>`
          : `<span class="sig-cursive">${d.hrName.split(" ").slice(0, 2).join(" ")}</span>`}
      </div>
      <div class="sig-line"></div>
      <div class="sig-name">${d.hrName}</div>
      <div class="sig-title">${d.hrDesignation}</div>
      <div class="sig-date">Date: ${issueDateStr}</div>
    </div>
  </div>
  
  <!-- Footer -->
  <div class="footer">
    <p>${d.companyName || 'Fluenzy AI'} · Date of Issue: ${issueDateStr} · This is a computer-generated letter · Ref: ${d.certificateNumber}</p>
  </div>
</div>
</body>
</html>`;
}

/**
 * Build Appreciation Certificate HTML
 * Premium award-style certificate with gold accents
 */
function buildAppreciationCertificateHtml(d: CertificateData): string {
  const issueDateStr = d.issueDate.toLocaleDateString("en-IN", {
    day: "numeric", month: "long", year: "numeric"
  });

  return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="utf-8"/>
<link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&family=Playfair+Display:wght@600;700&display=swap" rel="stylesheet">
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
    padding: 52px;
    position: relative;
    background: #FFFFFF;
    display: flex;
    flex-direction: column;
  }
  
  /* Watermark */
  .watermark {
    position: absolute;
    top: 50%;
    left: 50%;
    transform: translate(-50%, -50%);
    font-size: 72px;
    font-weight: 900;
    color: rgba(200, 169, 81, 0.03);
    letter-spacing: 8px;
    white-space: nowrap;
    pointer-events: none;
    z-index: -1;
  }
  
  /* Decorative Gold Border Frame */
  .border-frame {
    position: absolute;
    top: 12px;
    left: 12px;
    right: 12px;
    bottom: 12px;
    border: 3px solid #C8A951;
    pointer-events: none;
  }
  
  .border-frame-inner {
    position: absolute;
    top: 20px;
    left: 20px;
    right: 20px;
    bottom: 20px;
    border: 1px solid #E8D98A;
    pointer-events: none;
  }
  
  /* Header Zone */
  .header {
    text-align: center;
    padding-bottom: 16px;
    margin-bottom: 20px;
  }
  
  .logo-row {
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 10px;
    margin-bottom: 8px;
  }
  
  .logo {
    width: 40px;
    height: 40px;
    object-fit: contain;
  }
  
  .company-name {
    font-size: 18px;
    font-weight: 700;
    color: #1A1A2E;
  }
  
  .tagline {
    font-size: 11px;
    color: #888;
    margin-top: 2px;
  }
  
  .header-rule {
    width: 80px;
    height: 1px;
    background: #C8A951;
    margin: 12px auto 0;
  }
  
  /* Award Title */
  .award-title {
    text-align: center;
    margin-top: 20px;
  }
  
  .award-title h1 {
    font-size: 22px;
    font-weight: 700;
    color: #C8A951;
    letter-spacing: 0.2em;
    text-transform: uppercase;
  }
  
  .award-subtitle {
    font-size: 12px;
    font-style: italic;
    color: #888;
    margin-top: 8px;
  }
  
  /* Recipient Name */
  .recipient-section {
    text-align: center;
    margin-top: 24px;
  }
  
  .recipient-name {
    font-family: 'Playfair Display', serif;
    font-size: 34px;
    font-weight: 700;
    color: #2E3A8C;
    text-transform: uppercase;
    letter-spacing: 0.05em;
  }
  
  .name-underline {
    width: 80px;
    height: 2px;
    background: #C8A951;
    margin: 10px auto 0;
  }
  
  .designation-line {
    font-size: 13px;
    color: #555;
    font-style: italic;
    margin-top: 12px;
  }
  
  /* Body Text */
  .body-text {
    max-width: 500px;
    margin: 24px auto 0;
    font-size: 13px;
    color: #333;
    text-align: center;
    line-height: 1.85;
  }
  
  /* Achievement Box */
  .achievement-box {
    max-width: 520px;
    margin: 20px auto 0;
    padding: 14px 24px;
    background: #FDF8EE;
    border: 1px solid #E8D98A;
    border-radius: 8px;
    text-align: center;
  }
  
  .achievement-label {
    font-size: 11px;
    font-weight: 600;
    color: #C8A951;
    text-transform: uppercase;
    letter-spacing: 0.1em;
    margin-bottom: 6px;
  }
  
  .achievement-text {
    font-size: 12px;
    color: #5A4A1A;
    line-height: 1.7;
  }
  
  /* Date Line */
  .date-line {
    text-align: center;
    font-size: 12px;
    color: #666;
    margin-top: 20px;
  }
  
  /* Signature Zone */
  .signature-zone {
    display: flex;
    justify-content: space-between;
    padding-top: 20px;
    border-top: 1px solid #E5E8F0;
    margin-top: 28px;
  }
  
  .sig-block {
    width: 45%;
    text-align: center;
  }
  
  .sig-placeholder {
    height: 44px;
    display: flex;
    align-items: flex-end;
    justify-content: center;
  }
  
  .sig-img {
    max-height: 44px;
    max-width: 120px;
    object-fit: contain;
  }
  
  .sig-cursive {
    font-family: 'Brush Script MT', 'Segoe Script', cursive;
    font-size: 24px;
    color: #1A1A2E;
  }
  
  .sig-line {
    width: 120px;
    height: 1px;
    background: #333;
    margin: 8px auto;
  }
  
  .sig-name {
    font-size: 13px;
    font-weight: 600;
    color: #1A1A2E;
  }
  
  .sig-title {
    font-size: 11px;
    color: #666;
    margin-top: 2px;
  }
  
  /* Company Seal Placeholder */
  .seal-placeholder {
    width: 56px;
    height: 56px;
    border: 2px dashed #D4C07A;
    border-radius: 50%;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 8px;
    color: #D4C07A;
    margin-left: 16px;
  }
  
  .sig-with-seal {
    display: flex;
    align-items: center;
    justify-content: center;
  }
  
  /* Footer */
  .footer {
    text-align: center;
    padding-top: 12px;
    border-top: 1px solid #E0E3EF;
    margin-top: auto;
  }
  
  .footer p {
    font-size: 10px;
    color: #AAA;
    letter-spacing: 0.04em;
  }
</style>
</head>
<body>
<div class="page">
  <!-- Decorative Border Frame -->
  <div class="border-frame"></div>
  <div class="border-frame-inner"></div>
  
  <!-- Watermark -->
  <div class="watermark">FLUENZY AI</div>
  
  <!-- Header Zone -->
  <div class="header">
    <div class="logo-row">
      ${d.logoBase64 ? `<img src="${d.logoBase64}" class="logo" alt="Company Logo"/>` : ''}
      <div class="company-name">${d.companyName || 'Fluenzy AI'}</div>
    </div>
    <div class="tagline">AI-Powered Communication Training</div>
    <div class="header-rule"></div>
  </div>
  
  <!-- Award Title -->
  <div class="award-title">
    <h1>Certificate of Appreciation</h1>
    <div class="award-subtitle">This certificate is proudly presented to</div>
  </div>
  
  <!-- Recipient Name -->
  <div class="recipient-section">
    <div class="recipient-name">${d.candidateName}</div>
    <div class="name-underline"></div>
    <div class="designation-line">${d.position || 'Team Member'}${d.department ? ` — ${d.department}` : ''}</div>
  </div>
  
  <!-- Body Text -->
  <div class="body-text">
    In recognition of outstanding performance, dedication, and exceptional contribution
    to the ${d.department || 'organization'}${d.startDate && d.endDate ? ` during ${d.startDate.toLocaleDateString("en-IN", { month: "long", year: "numeric" })} to ${d.endDate.toLocaleDateString("en-IN", { month: "long", year: "numeric" })}` : ''}.
    Your efforts have been invaluable to the success of ${d.companyName || 'Fluenzy AI'}.
  </div>
  
  <!-- Achievement Box -->
  ${d.achievements ? `
  <div class="achievement-box">
    <div class="achievement-label">Key Achievement</div>
    <div class="achievement-text">${d.achievements}</div>
  </div>
  ` : ''}
  
  <!-- Date Line -->
  <div class="date-line">Awarded on: ${issueDateStr}</div>
  
  <!-- Signature Zone -->
  <div class="signature-zone">
    <div class="sig-block">
      <div class="sig-placeholder">
        ${d.hrSignatureBase64
          ? `<img src="${d.hrSignatureBase64}" class="sig-img" alt="HR Signature"/>`
          : `<span class="sig-cursive">${d.hrName.split(" ").slice(0, 2).join(" ")}</span>`}
      </div>
      <div class="sig-line"></div>
      <div class="sig-name">${d.hrName}</div>
      <div class="sig-title">${d.hrDesignation}</div>
    </div>
    <div class="sig-block">
      <div class="sig-with-seal">
        <div>
          <div class="sig-placeholder">
            ${d.founderSignatureBase64
              ? `<img src="${d.founderSignatureBase64}" class="sig-img" alt="Founder Signature"/>`
              : `<span class="sig-cursive">Achhuta Jha</span>`}
          </div>
          <div class="sig-line"></div>
          <div class="sig-name">ACHHUTA NAND JHA</div>
          <div class="sig-title">Founder & CEO</div>
        </div>
        <div class="seal-placeholder">SEAL</div>
      </div>
    </div>
  </div>
  
  <!-- Footer -->
  <div class="footer">
    <p>${d.companyName || 'Fluenzy AI'} · https://www.fluenzyai.app/ · This is an official certificate of recognition</p>
  </div>
</div>
</body>
</html>`;
}

/**
 * Build Training Completion Certificate HTML
 * Academic + corporate diploma-style certificate
 */
function buildTrainingCertificateHtml(d: CertificateData): string {
  const issueDateStr = d.issueDate.toLocaleDateString("en-IN", {
    day: "numeric", month: "long", year: "numeric"
  });
  const startDateStr = d.startDate?.toLocaleDateString("en-IN", {
    day: "numeric", month: "long", year: "numeric"
  }) || "N/A";
  const endDateStr = d.endDate?.toLocaleDateString("en-IN", {
    day: "numeric", month: "long", year: "numeric"
  }) || "N/A";

  // Parse skills from achievements or create empty array
  const skills = d.achievements?.split(',').map(s => s.trim()).filter(s => s) || [];

  return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="utf-8"/>
<link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&family=Playfair+Display:wght@600;700&display=swap" rel="stylesheet">
<style>
  @page { size: A4; margin: 0; }
  * { margin: 0; padding: 0; box-sizing: border-box; }
  
  body {
    font-family: 'Inter', 'Helvetica Neue', sans-serif;
    font-size: 12px;
    color: #333;
    background: #FFFFFF;
    -webkit-print-color-adjust: exact;
    print-color-adjust: exact;
  }
  
  .page {
    width: 794px;
    min-height: 1123px;
    padding: 52px;
    position: relative;
    background: #FFFFFF;
    display: flex;
    flex-direction: column;
  }
  
  /* Decorative side borders */
  .page::before {
    content: '';
    position: absolute;
    top: 0;
    left: 0;
    bottom: 0;
    width: 3px;
    background: rgba(46, 58, 140, 0.15);
  }
  
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
    margin-bottom: 16px;
  }
  
  .header-left {
    display: flex;
    align-items: center;
    gap: 10px;
  }
  
  .logo {
    width: 36px;
    height: 36px;
    object-fit: contain;
  }
  
  .company-info .company-name {
    font-size: 20px;
    font-weight: 700;
    color: #1A1A2E;
  }
  
  .company-info .tagline {
    font-size: 10px;
    color: #888;
    margin-top: 2px;
  }
  
  .header-right {
    display: flex;
    align-items: flex-end;
    gap: 12px;
  }
  
  .contact-info {
    text-align: right;
    font-size: 10px;
    color: #555;
    line-height: 1.6;
  }
  
  .qr-box {
    width: 64px;
    height: 64px;
    background: #fff;
    border: 1px solid #E5E8F0;
    padding: 4px;
    flex-shrink: 0;
  }
  
  .qr-box img {
    width: 100%;
    height: 100%;
    object-fit: contain;
  }
  
  /* Title Banner */
  .title-banner {
    background: #2E3A8C;
    padding: 14px 20px;
    text-align: center;
    margin-bottom: 10px;
  }
  
  .title-banner h1 {
    font-size: 16px;
    font-weight: 600;
    color: #FFFFFF;
    letter-spacing: 0.2em;
    text-transform: uppercase;
  }
  
  .title-banner .subtitle {
    font-size: 10px;
    color: rgba(255, 255, 255, 0.75);
    margin-top: 4px;
  }
  
  /* Certificate Number */
  .cert-number {
    text-align: center;
    font-size: 10px;
    color: #666;
    font-style: italic;
    letter-spacing: 0.05em;
    margin: 10px 0;
  }
  
  /* Candidate Name Block */
  .candidate-section {
    text-align: center;
    margin: 12px 0;
  }
  
  .candidate-name {
    font-family: 'Playfair Display', serif;
    font-size: 28px;
    font-weight: 700;
    color: #2E3A8C;
    text-transform: uppercase;
    letter-spacing: 0.08em;
  }
  
  .name-underline {
    width: 60px;
    height: 2px;
    background: #2E3A8C;
    margin: 8px auto;
  }
  
  /* Description Text */
  .description {
    text-align: center;
    font-size: 12px;
    line-height: 1.8;
    color: #333;
    max-width: 500px;
    margin: 0 auto 14px;
  }
  
  .description strong {
    color: #2E3A8C;
    font-weight: 600;
  }
  
  .program-name {
    font-size: 14px;
    font-weight: 600;
    color: #2E3A8C;
    margin: 6px 0;
  }
  
  /* Details Box */
  .details-box {
    border: 1px solid #D0D4E8;
    border-radius: 8px;
    margin: 14px 0;
  }
  
  .detail-row {
    display: flex;
    border-bottom: 1px solid #E5E8F0;
    font-size: 11px;
  }
  
  .detail-row:last-child {
    border-bottom: none;
  }
  
  .detail-row:nth-child(even) {
    background: #F7F8FC;
  }
  
  .detail-row:nth-child(odd) {
    background: #FFFFFF;
  }
  
  .detail-row:first-child {
    border-radius: 8px 8px 0 0;
  }
  
  .detail-row:last-child {
    border-radius: 0 0 8px 8px;
  }
  
  .detail-label {
    width: 36%;
    padding: 8px 14px;
    font-weight: 600;
    color: #2E3A8C;
    flex-shrink: 0;
  }
  
  .detail-value {
    width: 64%;
    padding: 8px 14px;
    color: #333;
    line-height: 1.5;
    word-wrap: break-word;
    overflow-wrap: break-word;
  }
  
  /* Score Bar */
  .score-bar {
    display: flex;
    align-items: center;
    gap: 8px;
  }
  
  .score-text {
    min-width: 50px;
  }
  
  .score-track {
    flex: 1;
    height: 6px;
    background: #EEE;
    border-radius: 3px;
    max-width: 150px;
  }
  
  .score-fill {
    height: 6px;
    background: #2E3A8C;
    border-radius: 3px;
  }
  
  /* Skills Acquired Block */
  .skills-block {
    margin: 14px 0;
  }
  
  .skills-label {
    font-size: 11px;
    font-weight: 700;
    color: #2E3A8C;
    margin-bottom: 8px;
  }
  
  .skills-tags {
    display: flex;
    flex-wrap: wrap;
    gap: 6px;
  }
  
  .skill-tag {
    display: inline-block;
    background: #EEF0FA;
    color: #2E3A8C;
    font-size: 10px;
    padding: 3px 10px;
    border-radius: 99px;
  }
  
  /* Performance Block */
  .performance-block {
    margin-top: 14px;
    font-size: 11px;
    line-height: 1.75;
    color: #444;
    text-align: justify;
  }
  
  .performance-block strong {
    font-weight: 700;
    color: #1A1A2E;
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
    height: 40px;
    display: flex;
    align-items: flex-end;
    justify-content: center;
  }
  
  .sig-img {
    max-height: 40px;
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
  
  /* Footer */
  .footer {
    text-align: center;
    padding-top: 10px;
    border-top: 1px solid #E0E3EF;
    margin-top: auto;
  }
  
  .footer p {
    font-size: 9px;
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
        <div class="company-name">${d.companyName || 'Fluenzy AI'}</div>
        <div class="tagline">AI-Powered Communication Training</div>
      </div>
    </div>
    <div class="header-right">
      <div class="contact-info">
        <div>https://www.fluenzyai.app/</div>
      </div>
      <div class="qr-box">
        <img src="${d.qrCodeDataUrl}" alt="QR Code"/>
      </div>
    </div>
  </div>
  
  <!-- Title Banner -->
  <div class="title-banner">
    <h1>Certificate of Training Completion</h1>
    <div class="subtitle">This is to certify that</div>
  </div>
  
  <!-- Certificate Number -->
  <div class="cert-number">Certificate No: ${d.certificateNumber}</div>
  
  <!-- Candidate Name Block -->
  <div class="candidate-section">
    <div class="candidate-name">${d.candidateName}</div>
    <div class="name-underline"></div>
  </div>
  
  <!-- Description -->
  <div class="description">
    has successfully completed the training program
    <div class="program-name">${d.trainingName || d.position || 'Professional Training Program'}</div>
    conducted by <strong>${d.companyName || 'Fluenzy AI'}</strong>${d.department ? ` — <strong>${d.department}</strong> department` : ''}
  </div>
  
  <!-- Details Box -->
  <div class="details-box">
    <div class="detail-row">
      <div class="detail-label">Participant Name</div>
      <div class="detail-value">${d.candidateName}</div>
    </div>
    <div class="detail-row">
      <div class="detail-label">Program / Course</div>
      <div class="detail-value">${d.trainingName || d.position || 'Professional Training'}</div>
    </div>
    <div class="detail-row">
      <div class="detail-label">Training Mode</div>
      <div class="detail-value">${d.responsibilities || 'Online / Self-Paced'}</div>
    </div>
    ${d.department ? `
    <div class="detail-row">
      <div class="detail-label">Department</div>
      <div class="detail-value">${d.department}</div>
    </div>
    ` : ''}
    <div class="detail-row">
      <div class="detail-label">Start Date</div>
      <div class="detail-value">${startDateStr}</div>
    </div>
    <div class="detail-row">
      <div class="detail-label">End Date</div>
      <div class="detail-value">${endDateStr}</div>
    </div>
    <div class="detail-row">
      <div class="detail-label">Duration</div>
      <div class="detail-value">${d.duration || (d.startDate && d.endDate ? calculateDuration(d.startDate, d.endDate) : 'N/A')}</div>
    </div>
    ${d.projectDescription ? `
    <div class="detail-row">
      <div class="detail-label">Topics Covered</div>
      <div class="detail-value">${d.projectDescription}</div>
    </div>
    ` : ''}
    ${d.grade ? `
    <div class="detail-row">
      <div class="detail-label">Assessment Score</div>
      <div class="detail-value">
        <div class="score-bar">
          <span class="score-text">${d.grade}</span>
          <div class="score-track">
            <div class="score-fill" style="width: ${parseInt(d.grade) || 85}%;"></div>
          </div>
        </div>
      </div>
    </div>
    ` : ''}
  </div>
  
  <!-- Skills Acquired Block -->
  ${skills.length > 0 ? `
  <div class="skills-block">
    <div class="skills-label">Skills Acquired:</div>
    <div class="skills-tags">
      ${skills.map(skill => `<span class="skill-tag">${skill}</span>`).join('')}
    </div>
  </div>
  ` : ''}
  
  <!-- Performance Block -->
  ${d.performanceNotes ? `
  <div class="performance-block">
    <strong>Performance:</strong> ${d.performanceNotes}
  </div>
  ` : ''}
  
  <!-- Signature Zone -->
  <div class="signature-zone">
    <div class="sig-block">
      <div class="sig-placeholder">
        ${d.hrSignatureBase64
          ? `<img src="${d.hrSignatureBase64}" class="sig-img" alt="HR Signature"/>`
          : `<span class="sig-cursive">${d.hrName.split(" ").slice(0, 2).join(" ")}</span>`}
      </div>
      <div class="sig-line"></div>
      <div class="sig-name">${d.hrName}</div>
      <div class="sig-title">${d.hrDesignation}</div>
    </div>
    <div class="sig-block">
      <div class="sig-placeholder">
        ${d.founderSignatureBase64
          ? `<img src="${d.founderSignatureBase64}" class="sig-img" alt="Founder Signature"/>`
          : `<span class="sig-cursive">Achhuta Jha</span>`}
      </div>
      <div class="sig-line"></div>
      <div class="sig-name">ACHHUTA NAND JHA</div>
      <div class="sig-title">Founder & CEO</div>
    </div>
  </div>
  
  <!-- Footer -->
  <div class="footer">
    <p>${d.companyName || 'Fluenzy AI'} · Date of Issue: ${issueDateStr} · This is a computer-generated certificate · Certificate ID: ${d.certificateNumber}</p>
  </div>
</div>
</body>
</html>`;
}

/**
 * Build certificate HTML based on type
 */
export function buildCertificateHtml(data: CertificateData): string {
  switch (data.type) {
    case "INTERNSHIP":
      return buildInternshipCertificateHtml(data);
    case "EXPERIENCE":
      return buildExperienceLetterHtml(data);
    case "RELIEVING":
      return buildRelievingLetterHtml(data);
    case "APPRECIATION":
      return buildAppreciationCertificateHtml(data);
    case "TRAINING":
      return buildTrainingCertificateHtml(data);
    default:
      return buildInternshipCertificateHtml(data); // fallback
  }
}

/**
 * Generate Certificate PDF Buffer
 */
export async function generateCertificatePdfBuffer(data: CertificateData): Promise<Buffer> {
  const html = buildCertificateHtml(data);
  let browser;
  try {
    // Try to use local puppeteer first (development), fallback to chromium (production)
    if (puppeteerLocal && process.env.NODE_ENV !== "production") {
      browser = await puppeteerLocal.launch({
        headless: true,
        args: ["--no-sandbox", "--disable-setuid-sandbox", "--disable-dev-shm-usage", "--disable-gpu"],
      });
    } else {
      browser = await puppeteer.launch({
        args: [...chromium.args, "--no-sandbox", "--disable-setuid-sandbox"],
        defaultViewport: { width: 1920, height: 1080 },
        executablePath: await chromium.executablePath(),
        headless: true,
      });
    }
    
    const page = await browser.newPage();
    await page.setContent(html, { waitUntil: "networkidle0" });
    const pdfBuffer = await page.pdf({
      format: "A4",
      printBackground: true,
      margin: { top: "0", right: "0", bottom: "0", left: "0" },
    });
    await browser.close();
    return Buffer.from(pdfBuffer);
  } catch (err) {
    if (browser) await browser.close().catch(() => {});
    throw err;
  }
}
