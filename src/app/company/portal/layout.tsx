"use client";

import React from "react";
import "./portal-tokens.css";
import { CompanyAuthProvider } from "@/contexts/CompanyAuthContext";
import CompanyPortalLayout from "@/components/company-portal/CompanyPortalLayout";

export default function Layout({ children }: { children: React.ReactNode }) {
  return (
    <CompanyAuthProvider>
      <CompanyPortalLayout>{children}</CompanyPortalLayout>
    </CompanyAuthProvider>
  );
}
