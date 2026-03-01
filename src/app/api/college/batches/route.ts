import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getCollegeAdminFromRequest } from "@/lib/collegeAuth";

// GET /api/college/batches - List batches
export async function GET(req: NextRequest) {
  const admin = await getCollegeAdminFromRequest(req);
  if (!admin) return NextResponse.json({ error: "Unauthorized." }, { status: 401 });

  const batches = await prisma.collegeBatch.findMany({
    where: { collegeAdminId: admin.id },
    orderBy: { createdAt: "desc" },
    include: {
      _count: { select: { students: true } },
    },
  });

  return NextResponse.json({ batches });
}

// POST /api/college/batches - Create batch
export async function POST(req: NextRequest) {
  const admin = await getCollegeAdminFromRequest(req);
  if (!admin) return NextResponse.json({ error: "Unauthorized." }, { status: 401 });

  const body = await req.json();
  const { name, department, graduationYear, description } = body as {
    name: string;
    department?: string;
    graduationYear?: number;
    description?: string;
  };

  if (!name?.trim()) return NextResponse.json({ error: "Batch name is required." }, { status: 400 });

  const batch = await prisma.collegeBatch.create({
    data: {
      collegeAdminId: admin.id,
      name: name.trim(),
      department: department?.trim(),
      graduationYear: graduationYear ? Number(graduationYear) : undefined,
      description: description?.trim(),
    },
  });

  return NextResponse.json({ success: true, batch });
}
