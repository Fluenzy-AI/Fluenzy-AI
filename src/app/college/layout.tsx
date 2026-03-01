import type { Metadata } from "next";
import { CollegeAdminProvider } from "@/contexts/CollegeAdminContext";

export const metadata: Metadata = {
  title: "College Partner Portal – Fluenzy AI",
  description: "Institutional partner portal for managing student access on Fluenzy AI",
};

export default function CollegeLayout({ children }: { children: React.ReactNode }) {
  return (
    <CollegeAdminProvider>
      <div className="min-h-screen bg-[#0a0f1e] text-slate-200">
        {children}
      </div>
    </CollegeAdminProvider>
  );
}
