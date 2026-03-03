import type { Metadata } from "next";
import { notFound } from "next/navigation";
import JobDetailClient from "./JobDetailClient";
import { prisma } from "@/lib/prisma";

type Props = { params: Promise<{ slug: string }> };

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
  const job = await getJob(slug);
  if (!job) return { title: "Job Not Found – Fluenzy AI" };
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

export default async function JobDetailPage({ params }: Props) {
  const { slug } = await params;
  const job = await getJob(slug);
  if (!job) notFound();
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
