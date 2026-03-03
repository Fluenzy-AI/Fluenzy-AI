"use client";

import { PortalAuthProvider } from "@/contexts/PortalAuthContext";

export default function AdminPortalLayout({ children }: { children: React.ReactNode }) {
  return (
    <PortalAuthProvider requiredRole="ADMIN">
      {children}
    </PortalAuthProvider>
  );
}
