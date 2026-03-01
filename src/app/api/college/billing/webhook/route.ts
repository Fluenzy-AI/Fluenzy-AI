import { NextRequest, NextResponse } from "next/server";
import crypto from "crypto";
import prisma from "@/lib/prisma";

// Disable body parsing — Razorpay needs raw body for signature
export const runtime = "nodejs";

export async function POST(req: NextRequest) {
  try {
    const rawBody = await req.text();
    const signature = req.headers.get("x-razorpay-signature") ?? "";
    const webhookSecret = process.env.RAZORPAY_WEBHOOK_SECRET ?? "";

    if (webhookSecret) {
      const expectedSign = crypto
        .createHmac("sha256", webhookSecret)
        .update(rawBody)
        .digest("hex");

      if (signature !== expectedSign) {
        console.warn("Razorpay webhook: invalid signature");
        return NextResponse.json({ error: "Invalid signature" }, { status: 400 });
      }
    }

    const event = JSON.parse(rawBody);
    const eventType: string = event.event ?? "";

    if (eventType === "payment.captured") {
      const paymentEntity = event.payload?.payment?.entity;
      const orderId: string = paymentEntity?.order_id ?? "";
      const paymentId: string = paymentEntity?.id ?? "";

      if (orderId) {
        const transaction = await prisma.collegeTransaction.findUnique({
          where: { razorpayOrderId: orderId },
        });

        if (transaction && transaction.status === "pending") {
          const validFrom = new Date();
          const validTill = new Date(validFrom);
          validTill.setMonth(validTill.getMonth() + 1);

          await prisma.collegeTransaction.update({
            where: { id: transaction.id },
            data: {
              razorpayPaymentId: paymentId,
              status: "paid",
              validFrom,
              validTill,
            },
          });

          // Update college plan
          await prisma.collegeAdmin.update({
            where: { id: transaction.collegeAdminId },
            data: {
              allocatedPlan: transaction.plan,
              totalSeats: transaction.seats,
              planExpiresAt: validTill,
            },
          });

          console.log(`Webhook: Activated plan ${transaction.plan} for college ${transaction.collegeAdminId}`);
        }
      }
    }

    if (eventType === "payment.failed") {
      const paymentEntity = event.payload?.payment?.entity;
      const orderId: string = paymentEntity?.order_id ?? "";

      if (orderId) {
        await prisma.collegeTransaction.updateMany({
          where: { razorpayOrderId: orderId, status: "pending" },
          data: { status: "failed" },
        });
      }
    }

    return NextResponse.json({ received: true });
  } catch (err) {
    console.error("Webhook error:", err);
    return NextResponse.json({ error: "Webhook processing failed" }, { status: 500 });
  }
}
