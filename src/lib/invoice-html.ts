/**
 * Shared invoice / payment-statement HTML builder.
 * Used by:
 *  • /api/payment-history/[id]/pdf  (PDF download)
 *  • /api/send-invoice               (email attachment)
 *  • auto-send after payment
 */

import fs from "fs";
import path from "path";

// ─── Logo Base64 (embedded for PDF compatibility) ────────────────────────────
function getLogoBase64(): string {
  try {
    const logoPath = path.join(process.cwd(), "public", "favicon", "white-removebg-preview1.png");
    const buf = fs.readFileSync(logoPath);
    return `data:image/png;base64,${buf.toString("base64")}`;
  } catch {
    return "";
  }
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

export const formatIst = (date: Date) =>
  new Intl.DateTimeFormat("en-IN", {
    timeZone: "Asia/Kolkata",
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    hour12: true,
  }).format(date);

export const titleCase = (value?: string | null) => {
  if (!value) return "N/A";
  return value.replace(/_/g, " ").toLowerCase().replace(/\b\w/g, (m) => m.toUpperCase());
};

export const fmt = (v?: number | null) =>
  `₹${(Number.isFinite(v) ? Number(v) : 0).toFixed(0)}`;

export const getSessionLimit = (plan?: string | null) => {
  if (plan === "Standard") return "Unlimited";
  if (plan === "Pro") return "100";
  return "N/A";
};

export const STATUS_STYLES: Record<string, { box: string; label: string; icon: string }> = {
  paid:            { box: "background:#ecfdf5;border:1px solid #34d399;color:#065f46",   label: "Paid",             icon: "✅" },
  free_via_coupon: { box: "background:#eff6ff;border:1px solid #60a5fa;color:#1e40af",   label: "Free via Coupon",  icon: "🎁" },
  failed:          { box: "background:#fef2f2;border:1px solid #f87171;color:#991b1b",   label: "Payment Failed",   icon: "❌" },
  refunded:        { box: "background:#fffbeb;border:1px solid #fbbf24;color:#92400e",   label: "Refunded",         icon: "↩️" },
};

// ─── Main builder ─────────────────────────────────────────────────────────────

export function buildInvoiceHtml(
  payment: Record<string, unknown>,
  user: { name?: string | null; email: string; renewalDate?: Date | null }
): string {
  const logoBase64 = getLogoBase64();
  const status      = (payment.status as string) || "paid";
  const statusStyle = STATUS_STYLES[status] || STATUS_STYLES.paid;

  const planName        = (payment.plan as string)          || "Standard";
  const billingCycle    = (payment.billingCycle as string)  || "monthly";
  const originalAmount  = (payment.originalAmount as number) ?? 0;
  const discountAmount  = (payment.discountAmount as number) ?? 0;
  const finalAmount     = (payment.finalAmount as number)   ?? 0;
  const currency        = (payment.paymentCurrency as string) || "INR";
  const invoiceDate     = formatIst(new Date(payment.date as string));
  const receipt         = payment.receipt as { invoiceNumber?: string } | null;
  const invoiceNumber   =
    receipt?.invoiceNumber ||
    (payment.invoiceId as string) ||
    `FLZ-${status.toUpperCase().slice(0, 3)}-${(payment.id as string).slice(-6).toUpperCase()}`;

  const gstin = process.env.FLUENZY_GSTIN || "";

  // ── College-purchase detection ──────────────────────────────────────────────
  const isCollegePurchase = payment.paymentMethod === "College Purchase";
  const collegeSponsor    = isCollegePurchase
    ? ((payment.couponUsed as string) ?? "Your Institution")
    : null;

  // ── Coupon section (only for non-college, direct payments) ──────────────────
  let couponSection = "";
  if (!isCollegePurchase && payment.couponUsed) {
    couponSection = `
      <div class="divider"></div>
      <div class="section">
        <div class="section-title">Coupon Applied</div>
        <div class="meta-grid">
          <div><span class="label">Code</span><span class="value">${payment.couponUsed as string}</span></div>
          <div><span class="label">Discount</span><span class="value">${fmt(discountAmount)} off</span></div>
        </div>
      </div>`;
  }

  // ── Validity section ─────────────────────────────────────────────────────────
  let validitySection = "";
  if (status === "paid" || status === "free_via_coupon") {
    const validFrom = formatIst(new Date(payment.date as string));
    const validTill = user.renewalDate ? formatIst(new Date(user.renewalDate)) : "N/A";
    validitySection = `
      <div class="divider"></div>
      <div class="section">
        <div class="section-title">Plan &amp; Subscription Details</div>
        <table class="table">
          <thead><tr><th>Item</th><th>Detail</th></tr></thead>
          <tbody>
            <tr><td>Plan Name</td><td>${planName}</td></tr>
            <tr><td>Billing Cycle</td><td>${titleCase(billingCycle)}</td></tr>
            <tr><td>Sessions Included</td><td>${getSessionLimit(planName)}</td></tr>
            <tr><td>Valid From</td><td>${validFrom}</td></tr>
            <tr><td>Valid Till</td><td>${validTill}</td></tr>
          </tbody>
        </table>
      </div>`;
  }

  const statusMessage: Record<string, string> = {
    paid:            "Payment successful. Your subscription is now active.",
    free_via_coupon: "Plan activated via coupon. Your subscription is now active.",
    failed:          "This payment attempt was unsuccessful. You have not been charged.",
    refunded:        "This payment has been refunded. Please allow 5-7 business days.",
  };

  // ── Price breakdown section (college: "Sponsored", others: full table) ───────
  const priceBreakdownSection = isCollegePurchase
    ? `<table class="table price-table">
        <thead><tr><th>Description</th><th>Amount</th></tr></thead>
        <tbody>
          <tr><td>${planName} Plan (${titleCase(billingCycle)})</td><td>Sponsored</td></tr>
          <tr class="total-row">
            <td><strong>Your Cost</strong></td>
            <td><strong><span class="free-badge">FREE</span></strong></td>
          </tr>
        </tbody>
      </table>
      <p style="margin:8px 0 0;font-size:9.5pt;color:#4f46e5;">
        This plan was sponsored by <strong>${collegeSponsor}</strong>. No payment was required from you.
      </p>`
    : `<table class="table price-table">
        <thead><tr><th>Description</th><th>Amount</th></tr></thead>
        <tbody>
          <tr><td>${planName} Plan (${titleCase(billingCycle)})</td><td>${fmt(originalAmount)}</td></tr>
          <tr><td>Discount / Coupon${payment.couponUsed ? ` (${payment.couponUsed as string})` : ""}</td><td>− ${fmt(discountAmount)}</td></tr>
          <tr class="total-row">
            <td><strong>${status === "failed" ? "Attempted Amount" : "Amount Paid"}</strong></td>
            <td><strong>${finalAmount === 0 ? `<span class="free-badge">FREE</span>` : fmt(finalAmount)}</strong></td>
          </tr>
        </tbody>
      </table>`;

  return `<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8"/>
  <title>Fluenzy AI – ${titleCase(status)} Statement</title>
  <style>
    @page { size: A4; margin: 18mm; }
    body { font-family: 'Helvetica', 'Arial', sans-serif; color: #0f172a; margin:0; padding:0; font-size:11pt; }
    .container { padding: 20px 24px; }
    .header { display:flex; justify-content:space-between; align-items:flex-start; padding-bottom:12px; border-bottom:2px solid #e2e8f0; }
    .logo { display:flex; align-items:center; gap:12px; }
    .logo-badge { width:44px; height:44px; border-radius:12px; background:linear-gradient(135deg,#4f46e5,#7c3aed); display:flex; align-items:center; justify-content:center; color:white; font-weight:700; font-size:20px; line-height:44px; text-align:center; object-fit:contain; }
    .company h1 { font-size:18pt; margin:0 0 2px; }
    .company p { margin:2px 0; color:#475569; font-size:9.5pt; }
    .doc-type { text-align:right; }
    .doc-type .type-label { font-size:16pt; font-weight:700; color:#4f46e5; }
    .doc-type .inv-no { font-size:9pt; color:#64748b; margin-top:4px; }
    .divider { margin:16px 0; height:1px; background:#e2e8f0; }
    .section-title { font-size:9.5pt; font-weight:700; margin-bottom:10px; color:#1e293b; text-transform:uppercase; letter-spacing:.5px; }
    .meta-grid { display:grid; grid-template-columns:repeat(2,1fr); gap:7px 28px; font-size:10pt; }
    .meta-grid div { display:flex; justify-content:space-between; border-bottom:1px dashed #f1f5f9; padding-bottom:4px; }
    .label { color:#64748b; font-weight:600; }
    .value { color:#0f172a; font-weight:700; }
    .table { width:100%; border-collapse:collapse; margin-top:6px; font-size:10pt; }
    .table th, .table td { border:1px solid #e2e8f0; padding:7px 10px; text-align:left; }
    .table th { background:#f8fafc; font-weight:700; color:#334155; }
    .price-table td:last-child, .price-table th:last-child { text-align:right; }
    .total-row td { font-weight:700; background:#f8fafc; }
    .status-box { margin:16px 0; padding:12px 16px; border-radius:10px; font-weight:600; font-size:10.5pt; }
    .footer { margin-top:24px; padding-top:12px; border-top:1px solid #e2e8f0; font-size:9pt; color:#64748b; text-align:center; line-height:1.7; }
    .free-badge { display:inline-block; background:#dcfce7; color:#166534; padding:2px 10px; border-radius:20px; font-size:9pt; font-weight:700; }
  </style>
</head>
<body>
<div class="container">
  <div class="header">
    <div class="logo">
      ${logoBase64 ? `<img src="${logoBase64}" alt="Fluenzy AI" class="logo-badge"/>` : `<div class="logo-badge">F</div>`}
      <div class="company">
        <h1>Fluenzy AI</h1>
        <p>AI Interview &amp; Communication Coach</p>
        <p>https://www.fluenzyai.app</p>
        <p>support@fluenzyai.app</p>
        ${gstin ? `<p>GSTIN: ${gstin}</p>` : ""}
      </div>
    </div>
    <div class="doc-type">
      <div class="type-label">PAYMENT STATEMENT</div>
      <div class="inv-no">${invoiceNumber}</div>
      <div style="margin-top:6px;font-size:9.5pt;color:#64748b;">${invoiceDate}</div>
    </div>
  </div>

  <div class="divider"></div>

  <div class="section">
    <div class="section-title">Transaction Details</div>
    <div class="meta-grid">
      <div><span class="label">Document #</span><span class="value">${invoiceNumber}</span></div>
      <div><span class="label">Date &amp; Time (IST)</span><span class="value">${invoiceDate}</span></div>
      <div><span class="label">Payment ID</span><span class="value">${(payment.paymentId as string) || "N/A"}</span></div>
      <div><span class="label">Order ID</span><span class="value">${(payment.orderId as string) || "N/A"}</span></div>
      <div><span class="label">Status</span><span class="value">${statusStyle.icon} ${statusStyle.label}</span></div>
      <div><span class="label">Method</span><span class="value">${titleCase(payment.paymentMethod as string)}</span></div>
      <div><span class="label">Currency</span><span class="value">${currency}</span></div>
      <div><span class="label">Plan</span><span class="value">${planName}</span></div>
    </div>
  </div>

  <div class="divider"></div>

  <div class="section">
    <div class="section-title">Customer Details</div>
    <div class="meta-grid">
      <div><span class="label">Name</span><span class="value">${user.name || "N/A"}</span></div>
      <div><span class="label">Email</span><span class="value">${user.email}</span></div>
    </div>
  </div>

  <div class="divider"></div>

  <div class="section">
    <div class="section-title">Price Breakdown</div>
    ${priceBreakdownSection}
  </div>

  ${couponSection}
  ${validitySection}

  <div class="divider"></div>

  <div class="status-box" style="${statusStyle.box};border-radius:10px;">
    ${statusStyle.icon}&nbsp;&nbsp;${statusMessage[status] || "Transaction processed."}
  </div>

  <div class="footer">
    This is a system-generated document. No signature required.<br/>
    For payment support: <strong>support@fluenzyai.app</strong><br/>
    Refund Policy: https://www.fluenzyai.app/return-and-refund-policy • Powered by Razorpay
  </div>
</div>
</body>
</html>`;
}
