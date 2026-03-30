import { Metadata } from "next";

export const metadata: Metadata = {
  title: "About Us | Fluenzy AI - AI-Powered Career Readiness Platform",
  description:
    "Discover how Fluenzy AI is revolutionizing career readiness. Our AI-powered platform helps candidates master interviews, group discussions, and ATS optimization with data-driven precision.",
  openGraph: {
    title: "About Fluenzy AI - Building the Future of Career Readiness",
    description:
      "80% of candidates fail not because they lack skills — but because they were never trained to communicate them. Fluenzy AI fixes that with AI-powered career coaching.",
    url: "https://fluenzyai.app/about",
    siteName: "Fluenzy AI",
    images: [
      {
        url: "/og-about.png",
        width: 1200,
        height: 630,
        alt: "Fluenzy AI - AI-Powered Career Readiness",
      },
    ],
    locale: "en_US",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "About Fluenzy AI - Building the Future of Career Readiness",
    description:
      "AI-powered career coaching platform for interviews, GD, and ATS optimization.",
    images: ["/og-about.png"],
  },
  keywords: [
    "AI interview preparation",
    "career coaching",
    "mock interviews",
    "group discussion practice",
    "ATS optimization",
    "resume scoring",
    "placement preparation",
    "Fluenzy AI",
  ],
};

export default function AboutLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
