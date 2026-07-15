"use client";

import React from "react";
import { ShieldAlert } from "lucide-react";

export default function TeamSettingsStubPage() {
  return (
    <div className="flex flex-col items-center justify-center min-h-[300px] text-center p-6">
      <div className="w-12 h-12 rounded-lg bg-[var(--portal-primary-muted)] text-[var(--portal-primary)] flex items-center justify-center mb-4">
        <ShieldAlert className="w-6 h-6" />
      </div>
      <h3 className="text-base font-semibold mb-1" style={{ color: "var(--portal-text-primary)" }}>
        Team Permissions
      </h3>
      <p className="text-sm max-w-sm" style={{ color: "var(--portal-text-muted)" }}>
        Detailed role permissions controls, department assignment access, and approval policy logs.
      </p>
    </div>
  );
}
