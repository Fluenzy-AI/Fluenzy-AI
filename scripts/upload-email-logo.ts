/**
 * Upload Fluenzy AI logo to R2 CDN for email templates
 * 
 * Run: npx ts-node scripts/upload-email-logo.ts
 */

import { S3Client, PutObjectCommand } from "@aws-sdk/client-s3";
import * as fs from "fs";
import * as path from "path";
import { fileURLToPath } from "url";
import { config } from "dotenv";

// Load environment variables
config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const R2_ACCOUNT_ID = process.env.R2_ACCOUNT_ID!;
const R2_ACCESS_KEY_ID = process.env.R2_ACCESS_KEY_ID!;
const R2_SECRET_ACCESS_KEY = process.env.R2_SECRET_ACCESS_KEY!;
const R2_BUCKET_NAME = process.env.R2_BUCKET_NAME || "public-assets";

const s3Client = new S3Client({
  region: "auto",
  endpoint: `https://${R2_ACCOUNT_ID}.r2.cloudflarestorage.com`,
  credentials: {
    accessKeyId: R2_ACCESS_KEY_ID,
    secretAccessKey: R2_SECRET_ACCESS_KEY,
  },
});

async function uploadLogo() {
  const logoPath = path.join(__dirname, "../public/favicon/white-removebg-preview1.png");
  
  if (!fs.existsSync(logoPath)) {
    console.error("❌ Logo file not found:", logoPath);
    process.exit(1);
  }

  const fileBuffer = fs.readFileSync(logoPath);
  
  const command = new PutObjectCommand({
    Bucket: R2_BUCKET_NAME,
    Key: "email/fluenzy-logo.png",
    Body: fileBuffer,
    ContentType: "image/png",
    CacheControl: "public, max-age=31536000", // 1 year cache
  });

  try {
    await s3Client.send(command);
    console.log("✅ Logo uploaded successfully!");
    console.log("📍 CDN URL: https://cdn.fluenzyai.app/email/fluenzy-logo.png");
  } catch (error) {
    console.error("❌ Upload failed:", error);
    process.exit(1);
  }
}

uploadLogo();
