'use client';

import LearnEnglishWrapper from "@/modules/train/LearnEnglishWrapper";
import Footer from "@/components/footer";
import Link from "next/link";
import { ArrowLeft, Bot } from "lucide-react";

export default function GDAIPage() {
  return (
    <div className="min-h-screen bg-slate-900 text-white">
      {/* Back Button */}
      <div className="p-4 md:p-6">
        <Link
          href="/train/gd"
          className="inline-flex items-center gap-2 text-gray-400 hover:text-white transition-colors bg-slate-800/50 hover:bg-slate-800 px-4 py-2 rounded-lg"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to GD Modes</span>
        </Link>
      </div>
      
      <LearnEnglishWrapper mode="gd" />
      <Footer />
    </div>
  );
}
