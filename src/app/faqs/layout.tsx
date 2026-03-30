import { Metadata } from "next";

export const metadata: Metadata = {
  title: "FAQs | Fluenzy AI",
  description: "Answers to the most common questions about Fluenzy AI interview training, ATS scoring, billing, and HireLens device.",
  openGraph: {
    title: "FAQs | Fluenzy AI",
    description: "Answers to the most common questions about Fluenzy AI interview training, ATS scoring, billing, and HireLens device.",
    type: "website",
  },
};

export default function FAQsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
