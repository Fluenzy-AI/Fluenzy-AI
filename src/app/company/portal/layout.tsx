"use client";

import { CompanyAuthProvider } from "@/contexts/CompanyAuthContext";

export default function CompanyPortalLayout({ children }: { children: React.ReactNode }) {
  return (
    <CompanyAuthProvider>
      {children}
    </CompanyAuthProvider>
  );
}
