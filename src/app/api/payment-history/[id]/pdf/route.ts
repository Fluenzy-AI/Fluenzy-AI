import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { htmlToPdf } from "@/lib/pdf-browser";
import { buildInvoiceHtml, titleCase } from "@/lib/invoice-html";
import { uploadPdfToR2, getPublicUrl } from "@/lib/r2-service";
import { isR2Configured } from "@/lib/r2";

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

    // Build HTML & render PDF via shared helpers
    const html = buildInvoiceHtml(payment, {
      name: user.name,
      email: user.email,
      renewalDate: (user as any).renewalDate ?? null,
    });
    const pdfBuffer = await htmlToPdf(html);

    const status        = (payment.status as string) || "paid";
    const receipt       = payment.receipt as { invoiceNumber?: string } | null;
    const invoiceNumber =
      receipt?.invoiceNumber ||
      payment.invoiceId ||
      `FLZ-${status.toUpperCase().slice(0, 3)}-${payment.id.slice(-6).toUpperCase()}`;
    const filename = `FluenzyAI_${titleCase(status).replace(/ /g, "_")}_${invoiceNumber}.pdf`;

    // Check if redirect=true query param is set - return signed URL instead of PDF
    const url = new URL(request.url);
    const redirect = url.searchParams.get("redirect") === "true";
    
    if (redirect && isR2Configured()) {
      try {
        // Upload to R2 and return signed URL
        const fileKey = await uploadPdfToR2(
          "payment-receipt",
          `${user.id}_${payment.id}`,
          pdfBuffer,
          filename
        );
        
        // Create FileRecord
        await prisma.fileRecord.create({
          data: {
            userId: user.id,
            fileType: "payment-receipt",
            fileKey,
            originalFileName: filename,
            fileSize: pdfBuffer.byteLength,
            mimeType: "application/pdf",
            isPublic: true, // Receipts use CDN for lifetime access
            metadata: { paymentId: payment.id, invoiceNumber },
          },
        });

        // Use lifetime CDN URL instead of signed URL
        const cdnFileUrl = getPublicUrl(fileKey);
        console.info(`[PAYMENT_PDF] Uploaded to R2: ${fileKey}, CDN URL: ${cdnFileUrl}`);
        
        return NextResponse.json({ url: cdnFileUrl, expiresIn: null }); // null = never expires
      } catch (r2Error) {
        console.error("[PAYMENT_PDF] R2 upload failed:", r2Error);
        // Fall through to direct PDF response
      }
    }

    // Return PDF directly (default behavior)
    return new NextResponse(pdfBuffer as unknown as BodyInit, {
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `attachment; filename="${filename}"`,
      },
    });
  } catch (error) {
    console.error("[PAYMENT_PDF_ERROR]", error);
    return NextResponse.json({ error: "Failed to generate PDF" }, { status: 500 });
  }
}