import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { stat } from "fs/promises";
import path from "path";
import { getPublicFileUrl } from "@/lib/file-url-helper";

const toIstDateKey = (date: Date) => {
  const formatter = new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Kolkata",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  });
  return formatter.format(date);
};

export async function GET(
  request: NextRequest,
  context: { params: Promise<{ username: string }> }
) {
  const { params } = context;
  try {
    const { username: rawUsername } = await params;
    const username = rawUsername?.toLowerCase();
    if (!username) {
      return NextResponse.json({ error: "Username required" }, { status: 400 });
    }

    const profile = await (prisma as any).userProfile.findFirst({
      where: { username },
      include: {
        skills: true,
        experiences: true,
        educations: true,
        certifications: true,
        projects: true,
        courses: true,
        languages: true,
        user: true,
      },
    });

    if (!profile || !profile.publicProfileEnabled) {
      return NextResponse.json({ error: "Profile not public" }, { status: 404 });
    }

    const allowed = (profile.publicSections as any) || {
      skills: true,
      experience: true,
      education: true,
      certifications: true,
      projects: true,
      courses: true,
      languages: true,
      analyticsReport: false,
    };

    const oneYearAgo = new Date();
    oneYearAgo.setDate(oneYearAgo.getDate() - 365);

    const sessions = await prisma.session.findMany({
      where: {
        userId: profile.userId,
        startTime: { gte: oneYearAgo },
      },
      select: { startTime: true },
    });

    const activity: Record<string, number> = {};
    sessions.forEach((sessionItem) => {
      const key = toIstDateKey(sessionItem.startTime);
      activity[key] = (activity[key] || 0) + 1;
    });

    const resumes = await (prisma as any).resume.findMany({
      where: { userId: profile.userId },
      orderBy: { uploadedAt: "desc" },
      take: 5,
    });

    const resumesWithSize = await Promise.all(
      resumes.map(async (resume: any) => {
        let fileSize: number | null = null;
        
        // Create lifetime proxy URL for resume
        let publicUrl = resume.fileUrl;
        if (publicUrl && !publicUrl.startsWith('http')) {
          // Use proxy endpoint for R2 files or filesystem paths
          publicUrl = `/api/public-file?key=${encodeURIComponent(resume.fileUrl)}`;
        }
        
        // Try to get file size from filesystem (for local files only)
        if (resume.fileUrl && resume.fileUrl.startsWith('/')) {
          try {
            const localPath = path.join(process.cwd(), "public", resume.fileUrl.replace(/^\/+/, ""));
            const stats = await stat(localPath);
            fileSize = stats.size;
          } catch (error) {
            fileSize = null;
          }
        }
        
        return {
          id: resume.id,
          fileName: resume.fileName,
          fileUrl: publicUrl, // Use proxy URL for lifetime access
          uploadedAt: resume.uploadedAt,
          fileSize,
        };
      })
    );

    // Transform certification URLs to use proxy endpoints (lifetime access)
    const certificationsWithSignedUrls = await Promise.all(
      profile.certifications.map(async (cert: any) => {
        let imageUrl = cert.imageUrl;
        let credentialUrl = cert.credentialUrl;
        
        // Convert imageUrl to proxy URL if it's an R2 key or filesystem path
        if (imageUrl && !imageUrl.startsWith('http')) {
          imageUrl = `/api/public-file?key=${encodeURIComponent(cert.imageUrl)}`;
        }
        
        // Convert credentialUrl to proxy URL if it's an R2 key or filesystem path  
        if (credentialUrl && !credentialUrl.startsWith('http')) {
          credentialUrl = `/api/public-file?key=${encodeURIComponent(cert.credentialUrl)}`;
        }
        
        return {
          ...cert,
          imageUrl,
          credentialUrl,
        };
      })
    );

    return NextResponse.json({
      profile: {
        username: profile.username,
        headline: profile.headline,
        bio: profile.bio,
        openToWork: profile.openToWork,
        user: {
          name: profile.user.name,
          email: profile.user.email,
          image: profile.user.avatar,
        },
        socialLinks: (profile as any).socialLinks || null,
        publicSections: allowed,
      },
      sections: {
        skills: allowed.skills ? profile.skills : [],
        experiences: allowed.experience ? profile.experiences : [],
        educations: allowed.education ? profile.educations : [],
        certifications: allowed.certifications ? certificationsWithSignedUrls : [],
        projects: allowed.projects ? profile.projects : [],
        courses: allowed.courses ? profile.courses : [],
        languages: allowed.languages ? profile.languages : [],
      },
      activity,
      resumes: resumesWithSize,
    });
  } catch (error) {
    console.error("Public profile error:", error);
    return NextResponse.json({ error: "Failed to load profile" }, { status: 500 });
  }
}
