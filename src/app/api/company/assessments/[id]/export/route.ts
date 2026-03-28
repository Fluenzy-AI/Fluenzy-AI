import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { requireCompanyRoles } from "@/lib/company-auth";

/**
 * GET /api/company/assessments/[id]/export
 * Export assessment results as CSV
 */
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // Verify company member authentication
    const authResult = await requireCompanyRoles(req, ["ADMIN", "HR_RECRUITER", "HIRING_MANAGER"]);
    if (!authResult.authorized || !authResult.member || !authResult.company) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;

    // Get assessment with results and candidate info
    const assessment = await prisma.assessment.findUnique({
      where: {
        id: id,
        companyId: authResult.company.id,
      },
      include: {
        results: {
          orderBy: {
            completedAt: 'desc',
          },
        },
      },
    });

    if (!assessment) {
      return NextResponse.json({ error: "Assessment not found" }, { status: 404 });
    }

    // Get candidate details from CandidateAssessmentSession if available
    const sessions = await prisma.candidateAssessmentSession.findMany({
      where: {
        assessmentId: id,
      },
      include: {
        application: {
          select: {
            name: true,
            email: true,
            phone: true,
            job: {
              select: {
                title: true,
              },
            },
          },
        },
      },
    }).catch(() => []);

    // Build session map for quick lookup
    const sessionMap = new Map(sessions.map(s => [s.candidateId, s]));

    // Build CSV content
    const headers = [
      "Candidate Name",
      "Email",
      "Phone",
      "Job Title",
      "Score (%)",
      "Passed",
      "Status",
      "Time Taken (minutes)",
      "Started At",
      "Completed At",
      "Interview Transcript",
    ];

    const rows = assessment.results.map((result) => {
      const session = sessionMap.get(result.candidateId);
      const candidateName = session?.application?.name || "Unknown";
      const candidateEmail = session?.application?.email || "N/A";
      const candidatePhone = session?.application?.phone || "N/A";
      const jobTitle = session?.application?.job?.title || "N/A";
      
      // Parse AI transcript if available
      let transcriptSummary = "N/A";
      if (session?.aiTranscript && typeof session.aiTranscript === 'string') {
        try {
          const transcripts = JSON.parse(session.aiTranscript);
          if (Array.isArray(transcripts) && transcripts.length > 0) {
            transcriptSummary = transcripts
              .map((t: any) => `Q: ${t.aiPrompt?.substring(0, 100) || 'N/A'}... A: ${t.userAnswer?.substring(0, 100) || 'N/A'}...`)
              .join(" | ");
          }
        } catch (e) {
          transcriptSummary = session.aiTranscript.substring(0, 500);
        }
      }

      return [
        candidateName,
        candidateEmail,
        candidatePhone,
        jobTitle,
        result.score.toFixed(1),
        result.passed ? "Yes" : "No",
        "Completed",
        Math.round(result.timeTaken / 60).toString(),
        result.startedAt ? new Date(result.startedAt).toISOString() : "N/A",
        result.completedAt ? new Date(result.completedAt).toISOString() : "N/A",
        transcriptSummary,
      ];
    });

    // If no results yet but sessions exist, include pending candidates
    if (assessment.results.length === 0 && sessions.length > 0) {
      sessions.forEach((session) => {
        rows.push([
          session.application?.name || "Unknown",
          session.application?.email || "N/A",
          session.application?.phone || "N/A",
          session.application?.job?.title || "N/A",
          "N/A",
          "N/A",
          session.status,
          "N/A",
          session.assignedAt ? new Date(session.assignedAt).toISOString() : "N/A",
          "N/A",
          "N/A", // Transcript
        ]);
      });
    }

    // Create CSV content
    const csvContent = [
      headers.join(","),
      ...rows.map((row) =>
        row.map((cell) => `"${String(cell).replace(/"/g, '""')}"`).join(",")
      ),
    ].join("\n");

    // Generate filename
    const filename = `${assessment.title.replace(/[^a-z0-9]/gi, "_")}_results_${new Date().toISOString().split("T")[0]}.csv`;

    // Return CSV file
    return new NextResponse(csvContent, {
      status: 200,
      headers: {
        "Content-Type": "text/csv; charset=utf-8",
        "Content-Disposition": `attachment; filename="${filename}"`,
      },
    });
  } catch (error) {
    console.error("[COMPANY_ASSESSMENT_EXPORT]", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
