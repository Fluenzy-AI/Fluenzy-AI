import { NextRequest, NextResponse } from "next/server";
import { GetObjectCommand, S3Client } from "@aws-sdk/client-s3";
import { cdnUrl } from "@/lib/cdn";

// Initialize R2 client
const R2_ACCOUNT_ID = process.env.R2_ACCOUNT_ID;
const R2_ACCESS_KEY_ID = process.env.R2_ACCESS_KEY_ID;
const R2_SECRET_ACCESS_KEY = process.env.R2_SECRET_ACCESS_KEY;
const R2_BUCKET_NAME = process.env.R2_BUCKET_NAME;
const R2_ENDPOINT = process.env.R2_ENDPOINT;

const r2Client = R2_ACCOUNT_ID && R2_ACCESS_KEY_ID && R2_SECRET_ACCESS_KEY
  ? new S3Client({
      region: "auto",
      endpoint: R2_ENDPOINT || `https://${R2_ACCOUNT_ID}.r2.cloudflarestorage.com`,
      credentials: {
        accessKeyId: R2_ACCESS_KEY_ID,
        secretAccessKey: R2_SECRET_ACCESS_KEY,
      },
    })
  : null;

/**
 * GET /profile-certs/[filename]
 * Serves certificate PDF files from R2 - uses lifetime CDN URLs
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ filename: string }> }
) {
  try {
    const { filename } = await params;

    if (!filename) {
      return NextResponse.json(
        { error: "Invalid file name" },
        { status: 400 }
      );
    }

    // Try R2 if configured
    if (r2Client && R2_BUCKET_NAME) {
      const possibleKeys = [
        `profile-certs/${filename}`,
        filename,
      ];

      for (const key of possibleKeys) {
        try {
          // Check if file exists
          await r2Client.send(new GetObjectCommand({
            Bucket: R2_BUCKET_NAME,
            Key: key,
          }));

          // File exists! Redirect to lifetime CDN URL
          const publicUrl = cdnUrl(key);
          if (publicUrl) {
            console.info(`[PROFILE_CERT] Redirecting to CDN: ${key} -> ${publicUrl}`);
            return NextResponse.redirect(publicUrl, 302);
          }
        } catch (error) {
          // Continue to next key
        }
      }
    }

    return NextResponse.json(
      { error: "Certificate not found" },
      { status: 404 }
    );

  } catch (error) {
    console.error("Certificate serve error:", error);
    return NextResponse.json(
      { error: "Failed to serve certificate" },
      { status: 500 }
    );
  }
}