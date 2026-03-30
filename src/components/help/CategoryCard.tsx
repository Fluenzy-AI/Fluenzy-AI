"use client";

import { motion } from "framer-motion";
import Link from "next/link";
import { ArrowRight } from "lucide-react";

interface CategoryCardProps {
  icon: string;
  title: string;
  description: string;
  articleCount: number;
  previewLinks: { title: string; href: string }[];
  href: string;
  index: number;
}

export default function CategoryCard({
  icon,
  title,
  description,
  articleCount,
  previewLinks,
  href,
  index,
}: CategoryCardProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 30 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ delay: index * 0.1, duration: 0.5 }}
      className="group p-6 bg-[#0F172A] border border-[#1E293B] rounded-2xl 
                 hover:border-purple-500/50 hover:shadow-[0_0_24px_rgba(124,58,237,0.12)]
                 hover:-translate-y-1 transition-all duration-300"
    >
      {/* Icon */}
      <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-purple-500 to-blue-500 
                      flex items-center justify-center text-2xl mb-4">
        {icon}
      </div>

      {/* Title & Description */}
      <h3 className="text-lg font-semibold text-white mb-1 font-syne">{title}</h3>
      <p className="text-sm text-slate-400 mb-3">{description}</p>

      {/* Article count */}
      <span className="inline-block px-2 py-1 text-xs bg-slate-800 text-slate-400 rounded mb-4">
        {articleCount} articles
      </span>

      {/* Preview links */}
      <div className="space-y-2 mb-4">
        {previewLinks.map((link, i) => (
          <Link
            key={i}
            href={link.href}
            className="block text-sm text-slate-400 hover:text-purple-400 hover:underline transition-colors"
          >
            → {link.title}
          </Link>
        ))}
      </div>

      {/* View all link */}
      <Link
        href={href}
        className="inline-flex items-center gap-1 text-sm text-purple-400 hover:text-purple-300 transition-colors"
      >
        View all {articleCount} articles
        <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
      </Link>
    </motion.div>
  );
}
