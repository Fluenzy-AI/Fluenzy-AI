import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import crypto from "crypto";
import { handleSubscriptionRenewal, getPlanConfig } from "@/lib/billing";
import Razorpay from "razorpay";

const razorpay = new Razorpay({
  key_id: process.env.RAZORPAY_API_KEY!,
  key_secret: process.env.RAZORPAY_API_SECRET!,
});

/**
 * Razorpay Webhook Handler
 * 
 * Events handled:
 * - subscription.activated
 * - subscription.renewed
 * - subscription.cancelled
 * - subscription.paused
 * - subscription.resumed
 * - subscription.charged
 * - payment.authorized
 * - payment.failed
 */
export async function POST(request: NextRequest) {
  try {
    // Verify webhook signature
    const signature = request.headers.get("x-razorpay-signature");
    if (!signature) {
      console.error("[RAZORPAY-WEBHOOK] Missing signature header");
      return NextResponse.json({ error: "Missing signature" }, { status: 400 });
    }

    const body = await request.text();
    const webhookSecret = process.env.RAZORPAY_WEBHOOK_SECRET;
    
    if (!webhookSecret) {
      console.error("[RAZORPAY-WEBHOOK] Webhook secret not configured");
      return NextResponse.json({ error: "Webhook not configured" }, { status: 500 });
    }

    // Verify webhook signature
    const expectedSignature = crypto
      .createHmac("sha256", webhookSecret)
      .update(body)
      .digest("hex");

    if (signature !== expectedSignature) {
      console.error("[RAZORPAY-WEBHOOK] Invalid signature");
      return NextResponse.json({ error: "Invalid signature" }, { status: 401 });
    }

    const payload = JSON.parse(body);
    const eventType = payload.event;
    
    console.log(`[RAZORPAY-WEBHOOK] Received event: ${eventType}`);

    // Store webhook event for audit trail
    const webhookEvent = await (prisma as any).razorpayWebhookEvent.create({
      data: {
        eventType,
        webhookId: payload.webhook_id || `wh_${Date.now()}`,
        payload: payload,
        processed: false,
      },
    });

    // Extract relevant data from payload
    const subscription = payload.payload?.subscription || payload.payload?.payment?.subscription;
    const payment = payload.payload?.payment;
    const customer = payload.payload?.customer;

    let userId: string | null = null;
    let plan: string | null = null;
    let status: string | null = null;
    let subscriptionId: string | null = null;

    // Extract user and plan from subscription
    if (subscription?.notes?.userId) {
      userId = subscription.notes.userId;
    } else if (customer?.notes?.userId) {
      userId = customer.notes.userId;
    }

    if (subscription?.plan_id) {
      // Map Razorpay plan to internal plan
      const allPlans = await getAllRazorpayPlanMappings();
      plan = allPlans[subscription.plan_id] || null;
    }

    subscriptionId = subscription?.id || null;
    status = subscription?.status || payment?.status || null;

    // Process the event
    let result = { success: false, message: "Event not handled" };

    switch (eventType) {
      case "subscription.activated":
      case "subscription.renewed":
        if (userId && plan) {
          result = await processSubscriptionActivation(userId, plan, subscriptionId);
        }
        break;

      case "subscription.cancelled":
        if (userId) {
          result = await processSubscriptionCancellation(userId);
        }
        break;

      case "subscription.paused":
        if (userId) {
          result = await processSubscriptionPause(userId);
        }
        break;

      case "subscription.resumed":
        if (userId && plan) {
          result = await processSubscriptionResume(userId, plan);
        }
        break;

      case "subscription.charged":
        if (userId && plan) {
          result = await processSubscriptionCharge(userId, plan, subscriptionId);
        }
        break;

      case "payment.authorized":
        if (userId && plan && payment?.id) {
          result = await processPaymentAuthorized(userId, plan, payment.id);
        }
        break;

      case "payment.failed":
        if (userId) {
          result = await processPaymentFailed(userId);
        }
        break;

      default:
        console.log(`[RAZORPAY-WEBHOOK] Unhandled event: ${eventType}`);
    }

    // Mark webhook event as processed
    await (prisma as any).razorpayWebhookEvent.update({
      where: { id: webhookEvent.id },
      data: {
        processed: true,
        processedAt: new Date(),
        subscriptionId,
        plan,
        status,
        errorMessage: result.success ? null : result.message,
      },
    });

    console.log(`[RAZORPAY-WEBHOOK] Processed ${eventType}:`, result);

    return NextResponse.json({ success: true, message: result.message });
  } catch (error: any) {
    console.error("[RAZORPAY-WEBHOOK] Error processing webhook:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

/**
 * Get all Razorpay plan ID to internal plan mappings
 */
async function getAllRazorpayPlanMappings(): Promise<Record<string, string>> {
  const pricings = await (prisma as any).planPricing.findMany({
    where: {
      razorpayPlanId: { not: null },
    },
    select: {
      plan: true,
      razorpayPlanId: true,
    },
  });

  const mappings: Record<string, string> = {};
  pricings.forEach((p: any) => {
    if (p.razorpayPlanId) {
      mappings[p.razorpayPlanId] = p.plan;
    }
  });

  return mappings;
}

/**
 * Process subscription activation/renewal
 */
async function processSubscriptionActivation(
  userId: string, 
  plan: string, 
  subscriptionId?: string | null
): Promise<{ success: boolean; message: string }> {
  try {
    // Fetch subscription details from Razorpay for authoritative data
    let razorpaySubscription: any = null;
    if (subscriptionId) {
      try {
        razorpaySubscription = await razorpay.subscriptions.fetch(subscriptionId);
      } catch (e) {
        console.warn("[RAZORPAY-WEBHOOK] Could not fetch subscription from Razorpay");
      }
    }

    // Determine billing cycle
    const billingCycle = razorpaySubscription?.interval === "year" ? "annual" : "monthly";
    
    // Get period end from Razorpay (authoritative source)
    const currentPeriodEnd = razorpaySubscription?.current_period_end 
      ? new Date(razorpaySubscription.current_period_end * 1000)
      : new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);

    // Update user plan
    await prisma.users.update({
      where: { id: userId },
      data: {
        plan: plan as any,
        renewalDate: currentPeriodEnd,
        billingCycle,
      },
    });

    // Create new monthly usage record for current billing cycle
    const now = new Date();
    await (prisma as any).monthlyUsage.upsert({
      where: {
        userId_billingMonth_billingYear: {
          userId,
          billingMonth: now.getMonth() + 1,
          billingYear: now.getFullYear(),
        },
      },
      update: {},
      create: {
        userId,
        billingMonth: now.getMonth() + 1,
        billingYear: now.getFullYear(),
        billingCycleStart: now,
        billingCycleEnd: currentPeriodEnd,
        englishUsage: 0,
        dailyUsage: 0,
        hrUsage: 0,
        technicalUsage: 0,
        companyUsage: 0,
        mockUsage: 0,
        gdUsage: 0,
        interviewGuideUsage: 0,
        totalUsage: 0,
      },
    });

    // Update subscription record
    if (subscriptionId) {
      await (prisma as any).subscriptions.upsert({
        where: { id: subscriptionId },
        update: {
          status: "active",
          currentPeriodEnd,
          plan: plan as any,
        },
        create: {
          id: subscriptionId,
          userId,
          stripeSubscriptionId: subscriptionId,
          stripeCustomerId: "",
          plan: plan as any,
          status: "active",
          currentPeriodEnd,
          billingCycle,
          autoRenew: true,
        },
      });
    }

    console.log(`[RAZORPAY-WEBHOOK] Subscription activated/renewed for user ${userId}: ${plan}`);

    return {
      success: true,
      message: `Subscription ${plan} activated`,
    };
  } catch (error: any) {
    console.error("[RAZORPAY-WEBHOOK] Error activating subscription:", error);
    return {
      success: false,
      message: error.message,
    };
  }
}

/**
 * Process subscription cancellation
 */
async function processSubscriptionCancellation(
  userId: string
): Promise<{ success: boolean; message: string }> {
  try {
    // Downgrade to Free plan
    await prisma.users.update({
      where: { id: userId },
      data: {
        plan: "Free",
        renewalDate: null,
        billingCycle: null,
      },
    });

    // Update subscription status
    await (prisma as any).subscriptions.updateMany({
      where: { userId, status: "active" },
      data: { status: "cancelled" },
    });

    console.log(`[RAZORPAY-WEBHOOK] Subscription cancelled for user ${userId}`);

    return {
      success: true,
      message: "Subscription cancelled",
    };
  } catch (error: any) {
    return {
      success: false,
      message: error.message,
    };
  }
}

/**
 * Process subscription pause
 */
async function processSubscriptionPause(
  userId: string
): Promise<{ success: boolean; message: string }> {
  try {
    // Update subscription status
    await (prisma as any).subscriptions.updateMany({
      where: { userId, status: "active" },
      data: { status: "paused" },
    });

    console.log(`[RAZORPAY-WEBHOOK] Subscription paused for user ${userId}`);

    return {
      success: true,
      message: "Subscription paused",
    };
  } catch (error: any) {
    return {
      success: false,
      message: error.message,
    };
  }
}

/**
 * Process subscription resume
 */
async function processSubscriptionResume(
  userId: string,
  plan: string
): Promise<{ success: boolean; message: string }> {
  try {
    // Reactivate subscription
    await (prisma as any).subscriptions.updateMany({
      where: { userId, status: "paused" },
      data: { status: "active" },
    });

    console.log(`[RAZORPAY-WEBHOOK] Subscription resumed for user ${userId}`);

    return {
      success: true,
      message: "Subscription resumed",
    };
  } catch (error: any) {
    return {
      success: false,
      message: error.message,
    };
  }
}

/**
 * Process subscription charge (successful payment)
 */
async function processSubscriptionCharge(
  userId: string,
  plan: string,
  subscriptionId?: string | null
): Promise<{ success: boolean; message: string }> {
  // Similar to activation but focused on payment confirmation
  return processSubscriptionActivation(userId, plan, subscriptionId);
}

/**
 * Process payment authorized
 */
async function processPaymentAuthorized(
  userId: string,
  plan: string,
  paymentId: string
): Promise<{ success: boolean; message: string }> {
  try {
    // Create payment history record
    const paymentDetails = await razorpay.payments.fetch(paymentId);
    
    await (prisma as any).paymentHistory.create({
      data: {
        userId,
        paymentId,
        status: "paid",
        plan,
        finalAmount: paymentDetails.amount / 100,
        paymentMethod: paymentDetails.method,
        paymentCurrency: paymentDetails.currency,
      },
    });

    console.log(`[RAZORPAY-WEBHOOK] Payment authorized for user ${userId}: ${paymentId}`);

    return {
      success: true,
      message: "Payment authorized",
    };
  } catch (error: any) {
    return {
      success: false,
      message: error.message,
    };
  }
}

/**
 * Process payment failed
 */
async function processPaymentFailed(
  userId: string
): Promise<{ success: boolean; message: string }> {
  try {
    // Update subscription to failed status
    await (prisma as any).subscriptions.updateMany({
      where: { userId, status: "active" },
      data: { status: "failed" },
    });

    console.log(`[RAZORPAY-WEBHOOK] Payment failed for user ${userId}`);

    return {
      success: true,
      message: "Payment failed",
    };
  } catch (error: any) {
    return {
      success: false,
      message: error.message,
    };
  }
}
