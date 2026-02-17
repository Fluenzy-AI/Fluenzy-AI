import type { Metadata } from "next";
import Features from "@/modules/features";
import Footer from "@/components/footer";
import HeaderOffset from "@/components/HeaderOffset";

export const metadata: Metadata = {
  title: "FluenzyAI Features: AI Interview & English Training",
  description: "Explore FluenzyAI's comprehensive features for AI-powered interview preparation and English fluency. Master HR interviews, technical questions, group discussions, and spoken English with advanced AI coaching.",
  keywords: "AI interview practice, mock interview AI, group discussion AI, English speaking practice with AI, HR interview preparation, technical interview practice",
  alternates: {
    canonical: "https://www.fluenzyai.app/features",
  },
  openGraph: {
    title: "FluenzyAI Features: AI Interview & English Training",
    description: "Explore FluenzyAI's comprehensive features for AI-powered interview preparation and English fluency.",
    url: "https://www.fluenzyai.app/features",
    type: "website",
    images: [
      {
        url: "https://www.fluenzyai.app/og-image.jpg",
        width: 1200,
        height: 630,
        alt: "FluenzyAI Features",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "FluenzyAI Features: AI Interview & English Training",
    description: "Explore FluenzyAI's comprehensive features for AI-powered interview preparation and English fluency.",
    images: ["https://www.fluenzyai.app/og-image.jpg"],
  },
};

export default function FeaturesPage() {
  return (
    <div className="min-h-screen">
      <HeaderOffset />
      {/* Hero Section - Premium */}
      <section className="relative pt-6 pb-12 overflow-hidden bg-gradient-to-b from-slate-900 via-slate-900 to-slate-800">
        {/* Animated background elements */}
        <div className="absolute inset-0">
          <div className="absolute top-10 left-1/4 w-72 h-72 bg-blue-600/10 rounded-full blur-[100px] animate-pulse" />
          <div className="absolute bottom-10 right-1/4 w-80 h-80 bg-violet-600/10 rounded-full blur-[100px] animate-pulse" style={{ animationDelay: '1s' }} />
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-48 bg-cyan-500/5 rounded-full blur-[80px]" />
        </div>
        
        <div className="container mx-auto px-4 relative z-10">
          {/* Badge */}
          <div className="flex justify-center mb-6">
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-white/5 border border-white/10 backdrop-blur-sm">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              <span className="text-xs font-semibold text-slate-300 tracking-wide uppercase">Powered by AI</span>
            </div>
          </div>
          
          <h1 className="text-4xl lg:text-6xl font-black text-center mb-5 leading-tight">
            <span className="text-white">Everything you need to </span>
            <br className="hidden lg:block" />
            <span className="bg-gradient-to-r from-blue-400 via-violet-400 to-cyan-400 !bg-clip-text text-transparent">
              ace your interviews
            </span>
          </h1>
          <p className="text-base lg:text-lg text-slate-400 text-center max-w-3xl mx-auto leading-relaxed mb-8">
            From interview mastery to English fluency — our advanced AI modules deliver personalized training paths that adapt to your learning style and help you build lasting confidence.
          </p>
          
          {/* Stats strip */}
          <div className="flex flex-wrap justify-center gap-6 lg:gap-10">
            {[
              { value: "6+", label: "AI Modules" },
              { value: "10K+", label: "Questions" },
              { value: "98%", label: "Success Rate" },
              { value: "24/7", label: "AI Available" },
            ].map((stat) => (
              <div key={stat.label} className="text-center">
                <div className="text-2xl lg:text-3xl font-black text-white">{stat.value}</div>
                <div className="text-xs text-slate-500 font-medium mt-0.5">{stat.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>
      
      <div className="relative">
        <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-slate-700 to-transparent"></div>
        <Features />
      </div>
      <section className="relative overflow-hidden bg-slate-950 text-slate-200">
        <div className="absolute inset-0 bg-gradient-to-b from-slate-900/40 via-slate-950 to-slate-950" />
        <div className="container mx-auto px-4 py-16 space-y-14 relative z-10">
          <nav aria-label="Breadcrumb" className="text-sm text-slate-500">
            <ol className="flex flex-wrap gap-2 items-center">
              <li>
                <a href="/" className="hover:text-slate-300 transition-colors">Home</a>
              </li>
              <li aria-hidden="true" className="text-slate-700">/</li>
              <li className="text-slate-300">Features</li>
            </ol>
          </nav>

          <div className="space-y-5 max-w-4xl">
            <p className="text-xs uppercase tracking-[0.3em] text-blue-400 font-semibold">Feature Overview</p>
            <h2 className="text-3xl md:text-4xl font-bold text-white leading-snug">An AI Interview Coach built for real-world practice</h2>
            <p className="text-base leading-relaxed text-slate-400">
              FluenzyAI combines an AI Interview Preparation Platform with structured English speaking practice so candidates can
              improve both content and delivery. Each feature module supports a specific interview stage, from HR interview preparation
              and behavioral storytelling to technical interview training for coding, system design, and role-specific knowledge.
            </p>
          </div>

          <div className="grid gap-5 md:grid-cols-2">
            <div className="rounded-2xl border border-white/[0.06] bg-gradient-to-br from-slate-900/80 to-slate-800/40 backdrop-blur-sm p-7 transition-all duration-300 hover:-translate-y-1 hover:border-white/15 hover:shadow-xl hover:shadow-blue-500/5 group">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-500 to-cyan-500 flex items-center justify-center">
                  <svg className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" /></svg>
                </div>
                <h3 className="text-lg font-bold text-white">Mock interviews that feel real</h3>
              </div>
              <p className="text-sm leading-relaxed text-slate-400 group-hover:text-slate-300 transition-colors">
                The mock interviews with AI simulate realistic conversation flow so you can practice concise answers, stronger structure,
                and calm pacing. The English speaking practice with AI emphasizes pronunciation, grammar clarity, and vocabulary choice,
                while the HR interview preparation modules help you refine leadership stories and career motivation narratives.
              </p>
            </div>
            <div className="rounded-2xl border border-white/[0.06] bg-gradient-to-br from-slate-900/80 to-slate-800/40 backdrop-blur-sm p-7 transition-all duration-300 hover:-translate-y-1 hover:border-white/15 hover:shadow-xl hover:shadow-violet-500/5 group">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-violet-500 to-purple-500 flex items-center justify-center">
                  <svg className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M13 10V3L4 14h7v7l9-11h-7z" /></svg>
                </div>
                <h3 className="text-lg font-bold text-white">Adaptive and personalized</h3>
              </div>
              <p className="text-sm leading-relaxed text-slate-400 group-hover:text-slate-300 transition-colors">
                FluenzyAI adapts to your skill level and learning pace, providing progressively challenging content. Move between 
                feature details, pricing, and training without friction. This layered approach makes FluenzyAI useful for entry-level roles 
                and advanced FAANG interview practice alike.
              </p>
            </div>
          </div>

          {/* CTA Buttons */}
          <div className="flex flex-wrap gap-3">
            <a href="/train" className="group inline-flex items-center gap-2 rounded-full bg-gradient-to-r from-blue-500 to-cyan-500 px-6 py-3 text-sm font-bold text-white shadow-lg shadow-blue-500/25 hover:shadow-blue-500/40 transition-all duration-300 hover:scale-105">
              Start Training
              <svg className="w-4 h-4 group-hover:translate-x-1 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}><path strokeLinecap="round" strokeLinejoin="round" d="M13 7l5 5m0 0l-5 5m5-5H6" /></svg>
            </a>
            <a href="/pricing" className="rounded-full border border-white/10 bg-white/5 backdrop-blur-sm px-6 py-3 text-sm font-semibold text-slate-200 transition-all hover:border-white/25 hover:bg-white/10">
              Compare Plans
            </a>
          </div>

          {/* FAQ Section */}
          <div className="space-y-6">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-amber-500 to-orange-500 flex items-center justify-center">
                <svg className="w-4 h-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
              </div>
              <h2 className="text-2xl font-bold text-white">Frequently Asked Questions</h2>
            </div>
            <div className="space-y-3">
              {[
                {
                  q: "What makes FluenzyAI different from other interview platforms?",
                  a: "FluenzyAI blends mock interviews with AI, English speaking practice, and HR interview preparation into one workflow, so you can improve both content and delivery instead of practicing in silos.",
                },
                {
                  q: "Does FluenzyAI support technical interview training?",
                  a: "Yes. The technical module covers coding prompts, system design thinking, and follow-up questions that mirror FAANG interview practice formats.",
                },
                {
                  q: "Can I use the platform for HR interview preparation?",
                  a: "The HR interview preparation tracks focus on storytelling, situational judgment, and communication clarity with targeted feedback and improvement tips.",
                },
                {
                  q: "How do the modules improve English fluency?",
                  a: "You receive grammar feedback, vocabulary suggestions, and pacing insights through English speaking practice with AI that mirrors real interview scenarios.",
                },
              ].map((item) => (
                <details key={item.q} className="group rounded-xl border border-white/[0.06] bg-gradient-to-br from-slate-900/60 to-slate-800/30 backdrop-blur-sm overflow-hidden transition-all duration-300 hover:border-white/15">
                  <summary className="cursor-pointer px-6 py-4 text-sm font-semibold text-slate-200 flex items-center justify-between gap-4 select-none">
                    {item.q}
                    <svg className="w-4 h-4 text-slate-500 group-open:rotate-180 transition-transform duration-300 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" /></svg>
                  </summary>
                  <p className="px-6 pb-5 text-sm leading-relaxed text-slate-400">{item.a}</p>
                </details>
              ))}
            </div>
          </div>
        </div>
      </section>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            "@context": "https://schema.org",
            "@type": "FAQPage",
            "mainEntity": [
              {
                "@type": "Question",
                "name": "What makes FluenzyAI different from other interview platforms?",
                "acceptedAnswer": {
                  "@type": "Answer",
                  "text": "FluenzyAI blends mock interviews with AI, English speaking practice, and HR interview preparation into one workflow, so you can improve both content and delivery instead of practicing in silos."
                }
              },
              {
                "@type": "Question",
                "name": "Does FluenzyAI support technical interview training?",
                "acceptedAnswer": {
                  "@type": "Answer",
                  "text": "Yes. The technical module covers coding prompts, system design thinking, and follow-up questions that mirror FAANG interview practice formats."
                }
              },
              {
                "@type": "Question",
                "name": "Can I use the platform for HR interview preparation?",
                "acceptedAnswer": {
                  "@type": "Answer",
                  "text": "The HR interview preparation tracks focus on storytelling, situational judgment, and communication clarity with targeted feedback and improvement tips."
                }
              },
              {
                "@type": "Question",
                "name": "How do the modules improve English fluency?",
                "acceptedAnswer": {
                  "@type": "Answer",
                  "text": "You receive grammar feedback, vocabulary suggestions, and pacing insights through English speaking practice with AI that mirrors real interview scenarios."
                }
              }
            ]
          })
        }}
      />
      <Footer />
    </div>
  );
}