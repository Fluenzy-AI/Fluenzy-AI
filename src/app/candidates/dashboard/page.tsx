"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import {
  HeroBanner,
  StatCards,
  QuickActions,
  ProfileStrength,
  AppliedJobsList,
  TopSkillsWidget,
  ResumeWidget,
} from "@/components/dashboard";
import { type ApplicationStatus } from "@/components/shared/StatusBadge";
import { type ProficiencyLevel } from "@/components/shared/SkillPill";

interface Application {
  id: string;
  status: ApplicationStatus;
  createdAt: string;
  job: { title: string; department: string; location: string; slug?: string };
}

interface Profile {
  profileCompletion: number;
  resumeUrl?: string;
  resumeUpdatedAt?: string;
  skills?: string[];
  phone?: string;
  bio?: string;
}

interface Candidate {
  id: string;
  name: string;
  email: string;
}

// Convert profile to checklist items for ProfileStrength widget
function getProfileItems(profile: Profile | null): Array<{
  label: string;
  done: boolean;
  tip: string;
  href?: string;
}> {
  return [
    {
      label: "Basic info",
      done: profile ? profile.profileCompletion >= 10 : false,
      tip: "Your name and contact details help employers reach you",
      href: "/candidates/dashboard/profile",
    },
    {
      label: "Phone number",
      done: !!profile?.phone,
      tip: "Adding a phone helps HR contact you quickly",
      href: "/candidates/dashboard/profile#contact",
    },
    {
      label: "Bio / Summary",
      done: !!profile?.bio,
      tip: "A good bio helps recruiters understand your background",
      href: "/candidates/dashboard/profile#bio",
    },
    {
      label: "Skills added",
      done: (profile?.skills?.length ?? 0) > 0,
      tip: "Skills help match you with relevant job opportunities",
      href: "/candidates/dashboard/profile#skills",
    },
    {
      label: "Resume uploaded",
      done: !!profile?.resumeUrl,
      tip: "A resume makes applying to jobs faster",
      href: "/candidates/dashboard/profile#resume",
    },
  ];
}

// Convert skills to SkillPill format with mock proficiency
function getSkillsWithProficiency(skills: string[] = []): Array<{
  name: string;
  proficiency?: ProficiencyLevel;
  years?: number;
}> {
  return skills.map((skill, index) => ({
    name: skill,
    // Add mock proficiency data for demo purposes
    proficiency: ((index % 5) + 1) as ProficiencyLevel,
    years: Math.floor(Math.random() * 5) + 1,
  }));
}

export default function CandidateOverviewPage() {
  const [apps, setApps] = useState<Application[]>([]);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [candidate, setCandidate] = useState<Candidate | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      fetch("/api/candidates/applications").then((r) => r.json()),
      fetch("/api/candidates/profile").then((r) => r.json()),
      fetch("/api/candidates/me").then((r) => r.json()),
    ])
      .then(([a, p, m]) => {
        setApps(Array.isArray(a.applications) ? a.applications : []);
        setProfile(p.profile || null);
        setCandidate(m.candidate || null);
      })
      .finally(() => setLoading(false));
  }, []);

  const stats = {
    total: apps.length,
    pending: apps.filter((a) => a.status === "PENDING").length,
    shortlisted: apps.filter((a) => a.status === "SHORTLISTED").length,
    interviews: apps.filter((a) => a.status === "INTERVIEW_SCHEDULED").length,
  };

  const completion = profile?.profileCompletion ?? 0;
  const firstName = candidate?.name?.split(" ")[0] ?? "there";

  // Mock data for demo
  const mockStreak = 3;
  const mockNewMatches = 2;
  const mockAiScore = profile?.resumeUrl ? 78 : null;

  // Animation container variants
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1,
      },
    },
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 16 },
    visible: {
      opacity: 1,
      y: 0,
      transition: { duration: 0.4, ease: [0.16, 1, 0.3, 1] as const },
    },
  };

  return (
    <motion.div
      variants={containerVariants}
      initial="hidden"
      animate="visible"
      className="max-w-6xl space-y-6"
    >
      {/* Hero Banner */}
      <motion.div variants={itemVariants}>
        <HeroBanner
          firstName={loading ? "Loading..." : firstName}
          stats={loading ? undefined : stats}
          streak={mockStreak}
          newMatches={mockNewMatches}
          loading={loading}
        />
      </motion.div>

      {/* Stat Cards */}
      <motion.div variants={itemVariants}>
        <StatCards stats={stats} loading={loading} />
      </motion.div>

      {/* Quick Actions */}
      <motion.div variants={itemVariants}>
        <QuickActions />
      </motion.div>

      {/* Main content grid */}
      <div className="grid lg:grid-cols-3 gap-6">
        {/* Left column - Applied Jobs */}
        <motion.div variants={itemVariants} className="lg:col-span-2">
          <AppliedJobsList
            applications={apps}
            loading={loading}
            maxDisplay={6}
          />
        </motion.div>

        {/* Right column - Widgets */}
        <motion.div variants={itemVariants} className="space-y-5">
          {/* Profile Strength */}
          <ProfileStrength
            completion={completion}
            items={getProfileItems(profile)}
            loading={loading}
          />

          {/* Resume Widget */}
          <ResumeWidget
            resumeUrl={profile?.resumeUrl}
            lastUpdated={profile?.resumeUpdatedAt}
            aiScore={mockAiScore}
            loading={loading}
          />

          {/* Top Skills */}
          {!loading && (profile?.skills?.length ?? 0) > 0 && (
            <TopSkillsWidget
              skills={getSkillsWithProficiency(profile?.skills)}
              maxDisplay={6}
              onAddSkill={() => {
                window.location.href = "/candidates/dashboard/profile#skills";
              }}
            />
          )}
        </motion.div>
      </div>
    </motion.div>
  );
}
