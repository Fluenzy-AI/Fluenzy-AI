"use client";

import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import HistoryView from "../../../Learn_English/components/HistoryView";

const HistoryPage = () => {
  const { data: session, status } = useSession();
  const router = useRouter();

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/");
    }
  }, [status, router]);
  if (status === "loading" || !session?.user) {
    return (
      <div className="flex items-center justify-center min-h-[50vh] animate-pulse">
        <div className="flex flex-col items-center gap-4">
          <div className="w-10 h-10 border-4 border-cyan-400/30 border-t-cyan-400 rounded-full animate-spin" />
          <p className="text-sm text-slate-400">Loading history...</p>
        </div>
      </div>
    );
  }

  // Convert NextAuth session to UserProfile
  const user = {
    id: session.user.email || "u1",
    name: session.user.name || "User",
    email: session.user.email || "user@example.com",
    picture: session.user.image || undefined,
    careerGoal: "",
    jobRole: "",
    experienceLevel: "",
    proficiency: "Intermediate" as any,
    isPro: false,
    scores: {} as any,
    history: [],
    learningPath: [],
    hrLearningPath: [],
    gdLearningPath: []
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 relative overflow-hidden">
      {/* Subtle radial glow */}
      <div className="absolute inset-0 bg-gradient-radial from-purple-900/10 via-transparent to-transparent" />
      <div className="absolute inset-0 bg-gradient-radial from-blue-900/5 via-transparent to-transparent" />

      <div className="relative z-10 max-w-7xl mx-auto p-4 md:p-8 lg:p-12">
        <HistoryView user={user} />
      </div>
    </div>
  );
};

export default HistoryPage;