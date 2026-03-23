import { Metadata } from "next";
import JobsClient from "./JobsClient";

export const metadata: Metadata = {
  title: "Jobs - Fluenzy AI Career Portal",
  description: "Browse jobs from top companies on Fluenzy AI's global career portal. Find your dream job and apply today.",
  openGraph: {
    title: "Jobs - Fluenzy AI Career Portal",
    description: "Browse jobs from top companies on Fluenzy AI's global career portal.",
  },
};

export default function JobsPage() {
  return <JobsClient />;
}
