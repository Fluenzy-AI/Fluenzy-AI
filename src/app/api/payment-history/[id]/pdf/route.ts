/**
 * Payment History PDF Download
 * GET /api/payment-history/[id]/pdf
 * 
 * REFACTORED: Standardized to use document-service (was partially cached before).
 * Now uses the same getOrGenerateDocument() pattern as all other PDF endpoints.
 */

import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { htmlToPdf } from "@/lib/pdf-browser";
import { buildInvoiceHtml, titleCase } from "@/lib/invoice-html";
import { getOrGenerateDocument } from "@/lib/document-service";
import { buildDocumentFileName } from "@/lib/document-types";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const authSession = await getServerSession(authOptions);
    if (!authSession?.user?.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const user = await prisma.users.findUnique({
      where: { email: authSession.user.email },
    });
    if (!user) return NextResponse.json({ error: "User not found" }, { status: 404 });

    const payment = await (prisma as any).paymentHistory.findFirst({
      where: { id, userId: user.id },
      include: { receipt: true },
    });
    if (!payment) return NextResponse.json({ error: "Transaction not found" }, { status: 404 });

    const status = (payment.status as string) || "paid";
    const receipt = payment.receipt as { invoiceNumber?: string } | null;
    const invoiceNumber =
      receipt?.invoiceNumber ||
      payment.invoiceId ||
      `FLZ-${status.toUpperCase().slice(0, 3)}-${payment.id.slice(-6).toUpperCase()}`;

    const fileName = buildDocumentFileName("invoice", invoiceNumber);

    // Use standardized document service
    const result = await getOrGenerateDocument({
      documentType: "invoice",
      documentId: payment.id,
      ownerId: user.id,
      fileName,
      metadata: { invoiceNumber, paymentId: payment.id, status },
      generatePdf: async () => {
        const html = buildInvoiceHtml(payment, {
          name: user.name,
          email: user.email,
          renewalDate: (user as any).renewalDate ?? null,
        });
        return htmlToPdf(html);
      },
    });

    // Redirect to CDN if available
    if (result.cdnUrl) {
      return NextResponse.redirect(result.cdnUrl);
    }

    // Fallback: return PDF directly
    return new NextResponse(result.pdfBuffer as unknown as BodyInit, {
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `attachment; filename="${fileName}"`,
        "Cache-Control": "public, max-age=31536000, immutable",
      },
    });
  } catch (error) {
    console.error("[PAYMENT_PDF_ERROR]", error);
    return NextResponse.json({ error: "Failed to generate PDF" }, { status: 500 });
  }
}