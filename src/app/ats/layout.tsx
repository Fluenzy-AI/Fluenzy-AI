import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Advanced ATS System | Fluenzy AI",
  description:
    "Upload your resume and get a real-time ATS compatibility score with detailed AI-powered insights.",
};

export default function ATSLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
