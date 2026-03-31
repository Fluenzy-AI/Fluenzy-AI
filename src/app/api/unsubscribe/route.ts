/**
 * Email Unsubscribe API
 * POST - Unsubscribe user from marketing emails
 */

import { NextRequest, NextResponse } from "next/server";
import jwt from "jsonwebtoken";
import prisma from "@/lib/prisma";

const JWT_SECRET = process.env.NEXTAUTH_SECRET || "marketing-secret";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { token } = body;

    if (!token) {
      return NextResponse.json(
        { error: "Missing unsubscribe token" },
        { status: 400 }
      );
    }

    try {
      const decoded = jwt.verify(token, JWT_SECRET) as {
        userId: string;
        email: string;
        action: string;
      };

      if (decoded.action !== "unsubscribe" || !decoded.userId) {
        return NextResponse.json(
          { error: "Invalid unsubscribe token" },
          { status: 400 }
        );
      }

      // Update or create email preferences
      await prisma.emailPreferences.upsert({
        where: { userId: decoded.userId },
        update: {
          unsubscribed: true,
          unsubscribedAt: new Date(),
        },
        create: {
          userId: decoded.userId,
          unsubscribed: true,
          unsubscribedAt: new Date(),
          consentGiven: true,
          consentGivenAt: new Date(),
          consentSource: "email_link",
        },
      });

      // Also update any pending email logs for this user
      await prisma.marketingEmailLog.updateMany({
        where: {
          userId: decoded.userId,
          status: "queued",
        },
        data: {
          status: "unsubscribed",
          unsubscribedAt: new Date(),
        },
      });

      return NextResponse.json({
        success: true,
        message: "You have been successfully unsubscribed from marketing emails.",
      });
    } catch (jwtError) {
      console.error("JWT verification error:", jwtError);
      return NextResponse.json(
        { error: "Invalid or expired unsubscribe link" },
        { status: 400 }
      );
    }
  } catch (error) {
    console.error("Unsubscribe error:", error);
    return NextResponse.json(
      { error: "Failed to process unsubscribe request" },
      { status: 500 }
    );
  }
}

// GET - Verify token and get user info
export async function GET(req: NextRequest) {
  try {
    const searchParams = req.nextUrl.searchParams;
    const token = searchParams.get("token");

    if (!token) {
      return NextResponse.json(
        { error: "Missing unsubscribe token" },
        { status: 400 }
      );
    }

    try {
      const decoded = jwt.verify(token, JWT_SECRET) as {
        userId: string;
        email: string;
        action: string;
      };

      if (decoded.action !== "unsubscribe") {
        return NextResponse.json(
          { error: "Invalid token" },
          { status: 400 }
        );
      }

      // Get current preference status
      const prefs = await prisma.emailPreferences.findUnique({
        where: { userId: decoded.userId },
      });

      return NextResponse.json({
        valid: true,
        email: decoded.email,
        alreadyUnsubscribed: prefs?.unsubscribed || false,
      });
    } catch (jwtError) {
      return NextResponse.json(
        { error: "Invalid or expired unsubscribe link" },
        { status: 400 }
      );
    }
  } catch (error) {
    console.error("Unsubscribe verify error:", error);
    return NextResponse.json(
      { error: "Failed to verify unsubscribe link" },
      { status: 500 }
    );
  }
}
