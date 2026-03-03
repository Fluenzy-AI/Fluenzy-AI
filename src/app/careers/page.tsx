import type { Metadata } from "next";
import CareersClient from "./CareersClient";

export const metadata: Metadata = {
  title: "Careers at Fluenzy AI – Join Our Team",
  description:
    "Explore open positions at Fluenzy AI. Join a team building the future of AI-powered interview coaching and English fluency training.",
  keywords: "careers Fluenzy AI, jobs AI startup, hiring remote, tech jobs India",
  openGraph: {
    title: "Careers at Fluenzy AI – Join Our Team",
    description:
      "We're hiring! Explore roles in Engineering, Design, Product, Marketing and more at Fluenzy AI.",
    url: "https://www.fluenzyai.app/careers",
    siteName: "Fluenzy AI",
    type: "website",
  },
  alternates: { canonical: "https://www.fluenzyai.app/careers" },
};

export default function CareersPage() {
  return <CareersClient />;
}
