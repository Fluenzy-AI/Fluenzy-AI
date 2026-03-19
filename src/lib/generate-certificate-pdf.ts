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
      path.join(process.cwd(), "public", "image", "final_logo-removebg-preview.png")
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
<style>
  * { margin:0; padding:0; box-sizing:border-box; }
  body { font-family: 'Times New Roman', Times, serif; font-size:13px; color:#1a1a1a; background:#fff; }
  .page { width:210mm; min-height:297mm; padding:20mm 25mm; position:relative; background:#fff; }
  
  .header { display:flex; align-items:center; justify-content:space-between; border-bottom:3px solid #4f46e5; padding-bottom:15px; margin-bottom:25px; }
  .header-left { display:flex; align-items:center; gap:15px; }
  .logo { width:60px; height:60px; object-fit:contain; }
  .company-name { font-size:26px; font-weight:800; color:#4f46e5; letter-spacing:0.6px; }
  .company-tagline { font-size:10px; color:#6b7280; margin-top:3px; }
  .header-right { text-align:right; font-size:10px; color:#6b7280; line-height:1.8; }
  
  .cert-title { background:linear-gradient(135deg, #4f46e5 0%, #6366f1 100%); color:#fff; text-align:center; padding:15px 0; border-radius:8px; margin-bottom:30px; box-shadow:0 4px 12px rgba(79,70,229,0.2); }
  .cert-title h1 { font-size:24px; letter-spacing:4px; font-weight:700; text-transform:uppercase; margin-bottom:5px; }
  .cert-title p { font-size:11px; opacity:0.9; letter-spacing:1px; }
  
  .cert-number { text-align:center; font-size:11px; color:#6b7280; margin-bottom:25px; font-weight:600; letter-spacing:1px; }
  
  .intro { text-align:center; font-size:14px; line-height:2; margin-bottom:35px; }
  .intro p { margin-bottom:15px; }
  .intro .name { font-size:32px; font-weight:700; color:#4f46e5; text-decoration:underline; text-decoration-style:wavy; text-decoration-color:#818cf8; margin:20px 0; }
  
  .details-box { border:2px solid #4f46e5; border-radius:10px; padding:20px 25px; margin:30px 0; background:linear-gradient(to bottom, #f5f3ff 0%, #fefeff 100%); }
  .details-box table { width:100%; border-collapse:collapse; }
  .details-box td { padding:8px 5px; font-size:13px; vertical-align:top; }
  .details-box td:first-child { font-weight:700; color:#374151; width:40%; }
  .details-box td:last-child { color:#111827; }
  
  .body-text { font-size:13px; line-height:1.9; color:#374151; margin-bottom:15px; text-align:justify; }
  
  .sig-section { display:flex; justify-content:space-between; margin-top:60px; margin-bottom:40px; }
  .sig-block { width:42%; text-align:center; }
  .sig-img { height:70px; object-fit:contain; display:block; margin:0 auto 8px; max-width:180px; }
  .sig-cursive { font-family: 'Brush Script MT', 'Segoe Script', cursive; font-size:32px; color:#1a1a1a; height:70px; display:flex; align-items:center; justify-content:center; }
  .sig-line { border-top:2px solid #4b5563; width:100%; margin-bottom:8px; }
  .sig-name { font-size:13px; font-weight:700; color:#111827; }
  .sig-designation { font-size:11px; color:#6b7280; margin-top:2px; }
  
  .qr-section { text-align:center; margin-top:40px; padding-top:30px; border-top:1px dashed #d1d5db; }
  .qr-code { width:120px; height:120px; margin:10px auto 15px; border:2px solid #e5e7eb; border-radius:8px; padding:5px; background:#fff; }
  .verify-text { font-size:11px; color:#6b7280; }
  .verify-url { font-size:10px; color:#4f46e5; word-break:break-all; margin-top:5px; }
  
  .watermark { position:fixed; top:50%; left:50%; transform:translate(-50%,-50%) rotate(-35deg); font-size:80px; color:rgba(79,70,229,0.04); font-weight:900; letter-spacing:8px; white-space:nowrap; pointer-events:none; z-index:0; }
  
  .footer { position:fixed; bottom:10mm; left:25mm; right:25mm; text-align:center; font-size:9px; color:#9ca3af; border-top:1px solid #e5e7eb; padding-top:8px; }
</style>
</head>
<body>
<div class="watermark">${d.companyName || 'FLUENZY AI'}</div>
<div class="page">
  
  <div class="header">
    <div class="header-left">
      ${d.logoBase64 ? `<img src="${d.logoBase64}" class="logo" alt="Company Logo"/>` : ""}
      <div>
        <div class="company-name">${d.companyName || 'Fluenzy AI'}</div>
        <div class="company-tagline">AI-Powered Communication & Interview Training Platform</div>
      </div>
    </div>
    <div class="header-right">
      <div><strong>Website:</strong> fluenzyai.com</div>
      <div><strong>Email:</strong> hr@fluenzyai.com</div>
      <div><strong>Country:</strong> India</div>
    </div>
  </div>
  
  <div class="cert-title">
    <h1>Certificate of Internship</h1>
    <p>This is to certify that</p>
  </div>
  
  <div class="cert-number">Certificate No: ${d.certificateNumber}</div>
  
  <div class="intro">
    <div class="name">${d.candidateName}</div>
    <p style="font-size:14px; color:#374151; max-width:700px; margin:0 auto;">
      has successfully completed the internship program at <strong>${d.companyName || 'Fluenzy AI'}</strong>
      ${d.position ? `as <strong>${d.position}</strong>` : ''}
      ${d.department ? ` in the <strong>${d.department}</strong> department` : ''}.
    </p>
  </div>
  
  <div class="details-box">
    <table>
      ${d.position ? `<tr><td>Position / Role</td><td>${d.position}</td></tr>` : ''}
      ${d.department ? `<tr><td>Department</td><td>${d.department}</td></tr>` : ''}
      ${startDateStr ? `<tr><td>Internship Start Date</td><td>${startDateStr}</td></tr>` : ''}
      ${endDateStr ? `<tr><td>Internship End Date</td><td>${endDateStr}</td></tr>` : ''}
      ${duration ? `<tr><td>Duration</td><td>${duration}</td></tr>` : ''}
      ${d.projectDescription ? `<tr><td>Project / Work</td><td>${d.projectDescription}</td></tr>` : ''}
    </table>
  </div>
  
  ${d.performanceNotes ? `
  <p class="body-text">
    <strong>Performance:</strong> ${d.performanceNotes}
  </p>
  ` : ''}
  
  <p class="body-text">
    During the internship period, ${d.candidateName} demonstrated professionalism, dedication, and strong
    learning abilities. We wish them success in their future endeavors.
  </p>
  
  <div class="sig-section">
    <div class="sig-block">
      ${d.hrSignatureBase64
        ? `<img src="${d.hrSignatureBase64}" class="sig-img" alt="HR Signature"/>`
        : `<div class="sig-cursive">${d.hrName.split(" ").slice(0, 2).join(" ")}</div>`}
      <div class="sig-line"></div>
      <div class="sig-name">${d.hrName}</div>
      <div class="sig-designation">${d.hrDesignation}</div>
    </div>
    <div class="sig-block">
      ${d.founderSignatureBase64
        ? `<img src="${d.founderSignatureBase64}" class="sig-img" alt="Founder Signature"/>`
        : `<div style="height:70px;"></div>`}
      <div class="sig-line"></div>
      <div class="sig-name">ACHHUTA NAND JHA</div>
      <div class="sig-designation">Founder & CEO</div>
    </div>
  </div>
  
  ${d.companySealBase64 ? `
  <div style="text-align:center; margin-top:20px;">
    <img src="${d.companySealBase64}" style="width:100px; height:100px; object-fit:contain;" alt="Company Seal"/>
  </div>
  ` : ''}
  
  <div class="qr-section">
    <img src="${d.qrCodeDataUrl}" class="qr-code" alt="Verification QR Code"/>
    <div class="verify-text"><strong>Verify this certificate</strong></div>
    <div class="verify-url">${d.verificationUrl}</div>
  </div>
  
  <div class="footer">
    ${d.companyName || 'Fluenzy AI'} · Date of Issue: ${issueDateStr} · This is a computer-generated certificate
  </div>
  
</div>
</body>
</html>`;
}

/**
 * Build Experience Letter HTML
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
<style>
  * { margin:0; padding:0; box-sizing:border-box; }
  body { font-family: 'Times New Roman', Times, serif; font-size:13px; color:#1a1a1a; background:#fff; }
  .page { width:210mm; min-height:297mm; padding:20mm 25mm; position:relative; background:#fff; }
  
  .header { display:flex; align-items:center; justify-content:space-between; border-bottom:3px solid#4f46e5; padding-bottom:15px; margin-bottom:25px; }
  .header-left { display:flex; align-items:center; gap:15px; }
  .logo { width:60px; height:60px; object-fit:contain; }
  .company-name { font-size:26px; font-weight:800; color:#4f46e5; letter-spacing:0.6px; }
  .company-tagline { font-size:10px; color:#6b7280; margin-top:3px; }
  .header-right { text-align:right; font-size:10px; color:#6b7280; line-height:1.8; }
  
  .doc-title { background:linear-gradient(135deg, #4f46e5 0%, #6366f1 100%); color:#fff; text-align:center; padding:12px 0; border-radius:8px; margin-bottom:25px; }
  .doc-title h1 { font-size:22px; letter-spacing:3px; font-weight:700; text-transform:uppercase; }
  
  .ref-date { display:flex; justify-content:space-between; font-size:12px; color:#374151; margin-bottom:25px; font-weight:600; }
  
  .salutation { font-size:13px; margin-bottom:15px; font-weight:600; }
  .body-text { font-size:13px; line-height:1.9; color:#374151; margin-bottom:15px; text-align:justify; }
  
  .details-box { border:2px solid #4f46e5; border-radius:10px; padding:18px 22px; margin:25px 0; background:#f5f3ff; }
  .details-box table { width:100%; border-collapse:collapse; }
  .details-box td { padding:8px 5px; font-size:13px; vertical-align:top; }
  .details-box td:first-child { font-weight:700; color:#374151; width:40%; }
  .details-box td:last-child { color:#111827; }
  
  .sig-section { display:flex; justify-content:space-between; margin-top:60px; }
  .sig-block { width:42%; text-align:center; }
  .sig-img { height:70px; object-fit:contain; display:block; margin:0 auto 8px; max-width:180px; }
  .sig-cursive { font-family: 'Brush Script MT', cursive; font-size:32px; color:#1a1a1a; height:70px; display:flex; align-items:center; justify-content:center; }
  .sig-line { border-top:2px solid #4b5563; width:100%; margin-bottom:8px; }
  .sig-name { font-size:13px; font-weight:700; color:#111827; }
  .sig-designation { font-size:11px; color:#6b7280; margin-top:2px; }
  
  .qr-section { text-align:center; margin-top:40px; padding-top:30px; border-top:1px dashed #d1d5db; }
  .qr-code { width:100px; height:100px; margin:10px auto; border:2px solid #e5e7eb; border-radius:8px; padding:5px; }
  .verify-text { font-size:10px; color:#6b7280; }
  
  .watermark { position:fixed; top:50%; left:50%; transform:translate(-50%,-50%) rotate(-35deg); font-size:80px; color:rgba(79,70,229,0.04); font-weight:900; letter-spacing:8px; pointer-events:none; z-index:0; }
  
  .footer { position:fixed; bottom:10mm; left:25mm; right:25mm; text-align:center; font-size:9px; color:#9ca3af; border-top:1px solid #e5e7eb; padding-top:8px; }
</style>
</head>
<body>
<div class="watermark">${d.companyName || 'FLUENZY AI'}</div>
<div class="page">
  
  <div class="header">
    <div class="header-left">
      ${d.logoBase64 ? `<img src="${d.logoBase64}" class="logo" alt="Company Logo"/>` : ""}
      <div>
        <div class="company-name">${d.companyName || 'Fluenzy AI'}</div>
        <div class="company-tagline">AI-Powered Communication & Interview Training Platform</div>
      </div>
    </div>
    <div class="header-right">
      <div><strong>Website:</strong> fluenzyai.com</div>
      <div><strong>Email:</strong> hr@fluenzyai.com</div>
      <div><strong>Country:</strong> India</div>
    </div>
  </div>
  
  <div class="doc-title">
    <h1>Experience Letter</h1>
  </div>
  
  <div class="ref-date">
    <span><strong>Ref:</strong> ${d.certificateNumber}</span>
    <span><strong>Date:</strong> ${issueDateStr}</span>
  </div>
  
  <p class="salutation">To Whom It May Concern,</p>
  
  <p class="body-text">
    This is to certify that <strong>${d.candidateName}</strong> was employed with <strong>${d.companyName || 'Fluenzy AI'}</strong>
    ${d.position ? `as <strong>${d.position}</strong>` : ''}
    ${d.department ? ` in the <strong>${d.department}</strong> department` : ''}
    from <strong>${startDateStr}</strong> to <strong>${endDateStr}</strong>.
  </p>
  
  <div class="details-box">
    <table>
      <tr><td>Employee Name</td><td>${d.candidateName}</td></tr>
      ${d.position ? `<tr><td>Designation</td><td>${d.position}</td></tr>` : ''}
      ${d.department ? `<tr><td>Department</td><td>${d.department}</td></tr>` : ''}
      ${startDateStr ? `<tr><td>Date of Joining</td><td>${startDateStr}</td></tr>` : ''}
      ${endDateStr ? `<tr><td>Last Working Day</td><td>${endDateStr}</td></tr>` : ''}
      ${duration ? `<tr><td>Total Duration</td><td>${duration}</td></tr>` : ''}
    </table>
  </div>
  
  ${d.responsibilities ? `
  <p class="body-text">
    <strong>Key Responsibilities:</strong><br/>
    ${d.responsibilities}
  </p>
  ` : ''}
  
  <p class="body-text">
    During their tenure, ${d.candidateName} demonstrated excellent professional skills, dedication, and
    a positive attitude. They were a valuable member of our team.
  </p>
  
  <p class="body-text">
    We wish them all the best in their future endeavors.
  </p>
  
  <div class="sig-section">
    <div class="sig-block">
      ${d.hrSignatureBase64
        ? `<img src="${d.hrSignatureBase64}" class="sig-img" alt="HR Signature"/>`
        : `<div class="sig-cursive">${d.hrName.split(" ").slice(0, 2).join(" ")}</div>`}
      <div class="sig-line"></div>
      <div class="sig-name">${d.hrName}</div>
      <div class="sig-designation">${d.hrDesignation}</div>
    </div>
    <div class="sig-block">
      ${d.founderSignatureBase64
        ? `<img src="${d.founderSignatureBase64}" class="sig-img" alt="Founder Signature"/>`
        : `<div style="height:70px;"></div>`}
      <div class="sig-line"></div>
      <div class="sig-name">ACHHUTA NAND JHA</div>
      <div class="sig-designation">Founder & CEO</div>
    </div>
  </div>
  
  <div class="qr-section">
    <img src="${d.qrCodeDataUrl}" class="qr-code" alt="QR Code"/>
    <div class="verify-text">Verify: ${d.verificationUrl}</div>
  </div>
  
  <div class="footer">
    ${d.companyName || 'Fluenzy AI'} · ${issueDateStr} · This is a computer-generated letter
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
    // Add more types here
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
