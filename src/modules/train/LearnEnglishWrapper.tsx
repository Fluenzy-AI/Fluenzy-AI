"use client";

import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import GDAgent from '../../../Learn_English/components/GDAgent';
import CompanyHRDashboard from '../../../Learn_English/components/CompanyHRDashboard';
import LearningPath from '../../../Learn_English/components/LearningPath';
import TechnicalMastery from '../../../Learn_English/components/TechnicalMastery';
import { UserProfile } from '../../../Learn_English/types';
import { INITIAL_USER } from '../../../Learn_English/constants';

interface LearnEnglishWrapperProps {
  mode: string;
}

const LearnEnglishWrapper: React.FC<LearnEnglishWrapperProps> = ({ mode }) => {
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

  const user: UserProfile = {
    ...INITIAL_USER,
    id: session.user.email || "u1",
    name: session.user.name || "User",
    email: session.user.email || "user@example.com",
    picture: session.user.image || undefined,
  };

  switch (mode) {
    case 'gd':
      return <GDAgent user={user} onSessionEnd={() => {}} />;
    case 'technical':
      return <TechnicalMastery />;
    case 'company':
      return <CompanyHRDashboard />;
    default:
      return <LearningPath />;
  }
};

export default LearnEnglishWrapper;