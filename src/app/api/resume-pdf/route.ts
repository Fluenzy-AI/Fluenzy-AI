/**
 * Resume PDF Download
 * GET /api/resume-pdf
 * 
 * OPTIMIZED: Uses document-service for generate-once-serve-from-CDN pattern.
 * Previously launched a FRESH Chromium process per request.
 * Now: cache-first with lazy invalidation on profile update.
 */

import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { htmlToPdf } from "@/lib/pdf-browser";
import { getOrGenerateDocument } from "@/lib/document-service";
import { buildDocumentFileName } from "@/lib/document-types";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const formatDate = (date?: Date | null) => {
  if (!date) return "Present";
  return new Intl.DateTimeFormat("en-IN", {
    year: "numeric",
    month: "short",
  }).format(date);
};

export async function GET(request: NextRequest) {
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

    const profile = await (prisma as any).userProfile.findUnique({
      where: { userId: user.id },
      include: {
        skills: true,
        experiences: true,
        educations: true,
        certifications: true,
        projects: true,
        courses: true,
        languages: true,
      },
    });

    if (!profile) {
      return NextResponse.json({ error: "Profile not found" }, { status: 404 });
    }

    // Check for force-regenerate (e.g., after profile update)
    const forceRegenerate = request.nextUrl.searchParams.get("refresh") === "1";

    const fileName = buildDocumentFileName("resume", profile.username || user.id);

    const result = await getOrGenerateDocument({
      documentType: "resume",
      documentId: `resume-${user.id}`,
      ownerId: user.id,
      fileName,
      forceRegenerate,
      metadata: { username: profile.username },
      generatePdf: async () => {
        // Build HTML — only runs on cache miss
        const html = `
          <!DOCTYPE html>
          <html>
            <head>
              <meta charset="UTF-8" />
              <title>Fluenzy AI Resume</title>
              <style>
                @page { size: A4; margin: 18mm; }
                body { font-family: 'Inter', 'Roboto', 'Helvetica', sans-serif; color: #0f172a; font-size: 11pt; }
                h1 { margin: 0; font-size: 22pt; }
                h2 { margin: 18px 0 8px; font-size: 12pt; text-transform: uppercase; letter-spacing: 0.08em; color: #475569; }
                .section { margin-bottom: 18px; }
                .meta { color: #64748b; font-size: 10pt; }
                .pill { display: inline-block; padding: 4px 10px; margin: 4px 6px 0 0; border-radius: 999px; background: #eef2ff; color: #3730a3; font-weight: 600; font-size: 9.5pt; }
                .item { margin-bottom: 10px; }
                .item-title { font-weight: 700; }
                .item-sub { color: #64748b; font-size: 9.5pt; }
              </style>
            </head>
            <body>
              <h1>${user.name}</h1>
              <div class="meta">${user.email} • ${profile.username}</div>
              <div class="meta">${profile.headline || ""}</div>
              <p>${profile.bio || ""}</p>

              <div class="section">
                <h2>Skills</h2>
                ${profile.skills.length ? profile.skills.map((skill: any) => `<span class="pill">${skill.name} • ${skill.level}</span>`).join("") : '<p class="meta">No skills added yet.</p>'}
              </div>

              <div class="section">
                <h2>Experience</h2>
                ${profile.experiences.length ? profile.experiences.map((exp: any) => `
                  <div class="item">
                    <div class="item-title">${exp.role} • ${exp.company}</div>
                    <div class="item-sub">${formatDate(exp.startDate)} - ${formatDate(exp.endDate)}</div>
                    <div>${exp.description || ""}</div>
                  </div>
                `).join("") : '<p class="meta">No experience added yet.</p>'}
              </div>

              <div class="section">
                <h2>Education</h2>
                ${profile.educations.length ? profile.educations.map((edu: any) => `
                  <div class="item">
                    <div class="item-title">${edu.degree} • ${edu.institution}</div>
                    <div class="item-sub">${edu.startYear}${edu.endYear ? ` - ${edu.endYear}` : ""} ${edu.grade ? `• ${edu.grade}` : ""}</div>
                  </div>
                `).join("") : '<p class="meta">No education added yet.</p>'}
              </div>

              <div class="section">
                <h2>Certifications</h2>
                ${profile.certifications.length ? profile.certifications.map((cert: any) => `
                  <div class="item">
                    <div class="item-title">${cert.name} • ${cert.issuer}</div>
                    <div class="item-sub">Issued ${formatDate(cert.issueDate)} ${cert.credentialUrl ? `• ${cert.credentialUrl}` : ""}</div>
                  </div>
                `).join("") : '<p class="meta">No certifications added yet.</p>'}
              </div>

              <div class="section">
                <h2>Projects</h2>
                ${profile.projects.length ? profile.projects.map((project: any) => `
                  <div class="item">
                    <div class="item-title">${project.title}</div>
                    <div class="item-sub">${project.techStack || ""}</div>
                    <div>${project.description || ""}</div>
                    <div class="item-sub">${project.repoUrl || project.projectUrl || ""}</div>
                  </div>
                `).join("") : '<p class="meta">No projects added yet.</p>'}
              </div>

              <div class="section">
                <h2>Courses</h2>
                ${profile.courses.length ? profile.courses.map((course: any) => `
                  <div class="item">
                    <div class="item-title">${course.name}</div>
                    <div class="item-sub">${course.platform} • ${course.status}</div>
                  </div>
                `).join("") : '<p class="meta">No courses added yet.</p>'}
              </div>

              <div class="section">
                <h2>Languages</h2>
                ${profile.languages.length ? profile.languages.map((lang: any) => `
                  <div class="item">
                    <div class="item-title">${lang.name}</div>
                    <div class="item-sub">${lang.proficiency}</div>
                  </div>
                `).join("") : '<p class="meta">No languages added yet.</p>'}
              </div>
            </body>
          </html>
        `;

        return htmlToPdf(html);
      },
    });

    // Redirect to CDN if available
    if (result.cdnUrl) {
      return NextResponse.redirect(result.cdnUrl);
    }

    // Fallback: return buffer directly
    return new NextResponse(result.pdfBuffer as unknown as BodyInit, {
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `attachment; filename="FluenzyAI_Resume_${profile.username}.pdf"`,
        "Cache-Control": "public, max-age=31536000, immutable",
      },
    });
  } catch (error) {
    console.error("Resume PDF error:", error);
    return NextResponse.json({ error: "Failed to generate resume" }, { status: 500 });
  }
}
