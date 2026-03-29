"use client";

import React from "react";
import { motion } from "framer-motion";
import { 
  Video, 
  VideoOff, 
  X, 
  Activity,
  Eye,
  User,
  Smile,
  Brain,
  Target,
  Zap,
  AlertTriangle,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { cn } from "@/lib/utils";
import { 
  VideoMetrics, 
  getMetricColor, 
  getMetricLabel,
  getMetricBgColor,
} from "@/hooks/useVideoAnalysis";

interface VideoAnalysisPanelProps {
  videoRef: React.RefObject<HTMLVideoElement>;
  metrics: VideoMetrics;
  isConnected: boolean;
  isAnalyzing: boolean;
  onStop?: () => void;
  onClose?: () => void;
  showVideo?: boolean;
  compact?: boolean;
}

interface MetricBarProps {
  label: string;
  value: number;
  icon: React.ReactNode;
  isStress?: boolean;
}

const MetricBar: React.FC<MetricBarProps> = ({ label, value, icon, isStress = false }) => {
  const colorClass = getMetricColor(value, isStress);
  const bgClass = getMetricBgColor(value, isStress);
  const statusLabel = getMetricLabel(value, isStress);
  
  return (
    <div className="space-y-1">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className={cn("w-4 h-4", colorClass)}>{icon}</span>
          <span className="text-xs font-medium text-slate-300">{label}</span>
        </div>
        <div className="flex items-center gap-2">
          <span className={cn("text-xs font-bold", colorClass)}>{value}%</span>
          <span className={cn("text-[10px]", colorClass)}>{statusLabel}</span>
        </div>
      </div>
      <div className="h-1.5 bg-slate-700 rounded-full overflow-hidden">
        <motion.div
          className={cn("h-full rounded-full", bgClass)}
          initial={{ width: 0 }}
          animate={{ width: `${value}%` }}
          transition={{ duration: 0.5, ease: "easeOut" }}
        />
      </div>
    </div>
  );
};

export default function VideoAnalysisPanel({
  videoRef,
  metrics,
  isConnected,
  isAnalyzing,
  onStop,
  onClose,
  showVideo = true,
  compact = false,
}: VideoAnalysisPanelProps) {
  const [lastUpdate, setLastUpdate] = React.useState<Date>(new Date());

  // Update timestamp when metrics change
  React.useEffect(() => {
    setLastUpdate(new Date());
  }, [metrics]);

  if (compact) {
    return (
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-slate-900/95 backdrop-blur-sm border border-slate-700 rounded-xl p-3 shadow-xl"
      >
        <div className="flex items-center gap-3">
          {/* Mini metrics */}
          <div className="flex items-center gap-2">
            <div className="flex items-center gap-1">
              <Activity className={cn("w-3 h-3", getMetricColor(metrics.confidence))} />
              <span className="text-xs text-white">{metrics.confidence}%</span>
            </div>
            <div className="flex items-center gap-1">
              <Eye className={cn("w-3 h-3", getMetricColor(metrics.eyeContact))} />
              <span className="text-xs text-white">{metrics.eyeContact}%</span>
            </div>
            <div className="flex items-center gap-1">
              <AlertTriangle className={cn("w-3 h-3", getMetricColor(metrics.stressLevel, true))} />
              <span className="text-xs text-white">{metrics.stressLevel}%</span>
            </div>
          </div>
          
          {/* Connection status */}
          <div className="flex items-center gap-1">
            <div className={cn(
              "w-2 h-2 rounded-full",
              isConnected ? "bg-green-500 animate-pulse" : "bg-red-500"
            )} />
            <span className="text-[10px] text-slate-400">
              {isConnected ? "LIVE" : "Offline"}
            </span>
          </div>
        </div>
      </motion.div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      className="bg-slate-900/95 backdrop-blur-sm border border-slate-700 rounded-xl shadow-2xl overflow-hidden w-72"
    >
      {/* Header */}
      <div className="flex items-center justify-between p-3 border-b border-slate-700">
        <div className="flex items-center gap-2">
          <Activity className="w-4 h-4 text-purple-400" />
          <span className="text-sm font-semibold text-white">AI Video Analysis</span>
          {isConnected && isAnalyzing && (
            <span className="flex items-center gap-1 px-1.5 py-0.5 bg-green-500/20 rounded text-[10px] text-green-400">
              <span className="w-1.5 h-1.5 bg-green-500 rounded-full animate-pulse" />
              LIVE
            </span>
          )}
        </div>
        <div className="flex items-center gap-1">
          {onStop && (
            <Button
              variant="ghost"
              size="icon"
              onClick={onStop}
              className="h-6 w-6 text-slate-400 hover:text-white"
            >
              <VideoOff className="w-3 h-3" />
            </Button>
          )}
          {onClose && (
            <Button
              variant="ghost"
              size="icon"
              onClick={onClose}
              className="h-6 w-6 text-slate-400 hover:text-white"
            >
              <X className="w-3 h-3" />
            </Button>
          )}
        </div>
      </div>

      {/* Video Preview */}
      {showVideo && (
        <div className="relative aspect-video bg-black">
          <video
            ref={videoRef}
            autoPlay
            muted
            playsInline
            className="w-full h-full object-cover"
          />
          {!isAnalyzing && (
            <div className="absolute inset-0 flex items-center justify-center bg-slate-900/80">
              <Video className="w-8 h-8 text-slate-500" />
            </div>
          )}
          {/* Connection indicator overlay */}
          <div className="absolute top-2 right-2">
            <div className={cn(
              "flex items-center gap-1 px-2 py-1 rounded-full text-[10px]",
              isConnected 
                ? "bg-green-500/20 text-green-400" 
                : "bg-red-500/20 text-red-400"
            )}>
              <div className={cn(
                "w-1.5 h-1.5 rounded-full",
                isConnected ? "bg-green-500 animate-pulse" : "bg-red-500"
              )} />
              {isConnected ? "Connected" : "Disconnected"}
            </div>
          </div>
        </div>
      )}

      {/* Metrics */}
      <div className="p-3 space-y-3">
        {/* Primary metrics */}
        <div className="space-y-2">
          <MetricBar
            label="Confidence"
            value={metrics.confidence}
            icon={<Activity />}
          />
          <MetricBar
            label="Eye Contact"
            value={metrics.eyeContact}
            icon={<Eye />}
          />
          <MetricBar
            label="Posture"
            value={metrics.posture}
            icon={<User />}
          />
          <MetricBar
            label="Smile"
            value={metrics.smile}
            icon={<Smile />}
          />
        </div>

        {/* Divider */}
        <div className="border-t border-slate-700/50" />

        {/* Stress indicator (special styling - lower is better) */}
        <div className="space-y-2">
          <MetricBar
            label="Stress Level"
            value={metrics.stressLevel}
            icon={<AlertTriangle />}
            isStress={true}
          />
        </div>

        {/* Additional metrics (collapsible on small screens) */}
        <details className="group">
          <summary className="text-xs text-slate-400 cursor-pointer hover:text-slate-300 list-none flex items-center gap-1">
            <span className="group-open:rotate-90 transition-transform">▶</span>
            More metrics
          </summary>
          <div className="mt-2 space-y-2">
            <MetricBar
              label="Engagement"
              value={metrics.engagement}
              icon={<Zap />}
            />
            <MetricBar
              label="Focus"
              value={metrics.focus}
              icon={<Target />}
            />
            <MetricBar
              label="Expression"
              value={metrics.expressionAnalysis}
              icon={<Brain />}
            />
          </div>
        </details>

        {/* Last updated */}
        <div className="text-[10px] text-slate-500 text-center">
          Updated {lastUpdate.toLocaleTimeString()}
        </div>
      </div>
    </motion.div>
  );
}

// Export a minimal version for embedding in other components
export function VideoAnalysisMini({
  metrics,
  isConnected,
}: {
  metrics: VideoMetrics;
  isConnected: boolean;
}) {
  return (
    <div className="flex items-center gap-4 p-2 bg-slate-800/50 rounded-lg">
      <div className="flex items-center gap-1">
        <div className={cn(
          "w-2 h-2 rounded-full",
          isConnected ? "bg-green-500 animate-pulse" : "bg-red-500"
        )} />
        <span className="text-xs text-slate-400">
          {isConnected ? "Live" : "—"}
        </span>
      </div>
      
      <div className="flex items-center gap-3 text-xs">
        <div className="flex items-center gap-1">
          <Activity className={cn("w-3 h-3", getMetricColor(metrics.confidence))} />
          <span className="text-white font-medium">{metrics.confidence}%</span>
        </div>
        <div className="flex items-center gap-1">
          <Eye className={cn("w-3 h-3", getMetricColor(metrics.eyeContact))} />
          <span className="text-white font-medium">{metrics.eyeContact}%</span>
        </div>
        <div className="flex items-center gap-1">
          <User className={cn("w-3 h-3", getMetricColor(metrics.posture))} />
          <span className="text-white font-medium">{metrics.posture}%</span>
        </div>
        <div className="flex items-center gap-1">
          <AlertTriangle className={cn("w-3 h-3", getMetricColor(metrics.stressLevel, true))} />
          <span className="text-white font-medium">{metrics.stressLevel}%</span>
        </div>
      </div>
    </div>
  );
}
