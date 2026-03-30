import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { htmlToPdf } from "@/lib/pdf-browser";
import { buildInvoiceHtml, buildInvoiceEmailBody } from "@/lib/invoice-html";
import { sendBillingEmail } from "@/lib/brevo-mail";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json().catch(() => ({}));
    const { paymentId } = body as { paymentId?: string };
    if (!paymentId || typeof paymentId !== "string") {
      return NextResponse.json({ error: "paymentId is required" }, { status: 400 });
    }

    const user = await prisma.users.findUnique({
      where: { email: session.user.email },
    });
    if (!user) return NextResponse.json({ error: "User not found" }, { status: 404 });

    const payment = await (prisma as any).paymentHistory.findFirst({
      where: { id: paymentId, userId: user.id },
      include: { receipt: true },
    });
    if (!payment) {
      return NextResponse.json({ error: "Transaction not found" }, { status: 404 });
    }

    // Build HTML (handles college vs regular purchase)
    const html = buildInvoiceHtml(payment, {
      name: user.name,
      email: user.email,
      renewalDate: (user as any).renewalDate ?? null,
    });

    // Generate PDF using shared helper (@sparticuz/chromium on prod)
    const pdfBuffer = await htmlToPdf(html);

    // Derive invoice number and filename
    const status        = (payment.status as string) || "paid";
    const receipt       = payment.receipt as { invoiceNumber?: string } | null;
    const invoiceNumber =
      receipt?.invoiceNumber ||
      payment.invoiceId ||
      `FLZ-${status.toUpperCase().slice(0, 3)}-${payment.id.slice(-6).toUpperCase()}`;
    const filename = `FluenzyAI_Invoice_${invoiceNumber}.pdf`;

    // Send email with PDF attachment via Brevo
    const emailResult = await sendBillingEmail({
      to: user.email,
      subject: `Your Fluenzy AI Invoice - ${invoiceNumber}`,
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

    if (!emailResult.success) {
      throw new Error(emailResult.error || "Failed to send email");
    }

    return NextResponse.json({
      success: true,
      message: `Invoice sent to ${user.email}`,
    });
  } catch (error) {
    console.error("[SEND_INVOICE_ERROR]", error);
    return NextResponse.json(
      { error: "Failed to send invoice. Please try again." },
      { status: 500 }
    );
  }
}
