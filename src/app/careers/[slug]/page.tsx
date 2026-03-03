import type { Metadata } from "next";
import { notFound } from "next/navigation";
import JobDetailClient from "./JobDetailClient";

type Props = { params: Promise<{ slug: string }> };

async function getJob(slug: string) {
  try {
    const res = await fetch(`${process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"}/api/careers/jobs/${slug}`, { next: { revalidate: 300 } });
    if (!res.ok) return null;
    return (await res.json()).job;
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
  return <JobDetailClient job={job} />;
}
