import { Metadata } from "next";

export const metadata: Metadata = {
  title: "How HireLens Works — AI Interview Intelligence | Fluenzy AI",
  description:
    "Step-by-step guide to the HireLens system — from device setup to real-time AI scoring, smart follow-up questions, and ranked candidate reports. Understand how HireLens transforms your hiring process.",
  openGraph: {
    title: "How HireLens Works — AI Interview Intelligence | Fluenzy AI",
    description:
      "Step-by-step guide to the HireLens system — real-time AI scoring, smart follow-up questions, and ranked candidate reports.",
    url: "https://fluenzyai.app/hirelens/how-it-works",
    siteName: "Fluenzy AI",
    images: [
      {
        url: "/Fluenzy%20AI%20HireLens/HireLens2.jpg",
        width: 1200,
        height: 630,
        alt: "Fluenzy AI HireLens — How It Works",
      },
    ],
    locale: "en_US",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "How HireLens Works — AI Interview Intelligence | Fluenzy AI",
    description:
      "Step-by-step guide to the HireLens system — real-time AI scoring, smart follow-up questions, and ranked candidate reports.",
    images: ["/Fluenzy%20AI%20HireLens/HireLens2.jpg"],
  },
  keywords: [
    "HireLens how it works",
    "AI interview process",
    "interview intelligence workflow",
    "real-time candidate scoring",
    "AI hiring technology",
    "HireLens setup guide",
    "Fluenzy AI",
  ],
};

export default function HowItWorksLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
