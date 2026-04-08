// POST /api/chat/groups/[id]/transfer - Transfer group ownership
import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { transferOwnership } from "@/modules/chat/services/group.service";

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;
    const body = await req.json();
    const { newOwnerId } = body;

    if (!newOwnerId) {
      return NextResponse.json(
        { error: "New owner ID is required" },
        { status: 400 }
      );
    }

    await transferOwnership(session.user.id, id, newOwnerId);

    return NextResponse.json({
      success: true,
      message: "Ownership transferred"
    });
  } catch (error: any) {
    console.error("[POST /api/chat/groups/[id]/transfer]", error);
    
    const status = error.message.includes("owner") ? 403 
      : error.message.includes("member") ? 400
      : 500;

    return NextResponse.json(
      { error: error.message || "Failed to transfer ownership" },
      { status }
    );
  }
}
