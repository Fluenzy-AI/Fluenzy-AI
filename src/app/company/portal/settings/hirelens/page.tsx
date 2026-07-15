"use client";

import React from "react";
import { Cpu } from "lucide-react";

export default function HireLensSettingsStubPage() {
  return (
    <div className="flex flex-col items-center justify-center min-h-[300px] text-center p-6">
      <div className="w-12 h-12 rounded-lg bg-[var(--portal-primary-muted)] text-[var(--portal-primary)] flex items-center justify-center mb-4">
        <Cpu className="w-6 h-6" />
      </div>
      <h3 className="text-base font-semibold mb-1" style={{ color: "var(--portal-text-primary)" }}>
        HireLens Configurations
      </h3>
      <p className="text-sm max-w-sm" style={{ color: "var(--portal-text-muted)" }}>
        Adjust AI behavioral weighting, custom feedback categories, and real-time interview transcription styles.
      </p>
    </div>
  );
}
