import React from "react";
import { Card, CardContent, CardHeader } from "@/components/ui/card";

export default function ProfileSkeleton() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-950 via-slate-900 to-slate-950">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-6 max-w-6xl space-y-8 animate-pulse">
        
        {/* ─── Hero Profile Card Skeleton ─── */}
        <Card className="relative overflow-hidden border-slate-700/50 bg-slate-900/60">
          {/* Gradient banner placeholder */}
          <div className="h-32 sm:h-40 bg-slate-800/80 relative" />
          <CardContent className="px-6 sm:px-8 pb-8 -mt-14 relative">
            <div className="flex flex-col sm:flex-row sm:items-end gap-5">
              {/* Avatar placeholder */}
              <div className="w-28 h-28 rounded-2xl border-4 border-slate-900 bg-slate-800 shadow-xl shrink-0" />
              {/* Name + Info placeholder */}
              <div className="flex-1 min-w-0 space-y-3 pb-2">
                <div className="h-8 w-48 rounded bg-current opacity-10" />
                <div className="h-4 w-64 rounded bg-current opacity-10" />
                <div className="flex gap-3 pt-1">
                  <div className="h-5 w-32 rounded bg-current opacity-10" />
                  <div className="h-5 w-20 rounded bg-current opacity-10" />
                </div>
              </div>
              {/* Plan stats placeholder */}
              <div className="flex flex-col items-end gap-2 shrink-0 pb-2">
                <div className="flex gap-4">
                  <div className="space-y-1 text-right">
                    <div className="h-3 w-10 rounded bg-current opacity-10" />
                    <div className="h-5 w-16 rounded bg-current opacity-10" />
                  </div>
                  <div className="space-y-1 text-right">
                    <div className="h-3 w-12 rounded bg-current opacity-10" />
                    <div className="h-5 w-20 rounded bg-current opacity-10" />
                  </div>
                </div>
                <div className="h-8 w-36 rounded bg-current opacity-10" />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* ─── Two-Column: Basic Info + Settings Skeleton ─── */}
        <div className="grid lg:grid-cols-5 gap-6">
          {/* Left Column (3 cols) */}
          <div className="lg:col-span-3 space-y-6">
            <Card className="border-slate-700/50 bg-slate-900/60 p-6 space-y-6">
              <div className="h-6 w-40 rounded bg-current opacity-10" />
              <div className="grid sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <div className="h-3 w-20 rounded bg-current opacity-10" />
                  <div className="h-9 w-full rounded bg-current opacity-10" />
                </div>
                <div className="space-y-2">
                  <div className="h-3 w-20 rounded bg-current opacity-10" />
                  <div className="h-9 w-full rounded bg-current opacity-10" />
                </div>
              </div>
              <div className="space-y-2">
                <div className="h-3 w-20 rounded bg-current opacity-10" />
                <div className="h-9 w-full rounded bg-current opacity-10" />
              </div>
              <div className="space-y-2">
                <div className="h-3 w-16 rounded bg-current opacity-10" />
                <div className="h-20 w-full rounded bg-current opacity-10" />
              </div>
            </Card>

            <Card className="border-slate-700/50 bg-slate-900/60 p-6 space-y-6">
              <div className="h-6 w-32 rounded bg-current opacity-10" />
              <div className="grid sm:grid-cols-2 gap-4">
                {[1, 2, 3, 4].map((i) => (
                  <div key={i} className="space-y-2">
                    <div className="h-3 w-16 rounded bg-current opacity-10" />
                    <div className="h-9 w-full rounded bg-current opacity-10" />
                  </div>
                ))}
              </div>
            </Card>
          </div>

          {/* Right Column (2 cols) */}
          <div className="lg:col-span-2 space-y-6">
            <Card className="border-slate-700/50 bg-slate-900/60 p-6 space-y-4">
              <div className="h-6 w-32 rounded bg-current opacity-10" />
              <div className="h-32 w-full rounded bg-current opacity-10" />
            </Card>
            <Card className="border-slate-700/50 bg-slate-900/60 p-6 space-y-4">
              <div className="h-6 w-36 rounded bg-current opacity-10" />
              <div className="h-40 w-full rounded bg-current opacity-10" />
            </Card>
          </div>
        </div>

      </div>
    </div>
  );
}
