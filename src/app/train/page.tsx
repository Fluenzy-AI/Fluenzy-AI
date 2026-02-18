"use client";

import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import LearningPath from "../../../Learn_English/components/LearningPath";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import Link from "next/link";
import { Crown, Star, Zap } from "lucide-react";

interface PlanInfo {
  plan: string;
  planName: string;
  price: number;
  isUnlimited: boolean;
}

const TrainPage = () => {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [planInfo, setPlanInfo] = useState<PlanInfo | null>(null);

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/");
    }
  }, [status, router]);

  useEffect(() => {
    const fetchPlanInfo = async () => {
      try {
        const response = await fetch("/api/user-plan");
        if (response.ok) {
          const data = await response.json();
          setPlanInfo(data);
        }
      } catch (error) {
        console.error("Error fetching plan info:", error);
      }
    };

    if (session?.user) {
      fetchPlanInfo();
    }
  }, [session]);

  const getCTAInfo = () => {
    if (!planInfo) return null;

    const currentPlan = planInfo.plan;

    if (currentPlan === 'Free') {
      return {
        text: "Upgrade Plan",
        href: "/billing",
        icon: Star,
        description: "Unlock unlimited training sessions"
      };
    }

    if (currentPlan === 'Pro') {
      return {
        text: "Upgrade to Standard",
        href: "/billing",
        icon: Crown,
        description: "Get unlimited access for ₹150/month"
      };
    }

    if (currentPlan === 'Standard') {
      return {
        text: "Manage Subscription",
        href: "/billing",
        icon: Crown,
        description: "You're on the highest plan!"
      };
    }

    return null;
  };

  if (status === "loading") {
    return <div>Loading...</div>;
  }

  if (!session?.user) {
    return null;
  }

  const ctaInfo = getCTAInfo();

  return (
    <div className="space-y-6">
      <div className="py-8">
        <LearningPath ctaInfo={ctaInfo} />
      </div>
    </div>
  );
};

export default TrainPage;