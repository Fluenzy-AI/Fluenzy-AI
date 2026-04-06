"use client";

import { usePortalAuth } from "@/contexts/PortalAuthContext";
import {
  Mail,
  Send,
  Eye,
  MousePointer2,
  Users,
  Zap,
  BarChart3,
  ArrowRight,
  Sparkles,
  Target,
  FileText,
  Settings,
  Clock,
} from "lucide-react";
import Link from "next/link";

export default function MarketingDashboardPage() {
  const { user, loading: authLoading } = usePortalAuth();

  if (authLoading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="h-12 w-12 rounded-full border-4 border-purple-500/30 border-t-purple-500 animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Welcome Header */}
      <div className="rounded-2xl border border-white/5 bg-gradient-to-br from-purple-500/10 via-slate-900/50 to-pink-500/10 backdrop-blur-sm p-8">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold text-white">
              Welcome back, {user?.name?.split(" ")[0] || "Marketing Admin"}! 👋
            </h1>
            <p className="text-slate-400 mt-2">
              Manage your email campaigns, segments, and automation from one place.
            </p>
          </div>
          <Link
            href="/portal/marketing/campaigns"
            className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-gradient-to-r from-purple-500 to-pink-500 text-white font-semibold hover:opacity-90 transition-opacity shadow-lg shadow-purple-500/25"
          >
            <Mail className="h-5 w-5" />
            Create Campaign
          </Link>
        </div>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <StatCard icon={Mail} label="Campaigns" value="—" color="purple" />
        <StatCard icon={Send} label="Emails Sent" value="—" color="blue" />
        <StatCard icon={Eye} label="Open Rate" value="—" color="green" />
        <StatCard icon={MousePointer2} label="Click Rate" value="—" color="amber" />
      </div>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Quick Actions */}
        <div className="lg:col-span-2 rounded-2xl border border-white/5 bg-slate-900/50 backdrop-blur-sm overflow-hidden">
          <div className="px-6 py-4 border-b border-white/5">
            <h2 className="text-lg font-semibold text-white flex items-center gap-2">
              <Sparkles className="h-5 w-5 text-purple-400" />
              Quick Actions
            </h2>
          </div>
          <div className="p-6 grid grid-cols-1 sm:grid-cols-2 gap-4">
            <ActionCard
              title="Campaigns"
              description="Create and manage email campaigns"
              icon={Mail}
              href="/portal/marketing/campaigns"
              color="purple"
            />
            <ActionCard
              title="Segments"
              description="Target specific user groups"
              icon={Target}
              href="/portal/marketing/segments"
              color="blue"
            />
            <ActionCard
              title="Automation"
              description="Set up triggered emails"
              icon={Zap}
              href="/portal/marketing/automation"
              color="amber"
            />
            <ActionCard
              title="AI Generator"
              description="Generate email content with AI"
              icon={Sparkles}
              href="/portal/marketing/ai-generator"
              color="pink"
            />
            <ActionCard
              title="Templates"
              description="Manage email templates"
              icon={FileText}
              href="/portal/marketing/templates"
              color="cyan"
            />
            <ActionCard
              title="Analytics"
              description="Track campaign performance"
              icon={BarChart3}
              href="/portal/marketing/analytics"
              color="green"
            />
          </div>
        </div>

        {/* Navigation Panel */}
        <div className="rounded-2xl border border-white/5 bg-slate-900/50 backdrop-blur-sm overflow-hidden">
          <div className="px-6 py-4 border-b border-white/5">
            <h2 className="text-lg font-semibold text-white flex items-center gap-2">
              <Settings className="h-5 w-5 text-purple-400" />
              Management
            </h2>
          </div>
          <div className="p-4 space-y-2">
            <NavLink href="/portal/marketing/campaigns" icon={Mail} label="Campaigns" />
            <NavLink href="/portal/marketing/segments" icon={Users} label="Segments" />
            <NavLink href="/portal/marketing/automation" icon={Zap} label="Automation" />
            <NavLink href="/portal/marketing/analytics" icon={BarChart3} label="Analytics" />
            <NavLink href="/portal/marketing/email-logs" icon={Clock} label="Email Logs" />
            <NavLink href="/portal/marketing/templates" icon={FileText} label="Templates" />
            <NavLink href="/portal/marketing/ai-generator" icon={Sparkles} label="AI Generator" />
            <NavLink href="/portal/marketing/settings" icon={Settings} label="Settings" />
          </div>
        </div>
      </div>

      {/* Getting Started */}
      <div className="rounded-2xl border border-white/5 bg-slate-900/50 backdrop-blur-sm overflow-hidden">
        <div className="px-6 py-4 border-b border-white/5">
          <h2 className="text-lg font-semibold text-white">Getting Started</h2>
        </div>
        <div className="p-6 grid grid-cols-1 md:grid-cols-3 gap-6">
          <StepCard
            step={1}
            title="Create a Segment"
            description="Define your target audience by creating user segments based on activity, plan type, or custom criteria."
            href="/portal/marketing/segments"
          />
          <StepCard
            step={2}
            title="Design Your Email"
            description="Use our AI Generator to create compelling email content or build from templates."
            href="/portal/marketing/ai-generator"
          />
          <StepCard
            step={3}
            title="Launch Campaign"
            description="Send your email to the selected segment and track performance in real-time."
            href="/portal/marketing/campaigns"
          />
        </div>
      </div>
    </div>
  );
}

function StatCard({
  icon: Icon,
  label,
  value,
  color,
}: {
  icon: React.ElementType;
  label: string;
  value: string;
  color: "purple" | "blue" | "green" | "amber";
}) {
  const colorClasses = {
    purple: "bg-purple-500/20 text-purple-400",
    blue: "bg-blue-500/20 text-blue-400",
    green: "bg-green-500/20 text-green-400",
    amber: "bg-amber-500/20 text-amber-400",
  };

  return (
    <div className="rounded-xl border border-white/5 bg-slate-900/50 p-4 flex items-center gap-3">
      <div className={`h-10 w-10 rounded-lg flex items-center justify-center ${colorClasses[color]}`}>
        <Icon className="h-5 w-5" />
      </div>
      <div>
        <p className="text-2xl font-bold text-white">{value}</p>
        <p className="text-xs text-slate-500">{label}</p>
      </div>
    </div>
  );
}

function ActionCard({
  title,
  description,
  icon: Icon,
  href,
  color,
}: {
  title: string;
  description: string;
  icon: React.ElementType;
  href: string;
  color: "purple" | "blue" | "green" | "amber" | "pink" | "cyan";
}) {
  const colorClasses = {
    purple: "bg-purple-500/20 text-purple-400 group-hover:bg-purple-500/30",
    blue: "bg-blue-500/20 text-blue-400 group-hover:bg-blue-500/30",
    green: "bg-green-500/20 text-green-400 group-hover:bg-green-500/30",
    amber: "bg-amber-500/20 text-amber-400 group-hover:bg-amber-500/30",
    pink: "bg-pink-500/20 text-pink-400 group-hover:bg-pink-500/30",
    cyan: "bg-cyan-500/20 text-cyan-400 group-hover:bg-cyan-500/30",
  };

  return (
    <Link
      href={href}
      className="group flex items-center gap-4 p-4 rounded-xl border border-white/5 bg-white/5 hover:bg-white/[0.07] transition-all hover:border-white/10"
    >
      <div className={`h-12 w-12 rounded-xl flex items-center justify-center transition-colors ${colorClasses[color]}`}>
        <Icon className="h-6 w-6" />
      </div>
      <div className="flex-1">
        <p className="text-sm font-semibold text-white">{title}</p>
        <p className="text-xs text-slate-500 mt-0.5">{description}</p>
      </div>
      <ArrowRight className="h-4 w-4 text-slate-600 group-hover:text-slate-400 group-hover:translate-x-1 transition-all" />
    </Link>
  );
}

function NavLink({
  href,
  icon: Icon,
  label,
}: {
  href: string;
  icon: React.ElementType;
  label: string;
}) {
  return (
    <Link
      href={href}
      className="flex items-center gap-3 px-4 py-3 rounded-xl text-slate-400 hover:bg-white/5 hover:text-white transition-colors"
    >
      <Icon className="h-5 w-5" />
      <span className="text-sm font-medium">{label}</span>
      <ArrowRight className="h-4 w-4 ml-auto opacity-0 group-hover:opacity-100" />
    </Link>
  );
}

function StepCard({
  step,
  title,
  description,
  href,
}: {
  step: number;
  title: string;
  description: string;
  href: string;
}) {
  return (
    <Link
      href={href}
      className="group block p-6 rounded-xl border border-white/5 bg-white/5 hover:bg-white/[0.07] transition-all hover:border-purple-500/30"
    >
      <div className="h-10 w-10 rounded-full bg-purple-500/20 flex items-center justify-center mb-4">
        <span className="text-purple-400 font-bold">{step}</span>
      </div>
      <h3 className="text-white font-semibold mb-2">{title}</h3>
      <p className="text-sm text-slate-400">{description}</p>
      <div className="mt-4 flex items-center gap-1 text-purple-400 text-sm font-medium">
        Get Started <ArrowRight className="h-4 w-4 group-hover:translate-x-1 transition-transform" />
      </div>
    </Link>
  );
}
