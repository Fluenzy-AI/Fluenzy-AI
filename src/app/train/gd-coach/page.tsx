"use client";

import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import GDCoachDashboard from "../../../../Learn_English/components/GDCoachDashboard";
import { UserProfile } from "../../../../Learn_English/types";
import { INITIAL_USER } from "../../../../Learn_English/constants";

const GDCoachPage = () => {
  const { data: session, status } = useSession();
  const router = useRouter();

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/");
    }
  }, [status, router]);

  if (status === "loading") {
    return <div>Loading...</div>;
  }

  if (!session?.user) {
    return null;
  }

  // Convert NextAuth session to UserProfile
  const user: UserProfile = {
    ...INITIAL_USER,
    id: session.user.email || "u1",
    name: session.user.name || "User",
    email: session.user.email || "user@example.com",
    picture: session.user.image || undefined,
  };

  return (
    <div className="bg-slate-900/30 backdrop-blur-xl rounded-3xl border border-slate-700/50 shadow-2xl p-6 md:p-8 lg:p-12">
      <GDCoachDashboard user={user} />
    </div>
  );
};

export default GDCoachPage;
