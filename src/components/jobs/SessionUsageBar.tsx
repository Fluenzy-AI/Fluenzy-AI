"use client";

import { UserPlan, PLAN_LIMITS } from "@/types/jobs";

interface Props { 
  used: number; 
  plan: UserPlan; 
}

export function SessionUsageBar({ used, plan }: Props) {
  const total = PLAN_LIMITS[plan].sessions;
  const pct = Math.min((used / total) * 100, 100);
  
  const color = pct >= 80 
    ? "bg-red-500" 
    : pct >= 50 
    ? "bg-yellow-500" 
    : "bg-green-500";

  return (
    <div className="bg-gray-800/50 rounded-xl p-4 border border-gray-700">
      <div className="flex justify-between items-center mb-2">
        <span className="text-sm font-medium text-gray-300">Search Sessions</span>
        <span className="text-sm text-gray-400">{used}/{total} used</span>
      </div>
      <div className="h-2 bg-gray-700 rounded-full overflow-hidden">
        <div 
          className={`h-full ${color} rounded-full transition-all duration-300`} 
          style={{ width: `${pct}%` }} 
        />
      </div>
      {pct >= 100 && (
        <p className="text-xs text-red-400 mt-2 font-medium">
          Limit reached · <a href="/billing" className="underline hover:text-red-300">Upgrade plan</a>
        </p>
      )}
    </div>
  );
}
