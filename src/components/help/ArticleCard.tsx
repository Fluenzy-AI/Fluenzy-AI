"use client";

import { motion } from "framer-motion";
import Link from "next/link";
import { ArrowRight } from "lucide-react";

interface Article {
  id: number;
  title: string;
  category: string;
  readTime: string;
  views: string;
  tag: "popular" | "fix" | "guide" | "billing";
}

interface ArticleCardProps {
  article: Article;
  index: number;
  isLast: boolean;
}

const tagColors = {
  popular: "bg-purple-500/20 text-purple-400",
  fix: "bg-red-500/20 text-red-400",
  guide: "bg-blue-500/20 text-blue-400",
  billing: "bg-green-500/20 text-green-400",
};

const categoryDots: Record<string, string> = {
  "Getting Started": "bg-emerald-500",
  "Resume & ATS": "bg-blue-500",
  "Technical Issues": "bg-red-500",
  "Interview Practice": "bg-purple-500",
  Billing: "bg-green-500",
};

export default function ArticleCard({ article, index, isLast }: ArticleCardProps) {
  return (
    <motion.div
      initial={{ opacity: 0, x: -20 }}
      whileInView={{ opacity: 1, x: 0 }}
      viewport={{ once: true }}
      transition={{ delay: index * 0.08, duration: 0.4 }}
    >
      <Link
        href={`/help/${article.id}`}
        className={`group flex items-center gap-4 py-4 px-2 hover:bg-purple-500/5 
                   transition-colors cursor-pointer ${
                     !isLast ? "border-b border-[#1E293B]" : ""
                   }`}
      >
        {/* Category dot */}
        <div
          className={`w-2 h-2 rounded-full ${
            categoryDots[article.category] || "bg-slate-500"
          }`}
        />

        {/* Content */}
        <div className="flex-1 min-w-0">
          <div className="text-white group-hover:text-purple-400 group-hover:underline transition-colors truncate">
            {article.title}
          </div>
          <div className="flex items-center gap-2 mt-1 text-xs text-slate-500">
            <span className={`px-2 py-0.5 rounded ${tagColors[article.tag]}`}>
              {article.category}
            </span>
            <span>{article.readTime}</span>
            <span>•</span>
            <span>{article.views}</span>
          </div>
        </div>

        {/* Arrow */}
        <ArrowRight
          className="w-5 h-5 text-slate-500 opacity-0 -translate-x-2 
                             group-hover:opacity-100 group-hover:translate-x-0 
                             transition-all duration-200"
        />
      </Link>
    </motion.div>
  );
}
