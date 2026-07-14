/**
 * Receipt PDF Download
 * GET /api/receipt-pdf?orderId=X
 * 
 * OPTIMIZED: Uses document-service for generate-once-serve-from-CDN pattern.
 * Previously launched a FRESH Chromium process on every single request.
 * Now: first download → generates via shared pool + caches to R2.
 * All subsequent downloads → instant CDN redirect.
 */

import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { htmlToPdf } from "@/lib/pdf-browser";
import { getOrGenerateDocument } from "@/lib/document-service";
import { buildDocumentFileName } from "@/lib/document-types";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const formatIst = (date: Date) => {
  return new Intl.DateTimeFormat("en-IN", {
    timeZone: "Asia/Kolkata",
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    hour12: true,
  }).format(date);
};

const titleCase = (value?: string | null) => {
  if (!value) return "N/A";
  return value
    .replace(/_/g, " ")
    .toLowerCase()
    .replace(/\b\w/g, (m) => m.toUpperCase());
};

const getSessionLimit = (plan?: string | null) => {
  if (plan === "Standard") return "Unlimited";
  if (plan === "Pro") return "100";
  return "N/A";
};

const formatCurrency = (value?: number | null) =>
  `₹${(Number.isFinite(value) ? Number(value) : 0).toFixed(0)}`;

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const orderId = searchParams.get("orderId");
    if (!orderId) {
      return NextResponse.json({ error: "Order ID required" }, { status: 400 });
    }

    const user = await prisma.users.findUnique({
      where: { email: session.user.email },
    });

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    const receiptRecord = await (prisma as any).receipt.findFirst({
      where: { orderId, userId: user.id },
    });

    const payment = receiptRecord
      ? await (prisma as any).paymentHistory.findUnique({
          where: { id: receiptRecord.paymentHistoryId },
        })
      : await (prisma as any).paymentHistory.findFirst({
          where: { orderId, userId: user.id, status: "paid" },
        });

    if (!payment) {
      return NextResponse.json({ error: "Receipt not available" }, { status: 404 });
    }

    // Use document-service: check cache first, generate on miss
    const fileName = buildDocumentFileName("receipt", orderId);

    const result = await getOrGenerateDocument({
      documentType: "receipt",
      documentId: payment.id,
      ownerId: user.id,
      fileName,
      metadata: { orderId, invoiceNumber: receiptRecord?.invoiceNumber || payment.invoiceId },
      generatePdf: async () => {
        // Build HTML — only runs on cache miss
        const gstin = process.env.FLUENZY_GSTIN || "";
        const planName = receiptRecord?.plan || payment.plan || "Standard";
        const paymentMethod = receiptRecord?.snapshot?.paymentMethod || payment.paymentMethod;
        const paymentCurrency = receiptRecord?.currency || payment.paymentCurrency || "INR";
        const originalAmount = receiptRecord?.originalAmount ?? payment.originalAmount ?? 0;
        const discountAmount = receiptRecord?.discountAmount ?? payment.discountAmount ?? 0;
        const finalAmount = receiptRecord?.finalAmount ?? payment.finalAmount ?? 0;
        const invoiceNumber = receiptRecord?.invoiceNumber || payment.invoiceId || `FLZ-INV-${orderId.slice(-6).toUpperCase()}`;
        const invoiceDate = formatIst(new Date(receiptRecord?.issuedAt || payment.date));
        const validFrom = formatIst(new Date(receiptRecord?.validFrom || payment.date));
        const validTill = receiptRecord?.validTill
          ? formatIst(new Date(receiptRecord.validTill))
          : user.renewalDate
            ? formatIst(new Date(user.renewalDate))
            : "N/A";
        const billingCycle = receiptRecord?.billingCycle || payment.billingCycle || "monthly";

        let couponRecord: any = null;
        if (payment.couponUsed) {
          couponRecord = await (prisma as any).coupon.findFirst({
            where: { code: payment.couponUsed },
          });
        }

        const couponInfo = (receiptRecord?.couponCode || payment.couponUsed)
          ? {
              code: receiptRecord?.couponCode || payment.couponUsed,
              type: receiptRecord?.couponType || payment.couponType || couponRecord?.discountType || "PERCENTAGE",
              discountAmount: receiptRecord?.discountAmount ?? payment.discountAmount ?? 0,
              discountValue: receiptRecord?.discountValue ?? couponRecord?.discountValue,
            }
          : null;

        const discountValueLabel = couponInfo
          ? couponInfo.type?.toString().toUpperCase() === "PERCENTAGE"
            ? `${couponInfo.discountValue ?? 0}%`
            : formatCurrency(couponInfo.discountValue ?? 0)
          : "";

        const discountLabel = couponInfo
          ? `Discount (Coupon: ${couponInfo.code} – ${discountValueLabel})`
          : "Discount";

        const html = `
          <!DOCTYPE html>
          <html>
            <head>
              <meta charset="UTF-8" />
              <title>Fluenzy AI Receipt</title>
              <style>
                @page { size: A4; margin: 18mm; }
                body { font-family: 'Inter', 'Roboto', 'Helvetica', sans-serif; color: #0f172a; margin: 0; padding: 0; font-size: 11pt; }
                .container { padding: 20px 24px; }
                .header { display: flex; justify-content: space-between; align-items: center; padding-bottom: 12px; border-bottom: 2px solid #e2e8f0; }
                .logo { display: flex; align-items: center; gap: 12px; }
                .logo-badge { width: 44px; height: 44px; border-radius: 12px; background: linear-gradient(135deg, #4f46e5, #7c3aed); display: flex; align-items: center; justify-content: center; color: white; font-weight: 700; font-size: 18px; }
                .company h1 { font-size: 20pt; margin: 0; }
                .company p { margin: 2px 0; color: #475569; }
                .divider { margin: 18px 0; height: 1px; background: #e2e8f0; }
                .section-title { font-size: 12pt; font-weight: 700; margin-bottom: 10px; color: #1e293b; }
                .meta-grid { display: grid; grid-template-columns: repeat(2, 1fr); gap: 8px 24px; font-size: 10.5pt; }
                .meta-grid div { display: flex; justify-content: space-between; }
                .label { color: #64748b; font-weight: 600; }
                .value { color: #0f172a; font-weight: 600; }
                .table { width: 100%; border-collapse: collapse; margin-top: 8px; }
                .table th, .table td { border: 1px solid #e2e8f0; padding: 8px 10px; text-align: left; }
                .table th { background: #f8fafc; font-weight: 700; font-size: 10pt; }
                .price-table td:last-child, .price-table th:last-child { text-align: right; }
                .success-box { margin: 16px 0; padding: 12px 16px; background: #ecfdf5; border: 1px solid #34d399; border-radius: 10px; color: #065f46; font-weight: 600; }
                .footer { margin-top: 24px; padding-top: 12px; border-top: 1px solid #e2e8f0; font-size: 9.5pt; color: #64748b; text-align: center; }
                .muted { color: #94a3b8; }
              </style>
            </head>
            <body>
              <div class="container">
                <div class="header">
                  <div class="logo">
                    <div class="logo-badge">F</div>
                    <div class="company">
                      <h1>Fluenzy AI</h1>
                      <p>AI Interview Coach</p>
                      <p>https://www.fluenzyai.app</p>
                      <p>support@fluenzyai.app</p>
                      ${gstin ? `<p>GSTIN: ${gstin}</p>` : ""}
                    </div>
                  </div>
                  <div>
                    <p class="label">Receipt</p>
                    <p class="value">${invoiceNumber}</p>
                  </div>
                </div>

                <div class="divider"></div>

                <div class="section">
                  <div class="section-title">Receipt Metadata</div>
                  <div class="meta-grid">
                    <div><span class="label">Receipt Number</span><span class="value">${invoiceNumber}</span></div>
                    <div><span class="label">Payment ID</span><span class="value">${payment.paymentId || "N/A"}</span></div>
                    <div><span class="label">Order ID</span><span class="value">${payment.orderId || "N/A"}</span></div>
                    <div><span class="label">Invoice Date (IST)</span><span class="value">${invoiceDate}</span></div>
                    <div><span class="label">Payment Status</span><span class="value">✅ Paid</span></div>
                    <div><span class="label">Payment Method</span><span class="value">${titleCase(paymentMethod)}</span></div>
                    <div><span class="label">Transaction Currency</span><span class="value">${paymentCurrency} (₹)</span></div>
                  </div>
                </div>

                <div class="divider"></div>

                <div class="section">
                  <div class="section-title">Billed To</div>
                  <div class="meta-grid">
                    <div><span class="label">Full Name</span><span class="value">${user.name}</span></div>
                    <div><span class="label">Email Address</span><span class="value">${user.email}</span></div>
                    <div><span class="label">Phone Number</span><span class="value">N/A</span></div>
                    <div><span class="label">User ID</span><span class="value">${user.id}</span></div>
                  </div>
                </div>

                <div class="divider"></div>

                <div class="section">
                  <div class="section-title">Plan & Subscription Details</div>
                  <table class="table">
                    <thead>
                      <tr>
                        <th>Description</th>
                        <th>Details</th>
                      </tr>
                    </thead>
                    <tbody>
                      <tr><td>Plan Name</td><td>${planName}</td></tr>
                      <tr><td>Billing Cycle</td><td>${titleCase(billingCycle)}</td></tr>
                      <tr><td>Sessions Included</td><td>${getSessionLimit(planName)}</td></tr>
                      <tr><td>Valid From</td><td>${validFrom}</td></tr>
                      <tr><td>Valid Till</td><td>${validTill}</td></tr>
                    </tbody>
                  </table>
                </div>

                <div class="divider"></div>

                <div class="section">
                  <div class="section-title">Price Breakdown</div>
                  <table class="table price-table">
                    <thead>
                      <tr>
                        <th>Item</th>
                        <th>Amount (₹)</th>
                      </tr>
                    </thead>
                    <tbody>
                      <tr><td>Original Price</td><td>${formatCurrency(originalAmount)}</td></tr>
                      <tr><td>${discountLabel}</td><td>-${formatCurrency(discountAmount)}</td></tr>
                      <tr><td>Subtotal</td><td>${formatCurrency(finalAmount)}</td></tr>
                      <tr><td>Taxes (if any)</td><td>${formatCurrency(0)}</td></tr>
                      <tr><td><strong>Final Amount Paid</strong></td><td><strong>${formatCurrency(finalAmount)}</strong></td></tr>
                    </tbody>
                  </table>
                  ${finalAmount === 0 ? `<p class="muted">Payment Mode: Promotional Coupon</p>` : ""}
                </div>

                ${couponInfo ? `
                <div class="divider"></div>
                <div class="section">
                  <div class="section-title">Coupon Information</div>
                  <div class="meta-grid">
                    <div><span class="label">Coupon Code</span><span class="value">${couponInfo.code}</span></div>
                    <div><span class="label">Discount Type</span><span class="value">${titleCase(couponInfo.type)}</span></div>
                    <div><span class="label">Discount Value</span><span class="value">${formatCurrency(couponInfo.discountAmount)}</span></div>
                    <div><span class="label">Status</span><span class="value">Applied Successfully ✔</span></div>
                  </div>
                </div>
                ` : ""}

                <div class="success-box">
                  ✅ Payment Successful<br />
                  Thank you for upgrading your Fluenzy AI plan.<br />
                  Your subscription is now active.
                </div>

                <div class="footer">
                  This is a system-generated receipt. No signature required.<br />
                  Powered by Razorpay • Terms & Refund Policy: https://www.fluenzyai.app/return-and-refund-policy
                </div>
              </div>
            </body>
          </html>
        `;

        // Use shared Puppeteer pool instead of fresh launch
        return htmlToPdf(html);
      },
    });

    // Redirect to CDN if available
    if (result.cdnUrl) {
      return NextResponse.redirect(result.cdnUrl);
    }

    // Fallback: return buffer directly
    return new NextResponse(result.pdfBuffer as unknown as BodyInit, {
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `attachment; filename="${fileName}"`,
        "Cache-Control": "public, max-age=31536000, immutable",
      },
    });
  } catch (error) {
    console.error("Receipt PDF error:", error);
    return NextResponse.json({ error: "Failed to generate receipt" }, { status: 500 });
  }
}
