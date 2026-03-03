"use client";

import LearnEnglishWrapper from "@/modules/train/LearnEnglishWrapper";

export default function GDAIPageClient() {
  return (
    <div className="min-h-screen w-full">
      <LearnEnglishWrapper mode="gd" />
    </div>
  );
}
