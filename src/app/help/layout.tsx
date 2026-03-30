import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Help Center | Fluenzy AI",
  description: "Find guides, tutorials, and support articles for Fluenzy AI's interview training platform.",
  openGraph: {
    title: "Help Center | Fluenzy AI",
    description: "Find guides, tutorials, and support articles for Fluenzy AI's interview training platform.",
    type: "website",
  },
};

export default function HelpLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
