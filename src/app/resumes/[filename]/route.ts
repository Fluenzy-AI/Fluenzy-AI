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
 * GET /resumes/[filename]
 * Serves PDF files from R2 or redirects to signed URL
 * 
 * This route handles both:
 * - Direct R2 keys: resumes/userId_timestamp.pdf
 * - Filename-only URLs: 69a3ca822fbeb1c6a6baa0a8_ef1a6902-b1dd-4300-a2c9-71c9d29360c8.pdf
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ filename: string }> }
) {
  try {
    const { filename } = await params;

    // Validate filename
    if (!filename || !filename.endsWith('.pdf')) {
      return NextResponse.json(
        { error: "Invalid file name" },
        { status: 400 }
      );
    }

    // Try R2 first if configured
    if (r2Client && R2_BUCKET_NAME) {
      // Try multiple R2 key formats
      const possibleKeys = [
        `resumes/${filename}`,                          // Standard format
        `job-resumes/${filename}`,                      // Job application format
        `profile-resumes/${filename}`,                  // Profile format
        filename.includes('/') ? filename : `resumes/${filename}`, // Fallback
      ];

      for (const fileKey of possibleKeys) {
        try {
          // Check if file exists in R2
          await r2Client.send(new GetObjectCommand({
            Bucket: R2_BUCKET_NAME,
            Key: fileKey,
          }));

          // File exists! Redirect to lifetime CDN URL
          const publicUrl = cdnUrl(fileKey);
          if (publicUrl) {
            console.info(`[RESUME_SERVE] Redirecting to CDN: ${fileKey} -> ${publicUrl}`);
            return NextResponse.redirect(publicUrl, 302);
          }
        } catch (r2Error: any) {
          // If NoSuchKey, try next key format
          if (r2Error.name === 'NoSuchKey' || r2Error.$metadata?.httpStatusCode === 404) {
            continue; // Try next key
          }
          
          // For other errors, log and continue
          console.error(`[RESUME_R2_ERROR] Key: ${fileKey}`, r2Error.message);
        }
      }
      
      // If we reach here, file not found in any R2 location
      console.warn(`[RESUME_NOT_FOUND] File not found in R2: ${filename}`);
    }

    // Fallback: try filesystem (for local development)
    if (process.env.NODE_ENV === 'development') {
      const fs = require('fs').promises;
      const path = require('path');
      
      // Try multiple filesystem locations
      const possiblePaths = [
        path.join(process.cwd(), 'public', 'uploads', 'resumes', filename),
        path.join(process.cwd(), 'public', 'resumes', filename),
      ];
      
      for (const filePath of possiblePaths) {
        try {
          const fileBuffer = await fs.readFile(filePath);
          
          return new NextResponse(fileBuffer, {
            status: 200,
            headers: {
              'Content-Type': 'application/pdf',
              'Content-Disposition': 'inline',
              'Cache-Control': 'public, max-age=3600, immutable',
            },
          });
        } catch (fsError) {
          // Try next path
          continue;
        }
      }
    }

    // File not found anywhere
    return NextResponse.json(
      { 
        error: "File not found", 
        message: "This resume may have expired or been deleted. Please re-upload your resume.",
        filename,
        r2Configured: !!r2Client,
      },
      { status: 404 }
    );

  } catch (error) {
    console.error("[RESUME_SERVE_ERROR]", error);
    return NextResponse.json(
      { error: "Failed to serve file" },
      { status: 500 }
    );
  }
}
