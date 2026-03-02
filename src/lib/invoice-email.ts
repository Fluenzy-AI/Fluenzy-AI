/**
 * autoSendInvoiceEmail
 * ─────────────────────────────────────────────────────────────────────────────
 * Fire-and-forget helper called immediately after a payment is recorded.
 * Generates a PDF and emails it to the user at no extra cost (no Razorpay call).
 *
 * Usage (non-blocking):
 *   autoSendInvoiceEmail(paymentHistory.id, user.renewalDate ?? null)
 *     .catch((err) => console.error("[AUTO_INVOICE_EMAIL]", err));
 */

import nodemailer from "nodemailer";
import prisma from "@/lib/prisma";
import { htmlToPdf } from "@/lib/pdf-browser";
import { buildInvoiceHtml, buildInvoiceEmailBody, titleCase } from "@/lib/invoice-html";

export async function autoSendInvoiceEmail(
  paymentHistoryId: string,
  renewalDate: Date | null = null
): Promise<void> {
  // 1. Fetch the payment + receipt + user
  const payment = await (prisma as any).paymentHistory.findUnique({
    where: { id: paymentHistoryId },
    include: { receipt: true },
  });
  if (!payment) {
    console.warn("[AUTO_INVOICE_EMAIL] payment not found:", paymentHistoryId);
    return;
  }

  const user = await (prisma as any).users.findUnique({
    where: { id: payment.userId },
    select: { name: true, email: true, renewalDate: true },
  });
  if (!user?.email) {
    console.warn("[AUTO_INVOICE_EMAIL] user not found for payment:", paymentHistoryId);
    return;
  }

  const effectiveRenewalDate = renewalDate ?? user.renewalDate ?? null;

  // 2. Build HTML
  const html = buildInvoiceHtml(payment, {
    name: user.name,
    email: user.email,
    renewalDate: effectiveRenewalDate,
  });

  // 3. Generate PDF (uses @sparticuz/chromium on production)
  let pdfBuffer: Buffer;
  try {
    pdfBuffer = await htmlToPdf(html);
  } catch (err) {
    console.error("[AUTO_INVOICE_EMAIL] PDF generation failed:", err);
    return; // don't fail payment flow if PDF fails
  }

  // 4. Derive invoice number + filename
  const status = (payment.status as string) || "paid";
  const receipt = payment.receipt as { invoiceNumber?: string } | null;
  const invoiceNumber =
    receipt?.invoiceNumber ||
    payment.invoiceId ||
    `FLZ-${status.toUpperCase().slice(0, 3)}-${payment.id.slice(-6).toUpperCase()}`;
  const filename = `FluenzyAI_Invoice_${invoiceNumber}.pdf`;

  // 5. Send email
  const transporter = nodemailer.createTransport({
    host: "smtp.gmail.com",
    port: 587,
    secure: false,
    auth: {
      user: process.env.Payment_EMAIL_USER,
      pass: process.env.Payment_EMAIL_PASS,
    },
  });

  await transporter.sendMail({
    from: `"Fluenzy AI" <${process.env.Payment_EMAIL_USER}>`,
    to: user.email,
    subject: `Your Fluenzy AI Invoice – ${invoiceNumber}`,
    html: buildInvoiceEmailBody({
      userName: user.name,
      invoiceNumber,
      plan: payment.plan,
      status,
    }),
    attachments: [
      {
        filename,
        content: pdfBuffer,
        contentType: "application/pdf",
      },
    ],
  });

  console.log(`[AUTO_INVOICE_EMAIL] Sent invoice ${invoiceNumber} to ${user.email}`);
}
