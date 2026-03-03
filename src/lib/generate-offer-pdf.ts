/**
 * Shared Offer Letter PDF Generator
 * Used by both POST /api/portal/hr/offer-letters (email attachment)
 * and GET /api/portal/hr/offer-letters/[id]/pdf (download)
 */

import puppeteer from "puppeteer";
import fs from "fs";
import path from "path";

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
  employmentType?: string;
  workLocation?: string;
  // Signatures
  founderSigBase64: string;  // data:image/... URI fetched from MongoDB
  logoBase64: string;        // data:image/... URI from filesystem
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

  const refNo = `FLZ/HR/${d.createdAt.getFullYear()}/${d.offerId.slice(-6).toUpperCase()}`;

  return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="utf-8"/>
<style>
  * { margin:0; padding:0; box-sizing:border-box; }
  body { font-family: 'Times New Roman', Times, serif; font-size:13px; color:#1a1a1a; background:#fff; }
  .page { width:210mm; min-height:297mm; padding:16mm 22mm 28mm 22mm; position:relative; }

  .header { display:flex; align-items:center; justify-content:space-between; border-bottom:3px solid #4f46e5; padding-bottom:12px; margin-bottom:18px; }
  .header-left { display:flex; align-items:center; gap:14px; }
  .logo { width:52px; height:52px; object-fit:contain; }
  .company-name { font-size:24px; font-weight:800; color:#4f46e5; letter-spacing:0.5px; }
  .company-tagline { font-size:9.5px; color:#6b7280; margin-top:2px; }
  .header-right { text-align:right; font-size:10px; color:#6b7280; line-height:1.7; }

  .title-band { background:#4f46e5; color:#fff; text-align:center; padding:8px 0; border-radius:4px; margin-bottom:18px; }
  .title-band h1 { font-size:16px; letter-spacing:2.5px; font-weight:700; text-transform:uppercase; }

  .meta-row { display:flex; justify-content:space-between; font-size:11.5px; color:#374151; margin-bottom:16px; }
  .salutation { font-size:13px; margin-bottom:10px; }
  .body-text { font-size:13px; line-height:1.75; color:#374151; margin-bottom:12px; }

  .details-box { border:1.5px solid #4f46e5; border-radius:6px; padding:14px 18px; margin:16px 0; background:#f5f3ff; }
  .details-box table { width:100%; border-collapse:collapse; }
  .details-box td { padding:5px 2px; font-size:12.5px; vertical-align:top; }
  .details-box td:first-child { font-weight:700; color:#374151; width:45%; }
  .details-box td:last-child { color:#111827; }

  .closing { font-size:13px; line-height:1.75; color:#374151; margin-top:12px; }

  .sig-section { display:flex; justify-content:space-between; margin-top:44px; }
  .sig-block { width:44%; text-align:center; }
  .sig-img { height:60px; object-fit:contain; display:block; margin:0 auto 4px; max-width:160px; }
  .sig-cursive { font-family: 'Brush Script MT', 'Segoe Script', cursive; font-size:30px; color:#1a1a1a; height:60px; display:flex; align-items:center; justify-content:center; }
  .sig-line { border-top:1.5px solid #4b5563; width:100%; margin-bottom:6px; }
  .sig-name { font-size:12.5px; font-weight:700; color:#111827; }
  .sig-designation { font-size:10.5px; color:#6b7280; margin-top:1px; }

  .watermark { position:fixed; top:50%; left:50%; transform:translate(-50%,-50%) rotate(-35deg); font-size:72px; color:rgba(79,70,229,0.05); font-weight:900; letter-spacing:6px; white-space:nowrap; pointer-events:none; z-index:0; }

  .footer { position:fixed; bottom:8mm; left:22mm; right:22mm; text-align:center; font-size:8.5px; color:#9ca3af; border-top:1px solid #e5e7eb; padding-top:5px; }
  .confidential { text-align:center; margin-top:24px; font-size:10px; color:#9ca3af; font-style:italic; }

  .accept-box { border:1px dashed #d1d5db; border-radius:6px; padding:12px 16px; margin-top:20px; font-size:12px; color:#374151; }
  .accept-box strong { display:block; margin-bottom:6px; font-size:12.5px; color:#111827; }
</style>
</head>
<body>
<div class="watermark">FLUENZY AI</div>
<div class="page">

  <div class="header">
    <div class="header-left">
      ${d.logoBase64 ? `<img src="${d.logoBase64}" class="logo" alt="Fluenzy AI Logo"/>` : ""}
      <div>
        <div class="company-name">Fluenzy AI</div>
        <div class="company-tagline">AI-Powered Communication &amp; Interview Training Platform</div>
      </div>
    </div>
    <div class="header-right">
      <div><strong>Website:</strong> fluenzyai.com</div>
      <div><strong>Email:</strong> hr@fluenzyai.com</div>
      <div><strong>Country:</strong> India</div>
    </div>
  </div>

  <div class="title-band"><h1>Letter of Offer</h1></div>

  <div class="meta-row">
    <span><strong>Ref:</strong> ${refNo}</span>
    <span><strong>Date of Issue:</strong> ${issueDateStr}</span>
  </div>

  <p class="salutation">Dear <strong>${d.candidateName}</strong>,</p>

  <p class="body-text">
    We are delighted to extend this offer of employment to you at <strong>Fluenzy AI</strong>.
    After careful consideration of your profile, we are pleased to offer you the position of
    <strong>${d.position}</strong> in the <strong>${d.department}</strong> department.
    We believe your skills and experience will be a valuable addition to our growing team.
  </p>

  <div class="details-box">
    <table>
      <tr><td>Position / Designation</td><td>${d.position}</td></tr>
      <tr><td>Department</td><td>${d.department}</td></tr>
      <tr><td>Annual CTC (Cost to Company)</td><td>₹${d.salary.toLocaleString("en-IN")} per annum</td></tr>
      <tr><td>Date of Joining</td><td>${joiningDateStr}</td></tr>
      <tr><td>Accept Offer By</td><td><strong>${acceptanceDeadlineStr}</strong></td></tr>
      <tr><td>Employment Type</td><td>${d.employmentType || "Full-Time, Permanent"}</td></tr>
      <tr><td>Work Location</td><td>${d.workLocation || "India (Remote / Hybrid)"}</td></tr>
    </table>
  </div>

  <p class="body-text">
    This offer is subject to satisfactory completion of background verification and timely submission
    of all required documents prior to your joining date. Please sign and return a copy of this letter
    to confirm your acceptance on or before <strong>${acceptanceDeadlineStr}</strong>.
  </p>

  <p class="body-text">
    We look forward to having you join our team and contribute to Fluenzy AI's mission of building
    world-class AI-powered learning and communication experiences. Should you have any questions
    regarding this offer, please feel free to contact our HR team.
  </p>

  <p class="closing">Congratulations and a warm welcome to the <strong>Fluenzy AI</strong> family!</p>

  <div class="accept-box">
    <strong>Candidate Acceptance</strong>
    I, <strong>${d.candidateName}</strong>, hereby accept the above offer of employment and confirm my
    joining date of <strong>${joiningDateStr}</strong>.
    <br/><br/>
    Signature: ________________________ &nbsp;&nbsp;&nbsp; Date: ________________________
  </div>

  <div class="sig-section">
    <div class="sig-block">
      <div class="sig-cursive">${d.hrName.split(" ").slice(0, 2).join(" ")}</div>
      <div class="sig-line"></div>
      <div class="sig-name">${d.hrName}</div>
      <div class="sig-designation">${d.hrDesignation}, Fluenzy AI</div>
    </div>
    <div class="sig-block">
      ${d.founderSigBase64
        ? `<img src="${d.founderSigBase64}" class="sig-img" alt="Founder Signature"/>`
        : `<div style="height:60px;"></div>`}
      <div class="sig-line"></div>
      <div class="sig-name">ACHHUTA NAND JHA</div>
      <div class="sig-designation">Founder &amp; CEO, Fluenzy AI</div>
    </div>
  </div>

  <p class="confidential">
    This document is confidential and intended solely for ${d.candidateName}.
    Unauthorized use, reproduction or distribution is strictly prohibited.
  </p>

  <div class="footer">
    Fluenzy AI &nbsp;·&nbsp; AI-Powered Communication Training &nbsp;·&nbsp; fluenzyai.com
    &nbsp;·&nbsp; This offer letter was generated electronically and is legally binding.
  </div>

</div>
</body>
</html>`;
}

export async function generateOfferPdfBuffer(d: OfferPdfData): Promise<Buffer> {
  const html = buildOfferHtml(d);
  let browser;
  try {
    browser = await puppeteer.launch({
      headless: true,
      args: ["--no-sandbox", "--disable-setuid-sandbox", "--disable-dev-shm-usage", "--disable-gpu"],
    });
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
