import type { Metadata } from "next";
import { notFound } from "next/navigation";
import JobDetailClient from "./JobDetailClient";
import CompanyCareersClient, { type PublicCompany, type PublicJob } from "./CompanyCareersClient";
import prisma from "@/lib/prisma";

type Props = { params: Promise<{ slug: string }> };

async function getCompanyWithJobs(slug: string) {
  try {
    const company = await prisma.company.findFirst({
      where: {
        slug: { equals: slug, mode: "insensitive" },
        status: "ACTIVE",
      },
      select: {
        id: true,
        name: true,
        slug: true,
        domain: true,
        logoUrl: true,
        website: true,
        description: true,
        industry: true,
        size: true,
        jobs: {
          where: { isActive: true },
          orderBy: { createdAt: "desc" },
          select: {
            id: true,
            title: true,
            slug: true,
            department: true,
            location: true,
            city: true,
            employmentType: true,
            description: true,
            requirements: true,
            responsibilities: true,
            skills: true,
            experienceYears: true,
            salaryMin: true,
            salaryMax: true,
            createdAt: true,
          },
        },
      },
    });

    return company ?? null;
  } catch (err) {
    console.error("[CAREERS_COMPANY_LOOKUP_ERROR]", err);
    return null;
  }
}

async function getJob(slug: string) {
  try {
    const job = await prisma.job.findUnique({
      where: { slug, isActive: true },
      include: { _count: { select: { applications: true } } },
    });
    return job ?? null;
  } catch {
    return null;
  }
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;

  // Check if it's a company slug
  const company = await getCompanyWithJobs(slug);
  if (company) {
    return {
      title: `Careers at ${company.name} – Fluenzy AI`,
      description: company.description || `Explore open job opportunities and apply to join ${company.name}.`,
      openGraph: {
        title: `Careers at ${company.name}`,
        description: `View ${company.jobs.length} open positions at ${company.name}.`,
        url: `https://www.fluenzyai.app/careers/${slug}`,
        type: "website",
      },
    };
  }

  // Check if it's a job slug
  const job = await getJob(slug);
  if (job) {
    return {
      title: `${job.title} – Careers at Fluenzy AI`,
      description: `Join Fluenzy AI as a ${job.title}. ${job.department} · ${job.location}. Apply now.`,
      openGraph: {
        title: `${job.title} – Fluenzy AI Careers`,
        description: `${job.department} · ${job.location} · ${job.employmentType.replace("_", "-")}`,
        url: `https://www.fluenzyai.app/careers/${slug}`,
        type: "website",
      },
    };
  }

  return { title: "Careers – Fluenzy AI" };
}

export default async function CareersSlugPage({ params }: Props) {
  const { slug } = await params;

  // 1. Check if slug matches a registered company
  const company = await getCompanyWithJobs(slug);
  if (company) {
    const formattedCompany: PublicCompany = {
      id: company.id,
      name: company.name,
      slug: company.slug,
      domain: company.domain || undefined,
      logoUrl: company.logoUrl || undefined,
      website: company.website || undefined,
      description: company.description || undefined,
      industry: company.industry || undefined,
      size: company.size || undefined,
    };

    const formattedJobs: PublicJob[] = company.jobs.map((j) => ({
      id: j.id,
      title: j.title,
      slug: j.slug,
      department: j.department,
      location: j.location,
      city: j.city || undefined,
      employmentType: j.employmentType,
      description: j.description,
      requirements: j.requirements,
      responsibilities: j.responsibilities,
      skills: j.skills,
      experienceYears: j.experienceYears,
      salaryMin: j.salaryMin || undefined,
      salaryMax: j.salaryMax || undefined,
      createdAt: j.createdAt.toISOString(),
    }));

    return <CompanyCareersClient company={formattedCompany} jobs={formattedJobs} />;
  }

  // 2. Check if slug matches a job posting
  const job = await getJob(slug);
  if (job) {
    return (
      <JobDetailClient
        job={{
          id: job.id,
          title: job.title,
          slug: job.slug,
          department: job.department,
          location: job.location as string,
          employmentType: job.employmentType as string,
          description: job.description,
          requirements: job.requirements,
          responsibilities: job.responsibilities,
          skills: job.skills,
          experienceYears: job.experienceYears,
          salaryRange: job.salaryRange ?? undefined,
          createdAt: job.createdAt.toISOString(),
        }}
      />
    );
  }

  // 3. Not found
  notFound();
}
