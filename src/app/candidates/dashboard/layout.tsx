"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import CandidatePortalLayout from "@/components/candidate-portal/CandidatePortalLayout";

interface Candidate {
  id: string;
  name: string;
  email: string;
  createdAt: string;
  profile: any;
}

export default function CandidateDashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [candidate, setCandidate] = useState<Candidate | null>(null);
  const [notifications, setNotifications] = useState(0);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const meRes = await fetch("/api/candidates/me");
        if (!meRes.ok) {
          router.replace("/candidates/login?redirect=/candidates/dashboard");
          return;
        }
        const meData = await meRes.json();
        setCandidate(meData.candidate);

        // Fetch unread notifications count
        const notifRes = await fetch("/api/candidates/notifications?unread=true");
        if (notifRes.ok) {
          const notifData = await notifRes.json();
          setNotifications(notifData.count || 0);
        }
      } catch (error) {
        console.error("Failed to fetch candidate data:", error);
        router.replace("/candidates/login");
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [router]);

  if (loading) {
    return (
      <div className="min-h-screen bg-[#0A0C10] flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 border-2 border-violet-500 border-t-transparent rounded-full animate-spin" />
          <p className="text-sm text-slate-500">Loading your dashboard...</p>
        </div>
      </div>
    );
  }

  if (!candidate) {
    return null;
  }

  return (
    <CandidatePortalLayout candidate={candidate} notifications={notifications}>
      {children}
    </CandidatePortalLayout>
  );
}
