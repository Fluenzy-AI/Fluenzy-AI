"use client";

import { PortalAuthProvider } from "@/contexts/PortalAuthContext";

export default function HRPortalLayout({ children }: { children: React.ReactNode }) {
  return (
    <PortalAuthProvider requiredRole="HR">
      {children}
    </PortalAuthProvider>
  );
}
