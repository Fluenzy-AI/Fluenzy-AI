"use client";
import AdvancedFeatures from "@/modules/advanced-features";
import AnalyticsIntelligence from "@/modules/analytics-intelligence";
import FinalCta from "@/modules/final-cta";
import Features from "@/modules/features";
import FeedbackSection from "@/modules/feedback";
import Hero from "@/modules/hero";
import InterviewGuideEngine from "@/modules/interview-guide-engine";
import PerformanceEvolution from "@/modules/performance-evolution";
import Pricing from "@/modules/pricing";
import ProFeatures from "@/modules/pro-features";
import TrustSection from "@/modules/trust";
import TrainingShowcase from "@/modules/hero/TrainingShowcase";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import React, { useEffect } from "react";

const LandingPage = () => {
  const { data: session } = useSession();
  const router = useRouter();

  useEffect(() => {
    if (session?.user) {
      router.push("/train");
    }
  }, [session, router]);

  // If user is logged in, don't render the landing page
  if (session?.user) {
    return null;
  }

  // If not logged in, show the full landing page
  return (
    <div>
      <Hero />
      <TrustSection />
      <TrainingShowcase />
      <Features />
      <AnalyticsIntelligence />
      <FeedbackSection />
      <InterviewGuideEngine />
      <AdvancedFeatures />
      <PerformanceEvolution />
      <ProFeatures />
      <Pricing />
      <FinalCta />
    </div>
  );
};

export default LandingPage;
