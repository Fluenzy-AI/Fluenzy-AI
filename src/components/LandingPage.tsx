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
import CollegeCta from "@/modules/college-cta";
import MobileLandingPage from "@/components/MobileLandingPage";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import React, { useEffect, useState } from "react";

/** Returns true once we know the viewport is narrower than 641 px. */
function useMobileBreakpoint() {
  const [isMobile, setIsMobile] = useState<boolean | null>(null);

  useEffect(() => {
    const mq = window.matchMedia("(max-width: 640px)");
    setIsMobile(mq.matches);
    const handler = (e: MediaQueryListEvent) => setIsMobile(e.matches);
    mq.addEventListener("change", handler);
    return () => mq.removeEventListener("change", handler);
  }, []);

  return isMobile;
}

const LandingPage = () => {
  const { data: session } = useSession();
  const router = useRouter();
  const isMobile = useMobileBreakpoint();

  useEffect(() => {
    if (session?.user) {
      router.push("/train");
    }
  }, [session, router]);

  // If user is logged in, don't render the landing page
  if (session?.user) {
    return null;
  }

  // Avoid flash: wait until we know the viewport size
  if (isMobile === null) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-950">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-purple-500 border-t-transparent" />
      </div>
    );
  }

  // Mobile (< 641 px) → lightweight mobile-first page
  if (isMobile) {
    return <MobileLandingPage />;
  }

  // Desktop / tablet (≥ 641 px) → full landing page
  return (
    <div className="overflow-x-hidden">
      <Hero />
      <TrustSection />
      <CollegeCta />
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

