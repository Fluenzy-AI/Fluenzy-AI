import type { Metadata } from "next";
import LandingPage from "@/components/LandingPage";

export const metadata: Metadata = {
  title: "FluenzyAI: AI Interview Coach & English Practice",
  description: "Enhance your interview skills and English fluency with FluenzyAI's AI-powered platform. Practice HR interviews, technical questions, and group discussions for career success.",
  keywords: "AI interview practice, AI interview coach, English speaking practice with AI, mock interview AI, group discussion AI",
  alternates: {
    canonical: "https://www.fluenzyai.app/",
  },
  openGraph: {
    title: "FluenzyAI: AI Interview Coach & English Practice",
    description: "Enhance your interview skills and English fluency with FluenzyAI's AI-powered platform.",
    url: "https://www.fluenzyai.app",
    type: "website",
    images: [
      {
        url: "https://www.fluenzyai.app/og-image.jpg",
        width: 1200,
        height: 630,
        alt: "FluenzyAI - AI Interview Preparation Platform",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "FluenzyAI: AI Interview Coach & English Practice",
    description: "Enhance your interview skills and English fluency with FluenzyAI's AI-powered platform.",
    images: ["https://www.fluenzyai.app/og-image.jpg"],
  },
};

export default function Page() {
  return <LandingPage />;
}
