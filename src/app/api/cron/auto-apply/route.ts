/**
 * Auto-Apply Cron Job
 * POST /api/cron/auto-apply
 *
 * This endpoint should be called by a cron service (e.g., Vercel Cron, GitHub Actions)
 * to automatically apply candidates to matching jobs based on their preferences.
 *
 * Logic:
 * 1. Get active jobs with autoApplyEnabled = true posted in last 24h
 * 2. Get candidates with autoApplyEnabled = true and quota remaining
 * 3. Match based on: skills overlap >= threshold, role match, location match
 * 4. Submit applications, increment counters, log results
 */

import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getAutoApplyLimitByPlan, getSkillMatchThresholdByPlan } from "@/lib/company-auth";

// Verify cron secret to prevent unauthorized calls
const CRON_SECRET = process.env.CRON_SECRET;

interface MatchResult {
  candidateId: string;
  jobId: string;
  matchScore: number;
  matchedSkills: string[];
}

function calculateSkillMatch(candidateSkills: string[], jobSkills: string[]): { score: number; matched: string[] } {
  if (jobSkills.length === 0) return { score: 100, matched: [] };

  const normalizedCandidateSkills = candidateSkills.map(s => s.toLowerCase().trim());
  const normalizedJobSkills = jobSkills.map(s => s.toLowerCase().trim());

  const matched = normalizedJobSkills.filter(skill =>
    normalizedCandidateSkills.some(cs =>
      cs.includes(skill) || skill.includes(cs)
    )
  );

  const score = Math.round((matched.length / normalizedJobSkills.length) * 100);
  return { score, matched };
}

function roleMatches(candidateRoles: string[], jobTitle: string): boolean {
  if (candidateRoles.length === 0) return true;

  const normalizedJobTitle = jobTitle.toLowerCase();
  return candidateRoles.some(role =>
    normalizedJobTitle.includes(role.toLowerCase()) ||
    role.toLowerCase().includes(normalizedJobTitle.split(' ')[0])
  );
}

function locationMatches(candidateLocations: string[], jobLocation: string): boolean {
  if (candidateLocations.length === 0) return true;
  return candidateLocations.includes(jobLocation);
}

function employmentTypeMatches(candidateTypes: string[], jobType: string): boolean {
  if (candidateTypes.length === 0) return true;
  return candidateTypes.includes(jobType);
}

export async function POST(req: NextRequest) {
  try {
    // Verify cron secret
    const authHeader = req.headers.get("authorization");
    if (CRON_SECRET && authHeader !== `Bearer ${CRON_SECRET}`) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const now = new Date();
    const twentyFourHoursAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000);

    // Get jobs posted in last 24 hours with auto-apply enabled
    const eligibleJobs = await prisma.externalJob.findMany({
      where: {
        isActive: true,
        autoApplyEnabled: true,
        createdAt: { gte: twentyFourHoursAgo },
        company: {
          status: "ACTIVE",
          autoApplyEnabled: true,
        },
      },
      select: {
        id: true,
        title: true,
        skills: true,
        location: true,
        employmentType: true,
        salaryMin: true,
        salaryMax: true,
        companyId: true,
        company: {
          select: { name: true },
        },
      },
    });

    if (eligibleJobs.length === 0) {
      return NextResponse.json({
        success: true,
        message: "No eligible jobs found",
        stats: { jobsProcessed: 0, applicationsCreated: 0 },
      });
    }

    // Get candidates with auto-apply enabled and quota remaining
    const eligibleCandidates = await prisma.candidateUser.findMany({
      where: {
        isVerified: true,
        jobPreferences: {
          autoApplyEnabled: true,
        },
      },
      select: {
        id: true,
        email: true,
        name: true,
        profile: {
          select: {
            skills: true,
            resumeUrl: true,
          },
        },
        jobPreferences: {
          select: {
            id: true,
            targetRoles: true,
            targetLocations: true,
            targetTypes: true,
            minSalary: true,
            excludeCompanies: true,
            autoApplyCount: true,
          },
        },
      },
    });

    // Get candidate plans from linked main user accounts
    const candidatePlans = new Map<string, string>();
    if (eligibleCandidates.length > 0) {
      const linkedUsers = await prisma.users.findMany({
        where: {
          email: {
            in: eligibleCandidates.map(c => c.email),
          }
        },
        select: { email: true, plan: true },
      });
      linkedUsers.forEach(user => {
        candidatePlans.set(user.email.toLowerCase(), user.plan);
      });
    }

    const matches: MatchResult[] = [];
    const applicationsToCreate: Array<{
      jobId: string;
      companyId: string;
      candidateId: string;
      name: string;
      email: string;
      resumeUrl: string | null;
      skills: string[];
      matchScore: number;
    }> = [];

    // Match candidates to jobs
    for (const candidate of eligibleCandidates) {
      const prefs = candidate.jobPreferences;
      if (!prefs) continue;

      // Skip if candidate doesn't have a resume - required for applications
      if (!candidate.profile?.resumeUrl) continue;

      // Get candidate's actual plan
      const candidatePlan = candidatePlans.get(candidate.email.toLowerCase()) || "Free";
      const limit = getAutoApplyLimitByPlan(candidatePlan);
      if (limit === 0 || prefs.autoApplyCount >= limit) continue;

      const threshold = getSkillMatchThresholdByPlan(candidatePlan);
      const candidateSkills = candidate.profile?.skills || [];

      for (const job of eligibleJobs) {
        // Check if company is excluded
        if (prefs.excludeCompanies.some(c =>
          c.toLowerCase() === job.company.name.toLowerCase()
        )) {
          continue;
        }

        // Check if already applied
        const existingApplication = await prisma.externalJobApplication.findFirst({
          where: {
            jobId: job.id,
            candidateId: candidate.id,
          },
        });
        if (existingApplication) continue;

        // Check role match
        if (!roleMatches(prefs.targetRoles, job.title)) continue;

        // Check location match
        if (!locationMatches(prefs.targetLocations, job.location)) continue;

        // Check employment type match
        if (!employmentTypeMatches(prefs.targetTypes, job.employmentType)) continue;

        // Check salary (if candidate has minimum and job has range)
        if (prefs.minSalary && job.salaryMax) {
          const candidateMinSalary = parseFloat(prefs.minSalary.replace(/[^0-9.]/g, ''));
          const jobMaxSalary = typeof job.salaryMax === 'string' ? parseFloat(job.salaryMax) : job.salaryMax;
          if (!isNaN(candidateMinSalary) && !isNaN(jobMaxSalary) && jobMaxSalary < candidateMinSalary) {
            continue;
          }
        }

        // Calculate skill match
        const { score, matched } = calculateSkillMatch(candidateSkills, job.skills);

        if (score >= threshold) {
          matches.push({
            candidateId: candidate.id,
            jobId: job.id,
            matchScore: score,
            matchedSkills: matched,
          });

          applicationsToCreate.push({
            jobId: job.id,
            companyId: job.companyId,
            candidateId: candidate.id,
            name: candidate.name || "Candidate",
            email: candidate.email,
            resumeUrl: candidate.profile?.resumeUrl || null,
            skills: candidateSkills,
            matchScore: score,
          });
        }
      }
    }

    // Sort by match score (Pro users get priority with higher threshold)
    applicationsToCreate.sort((a, b) => b.matchScore - a.matchScore);

    // Create applications and update counters
    let applicationsCreated = 0;
    const logs: Array<{
      candidateId: string;
      jobId: string;
      status: "SUCCESS" | "FAILED";
      errorMessage?: string;
    }> = [];

    for (const app of applicationsToCreate) {
      try {
        // Re-check quota (in case it changed during processing)
        const currentPrefs = await prisma.candidateJobPreferences.findUnique({
          where: { candidateId: app.candidateId },
        });

        const candidate = eligibleCandidates.find(c => c.id === app.candidateId);
        if (!candidate || !currentPrefs) continue;

        const candidatePlan = candidatePlans.get(candidate.email.toLowerCase()) || "Free";
        const limit = getAutoApplyLimitByPlan(candidatePlan);
        if (currentPrefs.autoApplyCount >= limit) {
          logs.push({
            candidateId: app.candidateId,
            jobId: app.jobId,
            status: "FAILED",
            errorMessage: "Quota exceeded",
          });
          continue;
        }

        // Create application
        await prisma.$transaction([
          prisma.externalJobApplication.create({
            data: {
              jobId: app.jobId,
              candidateId: app.candidateId,
              name: app.name,
              email: app.email,
              phone: "",
              resumeUrl: app.resumeUrl || "",
              experience: "",
              isAutoApplied: true,
              status: "PENDING",
            },
          }),
          prisma.candidateJobPreferences.update({
            where: { candidateId: app.candidateId },
            data: { autoApplyCount: { increment: 1 } },
          }),
          prisma.autoApplyLog.create({
            data: {
              candidateId: app.candidateId,
              jobId: app.jobId,
              companyId: app.companyId,
              status: "APPLIED",
            },
          }),
        ]);

        // Create notification for candidate
        const jobDetails = eligibleJobs.find(j => j.id === app.jobId);
        if (jobDetails) {
          try {
            // Find the user associated with this candidate email (case-insensitive)
            const user = await prisma.users.findFirst({
              where: {
                email: {
                  equals: app.email,
                  mode: "insensitive"
                }
              },
              select: { id: true },
            });

            if (user) {
              await prisma.notification.create({
                data: {
                  userId: user.id,
                  title: "Auto-Applied to a Job",
                  message: `You were auto-applied to ${jobDetails.title} at ${jobDetails.company.name}`,
                  type: "success",
                  sentBy: "system",
                  sentByRole: "SYSTEM",
                },
              });
            }
          } catch (notifError) {
            console.error("[AUTO_APPLY] Failed to create notification:", notifError);
            // Don't fail the application if notification fails
          }
        }

        applicationsCreated++;
        logs.push({
          candidateId: app.candidateId,
          jobId: app.jobId,
          status: "SUCCESS",
        });
      } catch (error) {
        console.error(`[AUTO_APPLY] Failed for candidate ${app.candidateId}, job ${app.jobId}:`, error);
        logs.push({
          candidateId: app.candidateId,
          jobId: app.jobId,
          status: "FAILED",
          errorMessage: error instanceof Error ? error.message : "Unknown error",
        });

        // Log failure
        await prisma.autoApplyLog.create({
          data: {
            candidateId: app.candidateId,
            jobId: app.jobId,
            companyId: app.companyId,
            status: "FAILED",
            failureReason: error instanceof Error ? error.message : "Unknown error",
          },
        }).catch(() => {});
      }
    }

    return NextResponse.json({
      success: true,
      stats: {
        jobsProcessed: eligibleJobs.length,
        candidatesProcessed: eligibleCandidates.length,
        matchesFound: matches.length,
        applicationsCreated,
      },
      timestamp: now.toISOString(),
    });
  } catch (error) {
    console.error("[CRON_AUTO_APPLY]", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

// GET endpoint for health check
export async function GET() {
  return NextResponse.json({
    status: "ok",
    endpoint: "/api/cron/auto-apply",
    description: "Auto-apply cron job endpoint",
  });
}
