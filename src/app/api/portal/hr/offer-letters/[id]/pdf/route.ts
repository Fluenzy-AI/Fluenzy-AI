/**
 * HR Portal - Offer Letter PDF Generation
 * GET /api/portal/hr/offer-letters/[id]/pdf
 * Generates a professional PDF with Founder + HR digital signatures
 */

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getPortalAuthFromRequest } from "@/lib/portal-auth";
import puppeteer from "puppeteer";
import fs from "fs";
import path from "path";

function readImageAsBase64(filePath: string, mimeType: string): string {
  try {
    const buffer = fs.readFileSync(filePath);
    return `data:${mimeType};base64,${buffer.toString("base64")}`;
  } catch {
    return "";
  }
}

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const decoded = getPortalAuthFromRequest(req);
  if (!decoded) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;

  const offer = await prisma.offerLetter.findUnique({
    where: { id },
    include: {
      candidate: true,
      employee: true,
    },
  });

  if (!offer) return NextResponse.json({ error: "Not found" }, { status: 404 });

  // Fetch issuing HR staff name
  const hrStaff = await prisma.portalStaff.findFirst({ where: { email: offer.issuedBy } });
  const hrName = hrStaff?.name || offer.issuedBy;
  const hrDesignation = hrStaff?.role === "ADMIN" ? "HR Manager" : "HR Executive";

  // Fetch founder signature from MongoDB (sensitive asset - never on filesystem)
  const founderSigAsset = await prisma.portalSecureAsset.findUnique({ where: { key: "founder_signature" } });
  const founderSigBase64 = founderSigAsset
    ? `data:${founderSigAsset.mimeType};base64,${founderSigAsset.dataBase64}`
    : "";

  // Logo is non-sensitive, read from filesystem
  const logoBase64 = readImageAsBase64(
    path.join(process.cwd(), "public", "image", "final_logo-removebg-preview.png"),
    "image/png"
  );

  const candidateName = offer.candidate?.name || offer.employee?.name || "Candidate";
  const joiningDate = new Date(offer.joiningDate).toLocaleDateString("en-IN", {
    day: "numeric", month: "long", year: "numeric",
  });
  const issueDate = new Date(offer.createdAt).toLocaleDateString("en-IN", {
    day: "numeric", month: "long", year: "numeric",
  });
  // Acceptance deadline = 7 days before joining
  const acceptanceDeadline = new Date(
    new Date(offer.joiningDate).getTime() - 7 * 24 * 60 * 60 * 1000
  ).toLocaleDateString("en-IN", { day: "numeric", month: "long", year: "numeric" });

  const refNo = `FLZ/HR/${new Date().getFullYear()}/${id.slice(-6).toUpperCase()}`;

  const html = `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="utf-8"/>
<style>
  * { margin:0; padding:0; box-sizing:border-box; }
  body { font-family: 'Times New Roman', Times, serif; font-size:13px; color:#1a1a1a; background:#fff; }
  .page { width:210mm; min-height:297mm; padding:16mm 22mm 28mm 22mm; position:relative; }

  /* ── Header ── */
  .header { display:flex; align-items:center; justify-content:space-between; border-bottom:3px solid #4f46e5; padding-bottom:12px; margin-bottom:18px; }
  .header-left { display:flex; align-items:center; gap:14px; }
  .logo { width:52px; height:52px; object-fit:contain; }
  .company-name { font-size:24px; font-weight:800; color:#4f46e5; letter-spacing:0.5px; }
  .company-tagline { font-size:9.5px; color:#6b7280; margin-top:2px; }
  .header-right { text-align:right; font-size:10px; color:#6b7280; line-height:1.7; }

  /* ── Title band ── */
  .title-band { background:#4f46e5; color:#fff; text-align:center; padding:8px 0; border-radius:4px; margin-bottom:18px; }
  .title-band h1 { font-size:16px; letter-spacing:2.5px; font-weight:700; text-transform:uppercase; }

  /* ── Meta row ── */
  .meta-row { display:flex; justify-content:space-between; font-size:11.5px; color:#374151; margin-bottom:16px; }

  /* ── Salutation / body ── */
  .salutation { font-size:13px; margin-bottom:10px; }
  .body-text { font-size:13px; line-height:1.75; color:#374151; margin-bottom:12px; }

  /* ── Details box ── */
  .details-box { border:1.5px solid #4f46e5; border-radius:6px; padding:14px 18px; margin:16px 0; background:#f5f3ff; }
  .details-box table { width:100%; border-collapse:collapse; }
  .details-box td { padding:5px 2px; font-size:12.5px; vertical-align:top; }
  .details-box td:first-child { font-weight:700; color:#374151; width:45%; }
  .details-box td:last-child { color:#111827; }

  /* ── Closing ── */
  .closing { font-size:13px; line-height:1.75; color:#374151; margin-top:12px; }

  /* ── Signature section ── */
  .sig-section { display:flex; justify-content:space-between; margin-top:44px; }
  .sig-block { width:44%; text-align:center; }
  .sig-img { height:60px; object-fit:contain; display:block; margin:0 auto 4px; max-width:160px; }
  .sig-cursive { font-family: 'Brush Script MT', 'Segoe Script', cursive; font-size:30px; color:#1a1a1a; height:60px; display:flex; align-items:center; justify-content:center; }
  .sig-line { border-top:1.5px solid #4b5563; width:100%; margin-bottom:6px; }
  .sig-name { font-size:12.5px; font-weight:700; color:#111827; }
  .sig-designation { font-size:10.5px; color:#6b7280; margin-top:1px; }

  /* ── Watermark ── */
  .watermark { position:fixed; top:50%; left:50%; transform:translate(-50%,-50%) rotate(-35deg); font-size:72px; color:rgba(79,70,229,0.05); font-weight:900; letter-spacing:6px; white-space:nowrap; pointer-events:none; z-index:0; }

  /* ── Footer ── */
  .footer { position:fixed; bottom:8mm; left:22mm; right:22mm; text-align:center; font-size:8.5px; color:#9ca3af; border-top:1px solid #e5e7eb; padding-top:5px; }
  .confidential { text-align:center; margin-top:24px; font-size:10px; color:#9ca3af; font-style:italic; }

  /* Acceptance block */
  .accept-box { border:1px dashed #d1d5db; border-radius:6px; padding:12px 16px; margin-top:20px; font-size:12px; color:#374151; }
  .accept-box strong { display:block; margin-bottom:6px; font-size:12.5px; color:#111827; }
</style>
</head>
<body>

<div class="watermark">FLUENZY AI</div>

<div class="page">

  <!-- Header -->
  <div class="header">
    <div class="header-left">
      ${logoBase64 ? `<img src="${logoBase64}" class="logo" alt="Fluenzy AI Logo"/>` : ""}
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

  <!-- Title band -->
  <div class="title-band">
    <h1>Letter of Offer</h1>
  </div>

  <!-- Ref & Date -->
  <div class="meta-row">
    <span><strong>Ref:</strong> ${refNo}</span>
    <span><strong>Date of Issue:</strong> ${issueDate}</span>
  </div>

  <!-- Salutation -->
  <p class="salutation">Dear <strong>${candidateName}</strong>,</p>

  <!-- Opening paragraph -->
  <p class="body-text">
    We are delighted to extend this offer of employment to you at <strong>Fluenzy AI</strong>.
    After careful consideration of your profile, we are pleased to offer you the position of
    <strong>${offer.position}</strong> in the <strong>${offer.department}</strong> department.
    We believe your skills and experience will be a valuable addition to our growing team.
  </p>

  <!-- Details table -->
  <div class="details-box">
    <table>
      <tr><td>Position / Designation</td><td>${offer.position}</td></tr>
      <tr><td>Department</td><td>${offer.department}</td></tr>
      <tr><td>Annual CTC (Cost to Company)</td><td>₹${offer.salary.toLocaleString("en-IN")} per annum</td></tr>
      <tr><td>Date of Joining</td><td>${joiningDate}</td></tr>
      <tr><td>Employment Type</td><td>Full-Time, Permanent</td></tr>
      <tr><td>Work Location</td><td>India (Remote / Hybrid)</td></tr>
    </table>
  </div>

  <!-- Conditions paragraph -->
  <p class="body-text">
    This offer is subject to satisfactory completion of background verification and timely submission
    of all required documents prior to your joining date. Please sign and return a copy of this letter
    to confirm your acceptance on or before <strong>${acceptanceDeadline}</strong>.
  </p>

  <p class="body-text">
    We look forward to having you join our team and contribute to Fluenzy AI's mission of building
    world-class AI-powered learning and communication experiences. Should you have any questions
    regarding this offer, please feel free to contact our HR team.
  </p>

  <p class="closing">Congratulations and a warm welcome to the <strong>Fluenzy AI</strong> family!</p>

  <!-- Acceptance block -->
  <div class="accept-box">
    <strong>Candidate Acceptance</strong>
    I, <strong>${candidateName}</strong>, hereby accept the above offer of employment and confirm my
    joining date of <strong>${joiningDate}</strong>.
    <br/><br/>
    Signature: ________________________ &nbsp;&nbsp;&nbsp; Date: ________________________
  </div>

  <!-- Signature section -->
  <div class="sig-section">

    <!-- HR (left) -->
    <div class="sig-block">
      <div class="sig-cursive">${hrName.split(" ").slice(0, 2).join(" ")}</div>
      <div class="sig-line"></div>
      <div class="sig-name">${hrName}</div>
      <div class="sig-designation">${hrDesignation}, Fluenzy AI</div>
    </div>

    <!-- Founder (right) -->
    <div class="sig-block">
      ${founderSigBase64
        ? `<img src="${founderSigBase64}" class="sig-img" alt="Founder Signature"/>`
        : `<div style="height:60px;"></div>`}
      <div class="sig-line"></div>
      <div class="sig-name">ACHHUTA NAND JHA</div>
      <div class="sig-designation">Founder &amp; CEO, Fluenzy AI</div>
    </div>

  </div>

  <p class="confidential">
    This document is confidential and intended solely for ${candidateName}.
    Unauthorized use, reproduction or distribution is strictly prohibited.
  </p>

  <!-- Footer -->
  <div class="footer">
    Fluenzy AI &nbsp;·&nbsp; AI-Powered Communication Training &nbsp;·&nbsp; fluenzyai.com
    &nbsp;·&nbsp; This offer letter was generated electronically and is legally binding.
  </div>

</div>
</body>
</html>`;

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

    const fileName = `OfferLetter_${candidateName.replace(/\s+/g, "_")}_${id.slice(-6)}.pdf`;
    return new NextResponse(pdfBuffer as Buffer, {
      status: 200,
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `attachment; filename="${fileName}"`,
      },
    });
  } catch (err) {
    if (browser) await browser.close().catch(() => {});
    console.error("[PDF generation error]", err);
    return NextResponse.json({ error: "PDF generation failed" }, { status: 500 });
  }
}
