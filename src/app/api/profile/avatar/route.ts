import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { uploadToR2, getPublicUrl, deleteFromR2 } from "@/lib/r2-service";
import { v4 as uuidv4 } from "uuid";

export const runtime = "nodejs";

const MAX_FILE_SIZE = 3 * 1024 * 1024; // 3MB
const ALLOWED_TYPES = ["image/png", "image/jpeg", "image/jpg", "image/webp"];

const getExtension = (mimeType: string): string => {
  const map: Record<string, string> = {
    "image/png": "png",
    "image/jpeg": "jpg",
    "image/jpg": "jpg",
    "image/webp": "webp",
  };
  return map[mimeType] || "jpg";
};

export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const user = await prisma.users.findUnique({
      where: { email: session.user.email },
    });

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    const formData = await request.formData();
    const file = formData.get("file") as File | null;

    if (!file) {
      return NextResponse.json({ error: "Profile image is required" }, { status: 400 });
    }

    if (!ALLOWED_TYPES.includes(file.type)) {
      return NextResponse.json({ error: "Only PNG, JPG, or WEBP images are allowed" }, { status: 400 });
    }

    if (file.size > MAX_FILE_SIZE) {
      return NextResponse.json({ error: "File size must be under 3MB" }, { status: 400 });
    }

    // Build unique file key for R2
    const ext = getExtension(file.type);
    const fileKey = `avatars/${user.id}/${uuidv4()}.${ext}`;

    // Upload to R2
    const buffer = Buffer.from(await file.arrayBuffer());
    await uploadToR2(fileKey, buffer, file.type);

    // Get public CDN URL
    const cdnUrl = getPublicUrl(fileKey);
    if (!cdnUrl) {
      throw new Error("Failed to generate CDN URL");
    }

    // Delete old avatar from R2 if it exists and is an R2 URL
    const oldAvatar = user.avatar;
    if (oldAvatar && oldAvatar.includes("cdn.fluenzyai.app")) {
      try {
        // Extract key from CDN URL: https://cdn.fluenzyai.app/avatars/... -> avatars/...
        const oldKey = oldAvatar.replace("https://cdn.fluenzyai.app/", "");
        await deleteFromR2(oldKey);
        console.log("[Avatar] Deleted old avatar:", oldKey);
      } catch (e) {
        console.warn("[Avatar] Failed to delete old avatar (may not exist):", e);
      }
    }

    // Update database with new CDN URL
    await prisma.users.update({
      where: { id: user.id },
      data: { avatar: cdnUrl },
    });

    console.log(`[Avatar] Uploaded for user ${user.id}: ${cdnUrl}`);

    return NextResponse.json({
      success: true,
      imageUrl: cdnUrl,
    });
  } catch (error) {
    console.error("Avatar upload error:", error);
    return NextResponse.json({ error: "Failed to upload profile image" }, { status: 500 });
  }
}
