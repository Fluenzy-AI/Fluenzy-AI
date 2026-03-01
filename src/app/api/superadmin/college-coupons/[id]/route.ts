import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";

async function checkSuperAdmin() {
  const session = await getServerSession(authOptions);
  if (!session || (session.user.role as string) !== "SUPER_ADMIN") return null;
  return session;
}

export async function PUT(req: NextRequest, { params }: { params: { id: string } }) {
  const session = await checkSuperAdmin();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
  try {
    const body = await req.json();
    const { code, discountType, discountValue, maxUsage, expiryDate, applicablePlans, minSeats, status } = body;

    const updated = await (prisma as any).collegeCoupon.update({
      where: { id: params.id },
      data: {
        ...(code && { code: code.toUpperCase().trim() }),
        ...(discountType && { discountType }),
        ...(discountValue != null && { discountValue: Number(discountValue) }),
        ...(maxUsage !== undefined && { maxUsage: maxUsage ? Number(maxUsage) : null }),
        ...(expiryDate !== undefined && { expiryDate: expiryDate ? new Date(expiryDate) : null }),
        ...(applicablePlans !== undefined && { applicablePlans }),
        ...(minSeats !== undefined && { minSeats: minSeats ? Number(minSeats) : null }),
        ...(status && { status }),
      },
    });
    return NextResponse.json(updated);
  } catch {
    return NextResponse.json({ error: "Failed to update coupon" }, { status: 500 });
  }
}

export async function DELETE(_req: NextRequest, { params }: { params: { id: string } }) {
  const session = await checkSuperAdmin();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
  try {
    await (prisma as any).collegeCoupon.delete({ where: { id: params.id } });
    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ error: "Failed to delete coupon" }, { status: 500 });
  }
}
