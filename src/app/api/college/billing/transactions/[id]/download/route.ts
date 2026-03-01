import { NextRequest, NextResponse } from "next/server";
import { getCollegeAdminFromRequest } from "@/lib/collegeAuth";
import prisma from "@/lib/prisma";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const fmtDate = (d?: Date | string | null) => {
  if (!d) return "—";
  return new Date(d).toLocaleDateString("en-IN", {
    day: "2-digit", month: "short", year: "numeric", timeZone: "Asia/Kolkata",
  });
};

const PLAN_COLORS: Record<string, string> = {
  Free: "#94a3b8",
  Standard: "#6366f1",
  Pro: "#8b5cf6",
  Enterprise: "#f59e0b",
};

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const admin = await getCollegeAdminFromRequest(req);
    if (!admin) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { id } = await params;
    const format = req.nextUrl.searchParams.get("format") ?? "pdf"; // "pdf" | "csv"

    const tx = await prisma.collegeTransaction.findUnique({ where: { id } });
    if (!tx) return NextResponse.json({ error: "Transaction not found." }, { status: 404 });
    if (tx.collegeAdminId !== admin.id) return NextResponse.json({ error: "Forbidden." }, { status: 403 });

    const college = await prisma.collegeAdmin.findUnique({ where: { id: admin.id } });
    if (!college) return NextResponse.json({ error: "College not found." }, { status: 404 });

    // Fetch actual student records for the emails in this transaction
    const studentRecords = await prisma.collegeStudent.findMany({
      where: { email: { in: tx.studentEmails }, collegeAdminId: admin.id },
      select: { email: true, studentName: true, rollNumber: true, department: true, year: true, customPlan: true, customPlanExpiresAt: true, status: true },
    });

    // Build lookup by email for quicker access
    const studentMap = new Map(studentRecords.map((s) => [s.email, s]));

    const invoiceId = tx.invoiceId ?? tx.razorpayOrderId.slice(-14);
    const validFrom = tx.validFrom ?? tx.createdAt;
    const validTill = tx.validTill;
    const planColor = PLAN_COLORS[tx.plan] ?? "#6366f1";

    // ── CSV ──────────────────────────────────────────────────────────────────
    if (format === "csv") {
      const header = "Name,Email,Roll No.,Department,Year,Plan,Valid Till,Status";
      const rows = tx.studentEmails.map((email) => {
        const s = studentMap.get(email);
        const name = (s?.studentName ?? email.split("@")[0]).replace(/,/g, " ");
        const roll = s?.rollNumber ?? "";
        const dept = s?.department ?? "";
        const year = s?.year ?? "";
        const plan = s?.customPlan ?? String(tx.plan);
        const vt = fmtDate(s?.customPlanExpiresAt ?? validTill);
        const status = s?.status ?? "ACTIVE";
        return `"${name}","${email}","${roll}","${dept}","${year}","${plan}","${vt}","${status}"`;
      });
      const csv = [header, ...rows].join("\n");
      return new NextResponse(csv, {
        headers: {
          "Content-Type": "text/csv",
          "Content-Disposition": `attachment; filename="Students_${invoiceId}.csv"`,
        },
      });
    }

    // ── PDF ──────────────────────────────────────────────────────────────────
    const subtotal = tx.pricePerSeat * tx.seats;
    const studentRows = tx.studentEmails
      .map((email, i) => {
        const s = studentMap.get(email);
        const name = s?.studentName ?? email.split("@")[0];
        const plan = s?.customPlan ?? String(tx.plan);
        const vt = fmtDate(s?.customPlanExpiresAt ?? validTill);
        const status = s?.status ?? "ACTIVE";
        return `<tr>
          <td>${i + 1}</td>
          <td>${name}</td>
          <td>${email}</td>
          <td>${s?.rollNumber ?? "—"}</td>
          <td>${s?.department ?? "—"}${s?.year ? ` / Yr ${s.year}` : ""}</td>
          <td><span style="background:${planColor}22;color:${planColor};border:1px solid ${planColor}55;border-radius:12px;padding:1px 8px;font-size:9pt;font-weight:700;">${plan}</span></td>
          <td>${vt}</td>
          <td><span style="background:${status === "ACTIVE" ? "#dcfce7" : "#fef9c3"};color:${status === "ACTIVE" ? "#166534" : "#854d0e"};border-radius:10px;padding:1px 8px;font-size:9pt;">${status}</span></td>
        </tr>`;
      })
      .join("");

    const html = `<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8"/>
  <title>Fluenzy AI – Bulk Purchase Receipt</title>
  <style>
    @page { size: A4; margin: 16mm; }
    body { font-family: Helvetica, Arial, sans-serif; color: #0f172a; margin:0; padding:0; font-size:10.5pt; }
    .page { padding:18px 22px; }
    .header { display:flex; justify-content:space-between; align-items:flex-start; padding-bottom:12px; border-bottom:2px solid #e2e8f0; }
    .logo-wrap { display:flex; align-items:center; gap:12px; }
    .logo-badge { width:42px; height:42px; border-radius:10px; background:linear-gradient(135deg,#4f46e5,#7c3aed); color:white; font-weight:800; font-size:18px; display:flex; align-items:center; justify-content:center; }
    .company h1 { font-size:17pt; margin:0 0 2px; color:#0f172a; }
    .company p { margin:1px 0; color:#64748b; font-size:9pt; }
    .doc-meta { text-align:right; }
    .doc-meta .title { font-size:14pt; font-weight:800; color:#4f46e5; }
    .doc-meta .inv { font-size:9pt; color:#64748b; margin-top:4px; font-family:monospace; }
    .divider { margin:12px 0; height:1px; background:#e2e8f0; }
    .section-title { font-size:9pt; font-weight:700; color:#1e293b; text-transform:uppercase; letter-spacing:.5px; margin-bottom:8px; }
    .grid2 { display:grid; grid-template-columns:1fr 1fr; gap:6px 24px; font-size:10pt; }
    .grid2 div { display:flex; justify-content:space-between; border-bottom:1px dashed #f1f5f9; padding-bottom:3px; }
    .label { color:#64748b; }
    .val { color:#0f172a; font-weight:700; }
    table { width:100%; border-collapse:collapse; font-size:9.5pt; margin-top:6px; }
    th { background:#f8fafc; font-weight:700; color:#334155; border:1px solid #e2e8f0; padding:6px 9px; text-align:left; }
    td { border:1px solid #e2e8f0; padding:6px 9px; }
    .price-td { text-align:right; }
    .total td { font-weight:700; background:#f8fafc; }
    .status-ok { margin:12px 0; padding:10px 14px; border-radius:8px; background:#ecfdf5; border:1px solid #34d399; color:#065f46; font-weight:600; font-size:10pt; }
    .footer { margin-top:16px; padding-top:10px; border-top:1px solid #e2e8f0; font-size:9pt; color:#64748b; text-align:center; line-height:1.7; }
  </style>
</head>
<body>
<div class="page">

  <div class="header">
    <div class="logo-wrap">
      <div class="logo-badge">F</div>
      <div class="company">
        <h1>Fluenzy AI</h1>
        <p>College Partner Portal</p>
        <p>support@fluenzyai.app</p>
      </div>
    </div>
    <div class="doc-meta">
      <div class="title">BULK PURCHASE RECEIPT</div>
      <div class="inv">${invoiceId}</div>
      <div style="margin-top:4px;font-size:9pt;color:#64748b;">${fmtDate(validFrom)}</div>
    </div>
  </div>

  <div class="divider"></div>

  <div class="section-title">Institution Details</div>
  <div class="grid2">
    <div><span class="label">Institution</span><span class="val">${college.collegeName}</span></div>
    <div><span class="label">Admin Email</span><span class="val">${college.email}</span></div>
    <div><span class="label">Invoice #</span><span class="val" style="font-family:monospace;font-size:9pt;">${invoiceId}</span></div>
    <div><span class="label">Date</span><span class="val">${fmtDate(validFrom)}</span></div>
  </div>

  <div class="divider"></div>

  <div class="section-title">Purchase Summary</div>
  <table>
    <thead><tr><th>Description</th><th class="price-td">Amount</th></tr></thead>
    <tbody>
      <tr>
        <td><strong>${tx.plan}</strong> Plan × ${tx.seats} seat${tx.seats !== 1 ? "s" : ""} (₹${tx.pricePerSeat}/seat)</td>
        <td class="price-td">₹${subtotal.toFixed(0)}</td>
      </tr>
      ${tx.couponDiscount > 0 ? `<tr><td>Coupon Discount${tx.couponCode ? ` (${tx.couponCode})` : ""}</td><td class="price-td" style="color:#16a34a;">-₹${tx.couponDiscount.toFixed(0)}</td></tr>` : ""}
      ${tx.gstAmount > 0 ? `<tr><td>GST (18%)</td><td class="price-td">₹${tx.gstAmount.toFixed(0)}</td></tr>` : ""}
      <tr class="total">
        <td><strong>Total Paid</strong></td>
        <td class="price-td"><strong>${tx.finalAmount === 0 ? "FREE" : `₹${tx.finalAmount.toFixed(0)}`}</strong></td>
      </tr>
      <tr><td>Valid From</td><td class="price-td">${fmtDate(validFrom)}</td></tr>
      <tr><td>Valid Till</td><td class="price-td" style="color:#16a34a;font-weight:700;">${fmtDate(validTill)}</td></tr>
      <tr><td>Total Students Activated</td><td class="price-td"><strong>${tx.studentEmails.length}</strong></td></tr>
    </tbody>
  </table>

  <div class="divider"></div>

  <div class="section-title">Activated Students (${tx.studentEmails.length})</div>
  <table>
    <thead>
      <tr>
        <th>#</th><th>Name</th><th>Email</th><th>Roll No.</th>
        <th>Dept / Year</th><th>Plan</th><th>Valid Till</th><th>Status</th>
      </tr>
    </thead>
    <tbody>${studentRows}</tbody>
  </table>

  <div class="status-ok">
    ✅ &nbsp; Payment confirmed. <strong>${tx.studentEmails.length} student${tx.studentEmails.length !== 1 ? "s" : ""}</strong> activated under the <strong>${tx.plan}</strong> plan, valid till <strong>${fmtDate(validTill)}</strong>.
  </div>

  <div class="footer">
    System-generated receipt. No signature required.<br/>
    For support: support@fluenzyai.app &bull; ${college.collegeName}
  </div>

</div>
</body>
</html>`;

    const puppeteer = (await import("puppeteer")).default;
    const browser = await puppeteer.launch({ args: ["--no-sandbox", "--disable-setuid-sandbox"] });
    const page = await browser.newPage();
    await page.setContent(html, { waitUntil: "networkidle0" });
    try {
      const pdfBuffer = Buffer.from(
        await page.pdf({ format: "A4", printBackground: true, margin: { top: "16mm", right: "16mm", bottom: "16mm", left: "16mm" } })
      );
      return new NextResponse(pdfBuffer, {
        headers: {
          "Content-Type": "application/pdf",
          "Content-Disposition": `attachment; filename="BulkReceipt_${invoiceId}.pdf"`,
        },
      });
    } finally {
      await browser.close();
    }
  } catch (err) {
    console.error("[college-tx-download]", err);
    return NextResponse.json({ error: "Failed to generate file." }, { status: 500 });
  }
}
