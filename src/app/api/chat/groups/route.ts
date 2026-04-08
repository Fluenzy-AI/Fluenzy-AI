// GET /api/chat/groups - List user's groups
// POST /api/chat/groups - Create a new group
import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { getUserGroups, createGroup, searchGroups } from "@/modules/chat/services/group.service";

export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const page = Math.max(1, parseInt(searchParams.get("page") ?? "1"));
    const limit = Math.min(50, parseInt(searchParams.get("limit") ?? "20"));
    const search = searchParams.get("search");

    if (search) {
      const groups = await searchGroups(session.user.id, search, limit);
      return NextResponse.json({ data: groups, total: groups.length });
    }

    const result = await getUserGroups(session.user.id, page, limit);
    return NextResponse.json(result);
  } catch (error: any) {
    console.error("[GET /api/chat/groups]", error);
    return NextResponse.json(
      { error: error.message || "Failed to get groups" },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const { name, description, avatar, memberIds = [] } = body;

    if (!name || name.trim().length === 0) {
      return NextResponse.json(
        { error: "Group name is required" },
        { status: 400 }
      );
    }

    const group = await createGroup(session.user.id, {
      name,
      description,
      avatar,
      memberIds
    });

    return NextResponse.json({
      success: true,
      message: "Group created",
      group
    }, { status: 201 });
  } catch (error: any) {
    console.error("[POST /api/chat/groups]", error);
    
    const status = error.message.includes("not found") ? 404 
      : error.message.includes("required") ? 400
      : 500;

    return NextResponse.json(
      { error: error.message || "Failed to create group" },
      { status }
    );
  }
}
