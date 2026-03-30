import { Metadata } from "next";

export const metadata: Metadata = {
  title: "HireLens — AI Interview Intelligence Device | Fluenzy AI",
  description:
    "Real-time behavioral AI for smarter hiring. Voice, face, and NLP analysis from a wearable device. The world's first AI-powered interview collar device.",
  openGraph: {
    title: "HireLens — AI Interview Intelligence Device | Fluenzy AI",
    description:
      "Real-time behavioral AI for smarter hiring. Voice, face, and NLP analysis from a wearable device.",
    url: "https://fluenzyai.app/hirelens",
    siteName: "Fluenzy AI",
    images: [
      {
        url: "/Fluenzy%20AI%20HireLens/HireLens2.jpg",
        width: 1200,
        height: 630,
        alt: "Fluenzy AI HireLens - AI Interview Intelligence Device",
      },
    ],
    locale: "en_US",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "HireLens — AI Interview Intelligence Device | Fluenzy AI",
    description:
      "Real-time behavioral AI for smarter hiring. Voice, face, and NLP analysis from a wearable device.",
    images: ["/Fluenzy%20AI%20HireLens/HireLens2.jpg"],
  },
  keywords: [
    "AI interview device",
    "interview intelligence",
    "hiring technology",
    "behavioral AI",
    "voice analysis",
    "facial expression recognition",
    "NLP evaluation",
    "HR technology",
    "HireLens",
    "Fluenzy AI",
  ],
};

export default function HireLensLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
