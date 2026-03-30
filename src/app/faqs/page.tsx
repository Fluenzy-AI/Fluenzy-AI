"use client";

import { useState, useMemo } from "react";
import { motion } from "framer-motion";
import Link from "next/link";
import { ArrowLeft, MessageCircle, Mail } from "lucide-react";
import HelpSearchBar from "@/components/help/HelpSearchBar";
import AccordionItem from "@/components/help/AccordionItem";

// FAQ Categories
const faqCategories = [
  { id: "all", label: "All" },
  { id: "getting-started", label: "Getting Started" },
  { id: "interview-practice", label: "Interview Practice" },
  { id: "resume-ats", label: "Resume & ATS" },
  { id: "billing", label: "Billing" },
  { id: "account", label: "Account" },
  { id: "technical", label: "Technical" },
  { id: "hirelens", label: "HireLens" },
];

// FAQ Data
const faqData = {
  "getting-started": {
    title: "Getting Started",
    icon: "🚀",
    items: [
      {
        question: "What is Fluenzy AI?",
        answer: "Fluenzy AI is an AI-powered Career Operating System that helps candidates prepare for job interviews through live AI interview simulation, Group Discussion training, ATS resume analysis, English communication coaching, and behavioral analytics. It's designed for students, developers, and professionals aiming for top companies.",
      },
      {
        question: "Is Fluenzy AI free to use?",
        answer: "Yes! Fluenzy AI has a free plan that gives you access to core features including limited interview sessions, basic ATS analysis, and the English learning module. For unlimited access, advanced analytics, and all AI features, you can upgrade to Pro at ₹X/month.",
      },
      {
        question: "Which browsers are supported?",
        answer: "Fluenzy AI works best on Google Chrome (recommended), Microsoft Edge, and Firefox. Safari has limited support for real-time audio features. Always ensure your browser is updated to the latest version for the best experience.",
      },
      {
        question: "Do I need to install any software?",
        answer: "No installation required. Fluenzy AI runs entirely in your browser. You'll need to grant microphone and camera permissions for interview sessions. For the HireLens device, a one-time BLE pairing setup is needed.",
      },
    ],
  },
  "interview-practice": {
    title: "Interview Practice",
    icon: "🎙️",
    items: [
      {
        question: "How does the AI Interview work?",
        answer: "Once you start a session, the AI acts as a live interviewer — asking you questions based on your resume and chosen role. It listens to your voice, tracks your body language via camera, and analyzes your answer quality in real-time. After the session, you receive a full Analytics Report with scores across Communication, Confidence, Body Language, and Technical accuracy.",
      },
      {
        question: "What is the STAR method and how does Fluenzy score it?",
        answer: "STAR stands for Situation, Task, Action, and Result — a structured framework for answering behavioral questions. Fluenzy's NLP engine checks whether each part is present in your answer. If you skip the 'Result', the AI will prompt: 'Could you explain the quantitative impact of that action?' Your STAR completeness % appears in your post-session report.",
      },
      {
        question: "What is a Group Discussion (GD) session?",
        answer: "A GD session simulates a live group discussion with 4-8 AI agents, each playing a role: Initiator, Challenger, Info Provider, Analyzer, and Summarizer. You choose a topic, company (e.g. Google), and intensity (Calm to Aggressive). The AI tracks your contribution score, interruption handling, and leadership signals.",
      },
      {
        question: "How many interview sessions can I take per day?",
        answer: "Free plan users get 3 sessions per day. Pro plan users have unlimited sessions. Session limits reset at midnight IST. Your usage is visible on your Profile page under the Usage counter.",
      },
      {
        question: "Can I retake an interview on the same topic?",
        answer: "Yes. The AI dynamically generates new questions each session — even for the same job role or topic. No two sessions are identical, ensuring genuine practice rather than memorization.",
      },
    ],
  },
  "resume-ats": {
    title: "Resume & ATS",
    icon: "📄",
    items: [
      {
        question: "How do I upload my resume for ATS analysis?",
        answer: "Go to your Profile page → Resume section → click 'Choose File' to upload your PDF resume. The AI parses it within 2 seconds and generates an ATS Score Report covering Keyword Match, Skills Relevance, Experience Strength, Education Match, and Readability.",
      },
      {
        question: "What does my ATS score mean?",
        answer: "Your ATS score is a composite out of 100, calculated from: Keyword Match (24%), Skills Relevance (20%), Experience Strength (18%), Education Match (10%), and Readability (8%). A score above 75 is considered strong. Below 60 means your resume may be filtered out before a recruiter sees it.",
      },
      {
        question: "Why is my ATS score low even though I have experience?",
        answer: "ATS systems scan for specific keywords matching the job description. If you have the experience but haven't used the right terminology (e.g., writing 'NLP' instead of 'Natural Language Processing'), you'll score lower. Fluenzy's Gap Analysis shows you exactly which keywords are missing and suggests fixes.",
      },
    ],
  },
  billing: {
    title: "Billing & Subscription",
    icon: "💳",
    items: [
      {
        question: "How do I upgrade to Pro?",
        answer: "Go to Profile → Billing & Payments → click 'Upgrade to Pro'. Select your billing cycle (monthly/annual) and complete payment via Razorpay. Your Pro access activates instantly after successful payment.",
      },
      {
        question: "Will I be charged automatically every month?",
        answer: "Yes, Pro plan auto-renews on your billing date. You can cancel anytime from Profile → Billing → 'Cancel Subscription'. Cancellation takes effect at the end of your current billing period — you won't lose access until then.",
      },
      {
        question: "Can I get a refund?",
        answer: "We offer a 7-day refund policy for new Pro subscribers if you haven't used more than 3 interview sessions. Email support@fluenzy.ai with your registered email and reason for refund. Refunds are processed within 5-7 business days.",
      },
      {
        question: "Is there a student discount?",
        answer: "Yes! Students with a valid college email (.edu or institutional domain) get 40% off the Pro plan. Discount is applied at checkout automatically when you register with your college email address.",
      },
    ],
  },
  account: {
    title: "Account & Settings",
    icon: "⚙️",
    items: [
      {
        question: "How do I change my email address?",
        answer: "Go to Profile → Basic Information → update your email field → click 'Save Changes'. A verification email is sent to your new address. The change takes effect only after you verify the new email.",
      },
      {
        question: "How do I make my profile public?",
        answer: "In Profile → Public Profile section → toggle 'Profile Visible to Public' to ON. Your public URL is: https://www.fluenzyai.app/u/[your-username]. This shows your Practice Activity heatmap, skill scores, and verified certifications to recruiters.",
      },
      {
        question: "How do I delete my account?",
        answer: "Go to Settings → Account → 'Delete Account'. You'll be asked to confirm with your password. All your data including interview recordings, analytics, and resume data is permanently deleted within 30 days per our GDPR compliance policy.",
      },
    ],
  },
  technical: {
    title: "Technical Issues",
    icon: "🔧",
    items: [
      {
        question: "My camera is not working during the interview. What do I do?",
        answer: "First, check that your browser has camera permission (click the lock icon in the address bar → Permissions). If another app is using the camera, close it and refresh. Try Chrome if you're on another browser. If the issue persists, use the 'Audio-Only Mode' option at session start — body language analysis will be skipped but all other scores still work.",
      },
      {
        question: "The AI voice is not playing or I can't hear anything.",
        answer: "Check your system volume and browser audio permissions. Ensure no other app is blocking audio output. Try refreshing the page or using headphones. If you're on a corporate/college network, a firewall may be blocking WebSocket audio — try on a personal network or mobile hotspot.",
      },
      {
        question: "The interview freezes or lags during the session.",
        answer: "This can be caused by a slow internet connection (minimum 5 Mbps recommended), high CPU usage from other apps, or browser tab overload. Close unnecessary tabs, pause background downloads, and ensure your RAM usage isn't maxed. On slower connections, the system automatically reduces video quality to maintain AI analysis continuity.",
      },
    ],
  },
  hirelens: {
    title: "HireLens Device",
    icon: "📱",
    items: [
      {
        question: "What is Fluenzy AI HireLens?",
        answer: "HireLens is a physical wearable device — a smart collar mic — worn by the HR interviewer during in-person interviews. It captures the candidate's voice and facial expressions in real-time and sends AI-powered insights directly to the HR's laptop dashboard: confidence scores, behavioral signals, live transcript, and AI-suggested follow-up questions.",
      },
      {
        question: "How do I pair the HireLens device?",
        answer: "Power on the device (press the top button for 2 seconds until the LED turns blue). On your HR Dashboard, go to Devices → Pair New Device. Select your device from the BLE scan list and click 'Connect'. Pairing completes within 10 seconds.",
      },
      {
        question: "Is interview data stored from HireLens sessions?",
        answer: "Yes, session data is encrypted at the device (AES-256) before transmission and stored securely on Fluenzy servers. You can configure data retention periods (30/90/180 days) in your Organization Settings. Candidate consent is required and logged before every session begins.",
      },
    ],
  },
};

type CategoryId = keyof typeof faqData;

export default function FAQsPage() {
  const [activeCategory, setActiveCategory] = useState<string>("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [openItems, setOpenItems] = useState<Record<string, number | null>>({});

  // Toggle accordion item
  const toggleItem = (categoryId: string, index: number) => {
    setOpenItems((prev) => ({
      ...prev,
      [categoryId]: prev[categoryId] === index ? null : index,
    }));
  };

  // Filter FAQs based on search and category
  const filteredFaqs = useMemo(() => {
    const result: Record<string, typeof faqData[CategoryId]> = {};

    Object.entries(faqData).forEach(([key, category]) => {
      if (activeCategory !== "all" && key !== activeCategory) return;

      const filteredItems = category.items.filter(
        (item) =>
          searchQuery === "" ||
          item.question.toLowerCase().includes(searchQuery.toLowerCase()) ||
          item.answer.toLowerCase().includes(searchQuery.toLowerCase())
      );

      if (filteredItems.length > 0) {
        result[key] = { ...category, items: filteredItems };
      }
    });

    return result;
  }, [activeCategory, searchQuery]);

  // Search data for quick search
  const searchData = Object.entries(faqData).flatMap(([categoryId, category]) =>
    category.items.map((item, i) => ({
      id: `${categoryId}-${i}`,
      title: item.question,
      category: category.title,
      type: "faq" as const,
      url: `/faqs#${categoryId}`,
    }))
  );

  return (
    <div className="min-h-screen bg-[#0A0F1E]">
      {/* Hero Section */}
      <section className="relative overflow-hidden py-16 px-4">
        {/* Gradient blob background */}
        <div className="absolute inset-0 overflow-hidden">
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px]">
            <div className="absolute inset-0 bg-gradient-to-br from-purple-600/15 via-blue-600/10 to-transparent rounded-full blur-3xl" />
          </div>
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
            <span className="text-slate-400">FAQs</span>
          </motion.div>

          {/* Title */}
          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="text-3xl md:text-4xl lg:text-5xl font-bold text-white mb-4 font-syne"
          >
            Frequently Asked Questions
          </motion.h1>

          {/* Subtitle */}
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="text-lg text-slate-400 mb-8"
          >
            Quick answers to the most common questions about Fluenzy AI.
          </motion.p>

          {/* Search Bar */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
          >
            <HelpSearchBar
              placeholder="Search FAQs..."
              searchData={searchData}
              onSearch={setSearchQuery}
            />
          </motion.div>
        </div>
      </section>

      {/* Category Filter Tabs */}
      <section className="sticky top-0 z-40 bg-[#0A0F1E]/95 backdrop-blur-sm border-b border-[#1E293B]">
        <div className="max-w-4xl mx-auto px-4 py-4">
          <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide" role="tablist">
            {faqCategories.map((cat) => (
              <button
                key={cat.id}
                role="tab"
                aria-selected={activeCategory === cat.id}
                onClick={() => setActiveCategory(cat.id)}
                className={`px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-all duration-200 ${
                  activeCategory === cat.id
                    ? "bg-gradient-to-r from-purple-600 to-blue-600 text-white"
                    : "border border-[#1E293B] text-slate-400 hover:border-purple-500/50 hover:text-white"
                }`}
              >
                {cat.label}
              </button>
            ))}
          </div>
        </div>
      </section>

      {/* FAQ Accordion */}
      <section className="py-12 px-4">
        <div className="max-w-3xl mx-auto">
          {Object.entries(filteredFaqs).length === 0 ? (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="text-center py-16"
            >
              <div className="text-5xl mb-4">🔍</div>
              <h3 className="text-xl text-white mb-2">No results found</h3>
              <p className="text-slate-400">
                Try different keywords or browse all categories
              </p>
            </motion.div>
          ) : (
            Object.entries(filteredFaqs).map(([categoryId, category]) => (
              <motion.div
                key={categoryId}
                id={categoryId}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                className="mb-12"
              >
                {/* Category Header */}
                <div className="flex items-center gap-3 mb-6">
                  <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-purple-500 to-blue-500 
                                  flex items-center justify-center text-xl">
                    {category.icon}
                  </div>
                  <h2 className="text-xl font-bold text-white font-syne">
                    {category.title}
                  </h2>
                </div>

                {/* Accordion Items */}
                <div className="bg-[#0F172A] border border-[#1E293B] rounded-2xl overflow-hidden">
                  {category.items.map((item, i) => (
                    <AccordionItem
                      key={i}
                      question={item.question}
                      answer={item.answer}
                      isOpen={openItems[categoryId] === i}
                      onToggle={() => toggleItem(categoryId, i)}
                    />
                  ))}
                </div>
              </motion.div>
            ))
          )}
        </div>
      </section>

      {/* Still Have Questions Section */}
      <section className="py-20 px-4 bg-[#0F172A]/50">
        <div className="max-w-4xl mx-auto text-center">
          <motion.h2
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            className="text-2xl md:text-3xl font-bold text-white mb-3 font-syne"
          >
            Still have questions?
          </motion.h2>
          <motion.p
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            transition={{ delay: 0.1 }}
            className="text-slate-400 mb-4"
          >
            Our support team typically responds within 2 hours.
          </motion.p>

          {/* Back to Help Center */}
          <motion.div
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            transition={{ delay: 0.15 }}
            className="mb-10"
          >
            <Link
              href="/help"
              className="inline-flex items-center gap-2 text-purple-400 hover:text-purple-300 transition-colors"
            >
              <ArrowLeft className="w-4 h-4" />
              Browse full Help Center
            </Link>
          </motion.div>

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
