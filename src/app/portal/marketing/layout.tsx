"use client";

import { PortalAuthProvider } from "@/contexts/PortalAuthContext";
import { MarketingPortalSidebar } from "@/components/marketing-portal/MarketingPortalSidebar";
import { MarketingPortalHeader } from "@/components/marketing-portal/MarketingPortalHeader";
import { useState } from "react";

export default function MarketingPortalLayout({ children }: { children: React.ReactNode }) {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

  return (
    <PortalAuthProvider requiredRole="MARKETING_ADMIN">
      <div className="min-h-screen bg-gradient-to-br from-slate-950 via-purple-950/20 to-slate-950">
        <MarketingPortalSidebar 
          collapsed={sidebarCollapsed} 
          onToggle={() => setSidebarCollapsed(!sidebarCollapsed)} 
        />
        <div className={`transition-all duration-300 ${sidebarCollapsed ? 'ml-20' : 'ml-64'}`}>
          <MarketingPortalHeader />
          <main className="p-6">
            {children}
          </main>
        </div>
      </div>
    </PortalAuthProvider>
  );
}
