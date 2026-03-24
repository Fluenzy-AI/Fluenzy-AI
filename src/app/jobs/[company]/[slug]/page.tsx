import prisma from "@/lib/prisma";
import { notFound } from "next/navigation";
import { Metadata } from "next";
import JobDetailClient from "./JobDetailClient";

interface Props {
  params: Promise<{ company: string; slug: string }>;
}

async function getJob(companySlug: string, jobSlug: string) {
  const company = await prisma.company.findUnique({
    where: { slug: companySlug, status: "ACTIVE" },
    select: { id: true },
  });

  if (!company) return null;

  const job = await prisma.externalJob.findUnique({
    where: { companyId_slug: { companyId: company.id, slug: jobSlug } },
    include: {
      company: {
        select: {
          name: true,
          slug: true,
          domain: true,
          logoUrl: true,
          website: true,
          description: true,
          industry: true,
          size: true,
        },
      },
    },
  });

  if (!job) return null;

  // Convert null values to undefined to match the Job interface
  return {
    ...job,
    city: job.city || undefined,
    salaryMin: job.salaryMin || undefined,
    salaryMax: job.salaryMax || undefined,
  };
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { company, slug } = await params;
  const job = await getJob(company, slug);

  if (!job) {
    return { title: "Job Not Found" };
  }

  return {
    title: `${job.title} at ${job.company.name} - Fluenzy AI Jobs`,
    description: job.description.slice(0, 160),
    openGraph: {
      title: `${job.title} - ${job.company.name}`,
      description: job.description.slice(0, 160),
    },
  };
}

export default async function JobDetailPage({ params }: Props) {
  const { company, slug } = await params;
  const job = await getJob(company, slug);

  if (!job || !job.isActive) {
    notFound();
  }

  return <JobDetailClient job={job} />;
}
