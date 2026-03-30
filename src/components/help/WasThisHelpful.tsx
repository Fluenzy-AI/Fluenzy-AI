"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { ThumbsUp, ThumbsDown, Check } from "lucide-react";

interface WasThisHelpfulProps {
  articleId: string;
}

export default function WasThisHelpful({ articleId }: WasThisHelpfulProps) {
  const [submitted, setSubmitted] = useState(false);
  const [isHelpful, setIsHelpful] = useState<boolean | null>(null);

  const handleFeedback = async (helpful: boolean) => {
    setIsHelpful(helpful);
    setSubmitted(true);
    
    // Log to analytics endpoint
    try {
      await fetch("/api/help/feedback", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ articleId, helpful }),
      });
    } catch (e) {
      // Silent fail for analytics
    }
  };

  if (submitted) {
    return (
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        className="flex items-center gap-2 text-sm text-emerald-400"
      >
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ type: "spring", bounce: 0.5 }}
        >
          <Check className="w-4 h-4" />
        </motion.div>
        <span>Thanks for your feedback!</span>
      </motion.div>
    );
  }

  return (
    <div className="flex items-center gap-3 text-sm text-slate-400">
      <span>Was this helpful?</span>
      <button
        onClick={() => handleFeedback(true)}
        className="flex items-center gap-1 px-3 py-1.5 rounded-lg border border-[#1E293B] 
                   hover:border-emerald-500/50 hover:text-emerald-400 transition-all"
      >
        <ThumbsUp className="w-4 h-4" />
        <span>Yes</span>
      </button>
      <button
        onClick={() => handleFeedback(false)}
        className="flex items-center gap-1 px-3 py-1.5 rounded-lg border border-[#1E293B] 
                   hover:border-red-500/50 hover:text-red-400 transition-all"
      >
        <ThumbsDown className="w-4 h-4" />
        <span>No</span>
      </button>
    </div>
  );
}
