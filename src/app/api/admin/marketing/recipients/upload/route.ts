/**
 * Marketing Recipients CSV Upload API
 * POST - Upload and process CSV file
 */

import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { checkMarketingAuth, unauthorizedResponse } from "@/lib/marketing-auth";

export async function POST(req: NextRequest) {
  try {
    const auth = await checkMarketingAuth(req);
    if (!auth.authorized) {
      return unauthorizedResponse(auth.error);
    }

    const formData = await req.formData();
    const file = formData.get("file") as File;

    if (!file) {
      return NextResponse.json({ error: "No file uploaded" }, { status: 400 });
    }

    const content = await file.text();
    const lines = content.split("\n").filter(line => line.trim());
    
    if (lines.length < 2) {
      return NextResponse.json(
        { error: "CSV file must have header and at least one data row" },
        { status: 400 }
      );
    }

    // Parse header
    const header = parseCSVLine(lines[0]);
    const emailIndex = header.findIndex(h => h.toLowerCase() === "email");
    const nameIndex = header.findIndex(h => h.toLowerCase() === "name");
    const tagsIndex = header.findIndex(h => h.toLowerCase() === "tags");

    if (emailIndex === -1) {
      return NextResponse.json(
        { error: "CSV must have an 'email' column" },
        { status: 400 }
      );
    }

    let success = 0;
    let failed = 0;
    let duplicates = 0;
    const errors: string[] = [];

    // Process each row
    for (let i = 1; i < lines.length; i++) {
      const row = parseCSVLine(lines[i]);
      const email = row[emailIndex]?.trim().toLowerCase();
      
      if (!email || !isValidEmail(email)) {
        failed++;
        errors.push(`Row ${i + 1}: Invalid email "${row[emailIndex]}"`);
        continue;
      }

      const name = nameIndex >= 0 ? row[nameIndex]?.trim() || "" : "";
      const tagsStr = tagsIndex >= 0 ? row[tagsIndex]?.trim() || "" : "";
      const tags = tagsStr
        .split(",")
        .map(t => t.trim())
        .filter(Boolean);

      try {
        // Check if email already exists
        const existing = await prisma.marketingRecipient.findUnique({
          where: { email },
        });

        if (existing) {
          duplicates++;
          continue;
        }

        await prisma.marketingRecipient.create({
          data: {
            email,
            name,
            tags,
            status: "active",
          },
        });
        success++;
      } catch (error: any) {
        failed++;
        errors.push(`Row ${i + 1}: ${error.message || "Unknown error"}`);
      }
    }

    return NextResponse.json({
      success,
      failed,
      duplicates,
      errors: errors.slice(0, 10), // Return first 10 errors
    });
  } catch (error) {
    console.error("CSV upload error:", error);
    return NextResponse.json(
      { error: "Failed to process CSV file" },
      { status: 500 }
    );
  }
}

function parseCSVLine(line: string): string[] {
  const result: string[] = [];
  let current = "";
  let inQuotes = false;
  
  for (let i = 0; i < line.length; i++) {
    const char = line[i];
    
    if (char === '"') {
      inQuotes = !inQuotes;
    } else if (char === "," && !inQuotes) {
      result.push(current.trim());
      current = "";
    } else {
      current += char;
    }
  }
  
  result.push(current.trim());
  return result;
}

function isValidEmail(email: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}
