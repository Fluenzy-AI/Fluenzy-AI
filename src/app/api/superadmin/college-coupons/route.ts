import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";

async function checkSuperAdmin() {
  const session = await getServerSession(authOptions);
  if (!session || (session.user.role as string) !== "SUPER_ADMIN") return null;
  return session;
}

export async function GET() {
  const session = await checkSuperAdmin();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
  try {
    const coupons = await (prisma as any).collegeCoupon.findMany({ orderBy: { createdAt: "desc" } });
    return NextResponse.json(coupons);
  } catch {
    return NextResponse.json({ error: "Failed to fetch coupons" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  const session = await checkSuperAdmin();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
  try {
    const body = await req.json();
    const { code, discountType, discountValue, maxUsage, expiryDate, applicablePlans, minSeats, status } = body;

    if (!code || !discountType || discountValue == null) {
      return NextResponse.json({ error: "code, discountType, and discountValue are required" }, { status: 400 });
    }

    const existing = await (prisma as any).collegeCoupon.findUnique({ where: { code: code.toUpperCase() } });
    if (existing) return NextResponse.json({ error: "A coupon with this code already exists" }, { status: 409 });

    const coupon = await (prisma as any).collegeCoupon.create({
      data: {
        code: code.toUpperCase().trim(),
        discountType,
        discountValue: Number(discountValue),
        maxUsage: maxUsage ? Number(maxUsage) : null,
        expiryDate: expiryDate ? new Date(expiryDate) : null,
        applicablePlans: applicablePlans ?? [],
        minSeats: minSeats ? Number(minSeats) : null,
        status: status ?? "active",
      },
    });
    return NextResponse.json(coupon, { status: 201 });
  } catch (e: any) {
    if (e?.code === "P2002") return NextResponse.json({ error: "Coupon code already exists" }, { status: 409 });
    return NextResponse.json({ error: "Failed to create coupon" }, { status: 500 });
  }
}
