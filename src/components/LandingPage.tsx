"use client";
import AdvancedFeatures from "@/modules/advanced-features";
import Footer from "@/components/footer";
import Features from "@/modules/features";
import FeedbackSection from "@/modules/feedback";
import Hero from "@/modules/hero";
import Pricing from "@/modules/pricing";
import TrustSection from "@/modules/trust";
import TargetCompaniesRibbon from "@/modules/hero/TargetCompaniesRibbon";
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
      <FeedbackSection />
      <AdvancedFeatures />
      <Pricing />
    </div>
  );
};

export default LandingPage;