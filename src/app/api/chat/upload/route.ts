import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { uploadToR2, getPublicUrl } from "@/lib/r2-service";
import { v4 as uuidv4 } from "uuid";

// Media type mappings
const ALLOWED_TYPES: Record<string, string[]> = {
  IMAGE: ['image/jpeg', 'image/png', 'image/gif', 'image/webp'],
  VIDEO: ['video/mp4', 'video/webm', 'video/quicktime'],
  DOCUMENT: [
    'application/pdf',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'text/plain',
    'application/vnd.ms-excel',
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  ],
  VOICE: ['audio/webm', 'audio/mp4', 'audio/mpeg', 'audio/ogg', 'audio/wav'],
};

// Max file sizes in bytes
const MAX_SIZES: Record<string, number> = {
  IMAGE: 10 * 1024 * 1024, // 10MB
  VIDEO: 100 * 1024 * 1024, // 100MB
  DOCUMENT: 25 * 1024 * 1024, // 25MB
  VOICE: 10 * 1024 * 1024, // 10MB
};

/**
 * POST /api/chat/upload
 * Upload media for chat messages
 */
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const formData = await request.formData();
    const file = formData.get('file') as File | null;
    const type = formData.get('type') as string || 'DOCUMENT';

    if (!file) {
      return NextResponse.json(
        { error: "No file provided" },
        { status: 400 }
      );
    }

    // Validate file type
    const allowedMimes = ALLOWED_TYPES[type] || ALLOWED_TYPES.DOCUMENT;
    if (!allowedMimes.includes(file.type)) {
      return NextResponse.json(
        { error: `Invalid file type. Allowed: ${allowedMimes.join(', ')}` },
        { status: 400 }
      );
    }

    // Validate file size
    const maxSize = MAX_SIZES[type] || MAX_SIZES.DOCUMENT;
    if (file.size > maxSize) {
      return NextResponse.json(
        { error: `File too large. Maximum: ${formatSize(maxSize)}` },
        { status: 400 }
      );
    }

    // Generate unique file key
    const ext = getExtension(file.name, file.type);
    const fileKey = `chat-media/${session.user.id}/${uuidv4()}.${ext}`;

    // Upload to R2
    const buffer = Buffer.from(await file.arrayBuffer());
    await uploadToR2(fileKey, buffer, file.type);

    // Get public URL
    const url = getPublicUrl(fileKey);

    if (!url) {
      return NextResponse.json(
        { error: "Failed to get file URL" },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      url,
      fileKey,
      fileName: file.name,
      fileType: type,
      mimeType: file.type,
      size: file.size,
    });

  } catch (error) {
    console.error("[Chat Upload] Error:", error);
    return NextResponse.json(
      { error: "Upload failed" },
      { status: 500 }
    );
  }
}

// Helper functions
function formatSize(bytes: number): string {
  if (bytes < 1024) return bytes + ' bytes';
  if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
  return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
}

function getExtension(fileName: string, mimeType: string): string {
  // Try to get from filename first
  const fromName = fileName.split('.').pop()?.toLowerCase();
  if (fromName && fromName.length <= 5) return fromName;
  
  // Fallback to mime type mapping
  const mimeToExt: Record<string, string> = {
    'image/jpeg': 'jpg',
    'image/png': 'png',
    'image/gif': 'gif',
    'image/webp': 'webp',
    'video/mp4': 'mp4',
    'video/webm': 'webm',
    'video/quicktime': 'mov',
    'audio/webm': 'webm',
    'audio/mp4': 'm4a',
    'audio/mpeg': 'mp3',
    'audio/ogg': 'ogg',
    'audio/wav': 'wav',
    'application/pdf': 'pdf',
    'application/msword': 'doc',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document': 'docx',
    'text/plain': 'txt',
  };
  
  return mimeToExt[mimeType] || 'bin';
}
