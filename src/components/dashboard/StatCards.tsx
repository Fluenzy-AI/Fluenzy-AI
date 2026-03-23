"use client";

import { useRef } from "react";
import { motion, useInView } from "framer-motion";
import { cn } from "@/lib/utils";
import { SimpleCounter } from "../shared/AnimatedCounter";
import { StatCardSkeleton } from "../shared/SkeletonLoader";
import * as Tooltip from "@radix-ui/react-tooltip";
import {
  AreaChart,
  Area,
  ResponsiveContainer,
} from "recharts";
import {
  ClipboardList,
  Clock,
  Star,
  Calendar,
} from "lucide-react";

interface StatCardData {
  label: string;
  value: number;
  icon: React.ReactNode;
  color: string;
  borderColor: string;
  bgColor: string;
  trend?: number; // percentage change
  breakdown?: string;
  sparklineData?: number[];
}

interface StatCardsProps {
  stats: {
    total: number;
    pending: number;
    shortlisted: number;
    interviews: number;
  };
  loading?: boolean;
  className?: string;
}

// Generate mock sparkline data based on current value
function generateSparklineData(currentValue: number, days: number = 7): number[] {
  const data: number[] = [];
  let value = Math.max(0, currentValue - Math.floor(Math.random() * 3));

  for (let i = 0; i < days - 1; i++) {
    data.push(value);
    value += Math.floor(Math.random() * 2) - (Math.random() > 0.6 ? 0 : 1);
    value = Math.max(0, value);
  }
  data.push(currentValue);

  return data;
}

function StatCard({
  data,
  index,
}: {
  data: StatCardData;
  index: number;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { once: true, margin: "-50px" });

  const sparklineData = data.sparklineData || generateSparklineData(data.value);
  const chartData = sparklineData.map((value, i) => ({ value, index: i }));

  return (
    <Tooltip.Provider delayDuration={300}>
      <Tooltip.Root>
        <Tooltip.Trigger asChild>
          <motion.div
            ref={ref}
            initial={{ opacity: 0, y: 16 }}
            animate={inView ? { opacity: 1, y: 0 } : {}}
            transition={{
              duration: 0.4,
              delay: index * 0.08,
              ease: [0.16, 1, 0.3, 1] as const,
            }}
            whileHover={{ y: -2, transition: { duration: 0.2 } }}
            className={cn(
              "relative bg-[#13161E] rounded-[14px] p-5 cursor-default",
              "border border-white/[0.06] hover:border-white/[0.1]",
              "shadow-[0_1px_3px_rgba(0,0,0,0.4),0_0_0_0.5px_rgba(255,255,255,0.06)]",
              "hover:shadow-[0_4px_12px_rgba(0,0,0,0.5),0_0_0_0.5px_rgba(255,255,255,0.08)]",
              "transition-all duration-200"
            )}
          >
            {/* Left border accent */}
            <div
              className={cn("absolute left-0 top-3 bottom-3 w-[3px] rounded-r-full", data.borderColor)}
            />

            {/* Header */}
            <div className="flex items-start justify-between mb-3">
              <div
                className={cn(
                  "w-9 h-9 rounded-xl flex items-center justify-center",
                  data.bgColor
                )}
              >
                {data.icon}
              </div>

              {/* Trend indicator */}
              {data.trend !== undefined && (
                <span
                  className={cn(
                    "text-[10px] font-medium px-1.5 py-0.5 rounded-md",
                    data.trend >= 0
                      ? "text-[#22C55E] bg-[#22C55E]/10"
                      : "text-[#EF4444] bg-[#EF4444]/10"
                  )}
                >
                  {data.trend >= 0 ? "+" : ""}
                  {data.trend}%
                </span>
              )}
            </div>

            {/* Value */}
            <div className="mb-1">
              <span className={cn("text-3xl font-bold", data.color)}>
                <SimpleCounter value={data.value} duration={500} />
              </span>
            </div>

            {/* Label */}
            <p className="text-xs font-medium text-[#8B8A99]">{data.label}</p>

            {/* Sparkline */}
            <div className="mt-3 h-8 -mx-1">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={chartData}>
                  <defs>
                    <linearGradient
                      id={`gradient-${data.label.replace(/\s/g, "")}`}
                      x1="0"
                      y1="0"
                      x2="0"
                      y2="1"
                    >
                      <stop
                        offset="0%"
                        stopColor={data.color.includes("[#")
                          ? data.color.match(/\[([^\]]+)\]/)?.[1] || "#7C5CFC"
                          : "#7C5CFC"}
                        stopOpacity={0.3}
                      />
                      <stop
                        offset="100%"
                        stopColor={data.color.includes("[#")
                          ? data.color.match(/\[([^\]]+)\]/)?.[1] || "#7C5CFC"
                          : "#7C5CFC"}
                        stopOpacity={0}
                      />
                    </linearGradient>
                  </defs>
                  <Area
                    type="monotone"
                    dataKey="value"
                    stroke={data.color.includes("[#")
                      ? data.color.match(/\[([^\]]+)\]/)?.[1] || "#7C5CFC"
                      : "#7C5CFC"}
                    strokeWidth={1.5}
                    fill={`url(#gradient-${data.label.replace(/\s/g, "")})`}
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </motion.div>
        </Tooltip.Trigger>

        <Tooltip.Portal>
          <Tooltip.Content
            side="top"
            sideOffset={8}
            className="z-50 px-3 py-2 bg-[#1A1D28] border border-white/10 rounded-lg shadow-xl animate-in fade-in-0 zoom-in-95"
          >
            <p className="text-xs text-[#F1F0F5] font-medium">{data.breakdown || "7-day trend"}</p>
            {data.trend !== undefined && (
              <p className="text-[10px] text-[#8B8A99] mt-0.5">
                {data.trend >= 0 ? "Up" : "Down"} {Math.abs(data.trend)}% vs last week
              </p>
            )}
            <Tooltip.Arrow className="fill-[#1A1D28]" />
          </Tooltip.Content>
        </Tooltip.Portal>
      </Tooltip.Root>
    </Tooltip.Provider>
  );
}

export function StatCards({ stats, loading = false, className }: StatCardsProps) {
  if (loading) {
    return (
      <div className={cn("grid grid-cols-2 lg:grid-cols-4 gap-4", className)}>
        {[1, 2, 3, 4].map((i) => (
          <StatCardSkeleton key={i} />
        ))}
      </div>
    );
  }

  const cardsData: StatCardData[] = [
    {
      label: "Total Applied",
      value: stats.total,
      icon: <ClipboardList className="w-4 h-4 text-[#9F7FFF]" />,
      color: "text-[#F1F0F5]",
      borderColor: "bg-[#7C5CFC]",
      bgColor: "bg-[#7C5CFC]/10",
      trend: 20,
      breakdown: "3 this week, 1 today",
    },
    {
      label: "Pending Review",
      value: stats.pending,
      icon: <Clock className="w-4 h-4 text-[#F59E0B]" />,
      color: "text-[#F59E0B]",
      borderColor: "bg-[#F59E0B]",
      bgColor: "bg-[#F59E0B]/10",
      trend: -5,
      breakdown: "Awaiting employer review",
    },
    {
      label: "Shortlisted",
      value: stats.shortlisted,
      icon: <Star className="w-4 h-4 text-[#3B82F6]" />,
      color: "text-[#3B82F6]",
      borderColor: "bg-[#3B82F6]",
      bgColor: "bg-[#3B82F6]/10",
      trend: 15,
      breakdown: "Selected for next round",
    },
    {
      label: "Interviews",
      value: stats.interviews,
      icon: <Calendar className="w-4 h-4 text-[#22C55E]" />,
      color: "text-[#22C55E]",
      borderColor: "bg-[#22C55E]",
      bgColor: "bg-[#22C55E]/10",
      trend: 10,
      breakdown: "Upcoming scheduled",
    },
  ];

  return (
    <div className={cn("grid grid-cols-2 lg:grid-cols-4 gap-4", className)}>
      {cardsData.map((data, index) => (
        <StatCard key={data.label} data={data} index={index} />
      ))}
    </div>
  );
}
