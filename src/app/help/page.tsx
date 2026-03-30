"use client";

import { motion } from "framer-motion";
import Link from "next/link";
import { MessageCircle, Mail, ArrowRight } from "lucide-react";
import HelpSearchBar from "@/components/help/HelpSearchBar";
import CategoryCard from "@/components/help/CategoryCard";
import ArticleCard from "@/components/help/ArticleCard";

// Search data for filtering
const searchData = [
  { id: "1", title: "How to create your account", category: "Getting Started", type: "article" as const, url: "/help/1" },
  { id: "2", title: "How to start a Live Interview session", category: "Interview Practice", type: "article" as const, url: "/help/2" },
  { id: "3", title: "Understanding your ATS score", category: "Resume & ATS", type: "article" as const, url: "/help/3" },
  { id: "4", title: "How to upgrade to Pro", category: "Billing", type: "article" as const, url: "/help/4" },
  { id: "5", title: "Camera not working in interview", category: "Technical Issues", type: "article" as const, url: "/help/5" },
  { id: "6", title: "Changing your email/password", category: "Account & Settings", type: "article" as const, url: "/help/6" },
  { id: "7", title: "What is Fluenzy AI?", category: "Getting Started", type: "faq" as const, url: "/faqs#getting-started" },
  { id: "8", title: "How does the AI Interview work?", category: "Interview Practice", type: "faq" as const, url: "/faqs#interview-practice" },
  { id: "9", title: "What does my ATS score mean?", category: "Resume & ATS", type: "faq" as const, url: "/faqs#resume-ats" },
];

// Quick links
const quickLinks = [
  { label: "Getting Started", href: "/help#getting-started" },
  { label: "Billing", href: "/help#billing" },
  { label: "Interview Tips", href: "/help#interview-practice" },
  { label: "Technical Issues", href: "/help#technical-issues" },
  { label: "Account Settings", href: "/help#account-settings" },
  { label: "Resume ATS", href: "/help#resume-ats" },
];

// Categories data
const categories = [
  {
    icon: "🚀",
    title: "Getting Started",
    description: "New to Fluenzy AI? Start here.",
    articleCount: 8,
    previewLinks: [
      { title: "How to create your account", href: "/help/create-account" },
      { title: "Setting up your profile", href: "/help/setup-profile" },
      { title: "Taking your first interview", href: "/help/first-interview" },
    ],
    href: "/help/category/getting-started",
  },
  {
    icon: "🎙️",
    title: "Interview Practice",
    description: "Master HR, Technical & GD sessions.",
    articleCount: 12,
    previewLinks: [
      { title: "How to start a Live Interview session", href: "/help/live-interview" },
      { title: "Understanding your Analytics Report", href: "/help/analytics-report" },
      { title: "What is the STAR method in HR mode?", href: "/help/star-method" },
    ],
    href: "/help/category/interview-practice",
  },
  {
    icon: "📄",
    title: "Resume & ATS",
    description: "Optimize your resume. Beat the filters.",
    articleCount: 7,
    previewLinks: [
      { title: "How to upload your resume", href: "/help/upload-resume" },
      { title: "Understanding your ATS score", href: "/help/ats-score" },
      { title: "Fixing low keyword match score", href: "/help/keyword-match" },
    ],
    href: "/help/category/resume-ats",
  },
  {
    icon: "💳",
    title: "Billing & Subscription",
    description: "Plans, payments, and renewals.",
    articleCount: 9,
    previewLinks: [
      { title: "How to upgrade to Pro", href: "/help/upgrade-pro" },
      { title: "Cancel or pause subscription", href: "/help/cancel-subscription" },
      { title: "Invoice and billing history", href: "/help/billing-history" },
    ],
    href: "/help/category/billing",
  },
  {
    icon: "⚙️",
    title: "Account & Settings",
    description: "Manage your profile and preferences.",
    articleCount: 6,
    previewLinks: [
      { title: "Changing your email/password", href: "/help/change-credentials" },
      { title: "Managing notification settings", href: "/help/notifications" },
      { title: "Deleting your account", href: "/help/delete-account" },
    ],
    href: "/help/category/account-settings",
  },
  {
    icon: "🔧",
    title: "Technical Issues",
    description: "Camera, mic, and platform bugs.",
    articleCount: 10,
    previewLinks: [
      { title: "Camera not working in interview", href: "/help/camera-issues" },
      { title: "Audio issues during session", href: "/help/audio-issues" },
      { title: "Browser compatibility guide", href: "/help/browser-compatibility" },
    ],
    href: "/help/category/technical-issues",
  },
];

// Popular articles
const popularArticles = [
  {
    id: 1,
    title: "How to start your first AI Interview session",
    category: "Getting Started",
    readTime: "3 min read",
    views: "12.4k views",
    tag: "popular" as const,
  },
  {
    id: 2,
    title: "Understanding your ATS Resume Score",
    category: "Resume & ATS",
    readTime: "5 min read",
    views: "9.1k views",
    tag: "popular" as const,
  },
  {
    id: 3,
    title: "Camera and microphone setup guide",
    category: "Technical Issues",
    readTime: "4 min read",
    views: "8.7k views",
    tag: "fix" as const,
  },
  {
    id: 4,
    title: "How the STAR method scoring works",
    category: "Interview Practice",
    readTime: "6 min read",
    views: "7.2k views",
    tag: "guide" as const,
  },
  {
    id: 5,
    title: "Upgrading from Free to Pro plan",
    category: "Billing",
    readTime: "2 min read",
    views: "6.8k views",
    tag: "billing" as const,
  },
  {
    id: 6,
    title: "How Group Discussion scoring works",
    category: "Interview Practice",
    readTime: "7 min read",
    views: "5.9k views",
    tag: "guide" as const,
  },
];

export default function HelpPage() {
  return (
    <div className="min-h-screen bg-[#0A0F1E]">
      {/* Hero Section */}
      <section className="relative overflow-hidden py-20 px-4">
        {/* Gradient blob background */}
        <div className="absolute inset-0 overflow-hidden">
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px]">
            <div className="absolute inset-0 bg-gradient-to-br from-purple-600/20 via-blue-600/10 to-transparent rounded-full blur-3xl animate-pulse" />
          </div>
          {/* Noise overlay */}
          <div 
            className="absolute inset-0 opacity-[0.03]"
            style={{
              backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.65' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)'/%3E%3C/svg%3E")`,
            }}
          />
        </div>

        <div className="relative max-w-4xl mx-auto text-center">
          {/* Breadcrumb */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="text-sm text-slate-500 mb-6"
          >
            <Link href="/" className="hover:text-slate-400 transition-colors">
              Home
            </Link>
            <span className="mx-2">›</span>
            <span className="text-slate-400">Help Center</span>
          </motion.div>

          {/* Badge */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-purple-500/10 
                       border border-purple-500/20 text-purple-400 text-sm mb-6"
          >
            📚 Help Center
          </motion.div>

          {/* Title */}
          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="text-4xl md:text-5xl lg:text-6xl font-bold text-white mb-4 font-syne"
          >
            How can we help you?
          </motion.h1>

          {/* Subtitle */}
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="text-lg text-slate-400 mb-10"
          >
            Search our knowledge base or browse categories below.
          </motion.p>

          {/* Search Bar */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
          >
            <HelpSearchBar searchData={searchData} quickLinks={quickLinks} />
          </motion.div>
        </div>
      </section>

      {/* Category Grid Section */}
      <section className="py-16 px-4">
        <div className="max-w-6xl mx-auto">
          <motion.h2
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            className="text-2xl font-bold text-white mb-8 font-syne"
          >
            Browse by Category
          </motion.h2>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {categories.map((category, i) => (
              <CategoryCard
                key={category.title}
                icon={category.icon}
                title={category.title}
                description={category.description}
                articleCount={category.articleCount}
                previewLinks={category.previewLinks}
                href={category.href}
                index={i}
              />
            ))}
          </div>
        </div>
      </section>

      {/* Popular Articles Section */}
      <section className="py-16 px-4 bg-[#0F172A]/50">
        <div className="max-w-3xl mx-auto">
          <motion.div
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            className="flex items-center gap-2 mb-8"
          >
            <span className="text-2xl">📈</span>
            <h2 className="text-2xl font-bold text-white font-syne">Popular Articles</h2>
          </motion.div>

          <div className="bg-[#0F172A] border border-[#1E293B] rounded-2xl overflow-hidden">
            {popularArticles.map((article, i) => (
              <ArticleCard
                key={article.id}
                article={article}
                index={i}
                isLast={i === popularArticles.length - 1}
              />
            ))}
          </div>

          {/* View all link */}
          <motion.div
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            className="text-center mt-6"
          >
            <Link
              href="/faqs"
              className="inline-flex items-center gap-2 text-purple-400 hover:text-purple-300 transition-colors"
            >
              View all FAQs
              <ArrowRight className="w-4 h-4" />
            </Link>
          </motion.div>
        </div>
      </section>

      {/* Still Need Help Section */}
      <section className="py-20 px-4">
        <div className="max-w-4xl mx-auto text-center">
          <motion.h2
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            className="text-2xl md:text-3xl font-bold text-white mb-3 font-syne"
          >
            Still need help?
          </motion.h2>
          <motion.p
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            transition={{ delay: 0.1 }}
            className="text-slate-400 mb-10"
          >
            Our support team typically responds within 2 hours.
          </motion.p>

          <div className="grid md:grid-cols-2 gap-6">
            {/* Live Chat Card */}
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.2 }}
              className="p-8 bg-[#0F172A] border border-[#1E293B] rounded-2xl text-center
                         hover:border-purple-500/50 hover:shadow-[0_0_24px_rgba(124,58,237,0.12)]
                         transition-all duration-300"
            >
              <div className="w-14 h-14 mx-auto rounded-xl bg-gradient-to-br from-purple-500 to-blue-500 
                              flex items-center justify-center text-2xl mb-4">
                💬
              </div>
              <h3 className="text-xl font-semibold text-white mb-2 font-syne">Live Chat</h3>
              <p className="text-sm text-slate-400 mb-4">
                Chat with our support team in real-time
              </p>
              <div className="flex items-center justify-center gap-2 text-sm text-emerald-400 mb-6">
                <span className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse" />
                Online — Avg. response: 5 min
              </div>
              <button className="w-full py-3 px-6 rounded-xl bg-gradient-to-r from-purple-600 to-blue-600 
                                 text-white font-medium hover:opacity-90 transition-opacity">
                Start Chat
              </button>
            </motion.div>

            {/* Email Support Card */}
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.3 }}
              className="p-8 bg-[#0F172A] border border-[#1E293B] rounded-2xl text-center
                         hover:border-purple-500/50 hover:shadow-[0_0_24px_rgba(124,58,237,0.12)]
                         transition-all duration-300"
            >
              <div className="w-14 h-14 mx-auto rounded-xl bg-gradient-to-br from-purple-500/20 to-blue-500/20 
                              border border-purple-500/30 flex items-center justify-center text-2xl mb-4">
                📧
              </div>
              <h3 className="text-xl font-semibold text-white mb-2 font-syne">Email Support</h3>
              <p className="text-sm text-slate-400 mb-2">
                Send us a detailed message
              </p>
              <a 
                href="mailto:support@fluenzy.ai" 
                className="text-purple-400 hover:text-purple-300 transition-colors text-sm"
              >
                support@fluenzy.ai
              </a>
              <p className="text-sm text-slate-500 mt-2 mb-6">
                Avg. response: &lt; 2 hours
              </p>
              <a 
                href="mailto:support@fluenzy.ai"
                className="inline-block w-full py-3 px-6 rounded-xl border border-[#1E293B] 
                           text-white font-medium hover:border-purple-500/50 hover:bg-purple-500/5 
                           transition-all"
              >
                Send Email
              </a>
            </motion.div>
          </div>
        </div>
      </section>
    </div>
  );
}
