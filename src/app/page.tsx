import type { Metadata } from "next";
import LandingPage from "@/components/LandingPage";
import { Compass, Sparkles, Target } from "lucide-react";

export const metadata: Metadata = {
  title: "FluenzyAI: AI Interview Coach & English Practice",
  description: "Enhance your interview skills and English fluency with FluenzyAI's AI-powered platform. Practice HR interviews, technical questions, and group discussions for career success.",
  keywords: "AI interview practice, AI interview coach, English speaking practice with AI, mock interview AI, group discussion AI",
  alternates: {
    canonical: "https://www.fluenzyai.app/",
  },
  openGraph: {
    title: "FluenzyAI: AI Interview Coach & English Practice",
    description: "Enhance your interview skills and English fluency with FluenzyAI's AI-powered platform.",
    url: "https://www.fluenzyai.app",
    type: "website",
    images: [
      {
        url: "https://www.fluenzyai.app/og-image.jpg",
        width: 1200,
        height: 630,
        alt: "FluenzyAI - AI Interview Preparation Platform",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "FluenzyAI: AI Interview Coach & English Practice",
    description: "Enhance your interview skills and English fluency with FluenzyAI's AI-powered platform.",
    images: ["https://www.fluenzyai.app/og-image.jpg"],
  },
};

export default function Page() {
  return (
    <>
      <LandingPage />
      <section className="relative overflow-hidden bg-slate-950 text-slate-200">
        <div className="absolute inset-0 bg-gradient-to-b from-slate-900/40 via-slate-950 to-slate-950" />
        <div className="absolute -top-24 right-0 h-72 w-72 rounded-full bg-purple-500/10 blur-3xl" />
        <div className="absolute bottom-0 left-0 h-72 w-72 rounded-full bg-cyan-500/10 blur-3xl" />
        <div className="container mx-auto px-4 py-16 space-y-12 relative z-10">
          <nav aria-label="Breadcrumb" className="text-sm text-slate-400">
            <ol className="flex flex-wrap gap-2">
              <li>
                <a href="/" className="hover:text-slate-200">Home</a>
              </li>
              <li aria-hidden="true">/</li>
              <li className="text-slate-300">AI Interview Preparation Platform</li>
            </ol>
          </nav>

          <div className="grid gap-10 lg:grid-cols-[1.1fr_0.9fr] items-center">
            <div className="space-y-5 max-w-4xl">
              <p className="text-xs uppercase tracking-[0.25em] text-slate-400">AI Interview Preparation Platform</p>
              <h2 className="text-3xl md:text-5xl font-semibold text-white">
                FluenzyAI is an AI Interview Preparation Platform built for real hiring outcomes
              </h2>
              <p className="text-base leading-relaxed text-slate-300 max-w-3xl">
                FluenzyAI is a modern <span className="text-cyan-300">AI Interview Coach</span> for candidates who want structured, measurable growth in interviews.
                The platform combines <span className="text-purple-300">mock interviews with AI</span>, targeted HR interview preparation, and technical interview training
                in a single workflow. Instead of generic practice, FluenzyAI adapts each session to your role, experience level,
                and target companies so you can move from practice to performance. Whether you are aiming for <span className="text-emerald-300">FAANG interview practice</span>
                or preparing for your next startup role, the system provides realistic prompts, immediate feedback, and a measurable
                improvement path.
              </p>
              <div className="flex flex-wrap gap-3">
                <a
                  href="/login"
                  className="rounded-full bg-gradient-to-r from-purple-500 to-cyan-400 px-5 py-2.5 text-sm font-semibold text-slate-950 shadow-lg shadow-purple-500/30 transition hover:shadow-purple-500/50"
                >
                  Start Training
                </a>
                <a
                  href="/blog/prepare-for-faang-interviews-with-ai"
                  className="rounded-full border border-slate-700 px-5 py-2.5 text-sm font-semibold text-slate-200 transition hover:border-slate-400"
                >
                  Read Guide
                </a>
                <a
                  href="/pricing"
                  className="rounded-full border border-slate-700 px-5 py-2.5 text-sm font-semibold text-slate-200 transition hover:border-slate-400"
                >
                  View Pricing
                </a>
              </div>
            </div>
            <div className="relative hidden lg:block">
              <div className="rounded-3xl border border-slate-800/60 bg-gradient-to-br from-slate-900/70 via-slate-900/40 to-slate-800/40 p-8 shadow-2xl">
                <div className="space-y-6">
                  <div className="h-2 w-16 rounded-full bg-gradient-to-r from-purple-400 to-cyan-400" />
                  <p className="text-sm text-slate-300 leading-relaxed">
                    A premium AI interview workflow designed for clarity, confidence, and technical depth.
                  </p>
                  <div className="grid gap-4">
                    {[
                      "AI Interview Coach",
                      "Mock Interviews",
                      "FAANG Readiness",
                    ].map((item) => (
                      <div key={item} className="rounded-2xl border border-slate-800/70 bg-slate-900/60 px-4 py-3 text-sm text-slate-200">
                        {item}
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="h-px bg-gradient-to-r from-transparent via-slate-800 to-transparent" />

          <div className="grid gap-6 md:grid-cols-3">
            <div className="rounded-2xl border border-slate-800/70 bg-slate-900/60 p-6 shadow-lg transition hover:-translate-y-1 hover:shadow-purple-500/10">
              <p className="text-xs uppercase tracking-[0.2em] text-slate-400">Why it matters</p>
              <div className="mt-4 flex items-center gap-3">
                <span className="flex h-9 w-9 items-center justify-center rounded-full bg-purple-500/10 text-purple-300">
                  <Sparkles className="h-4 w-4" />
                </span>
                <h3 className="text-lg font-semibold text-white">AI interview preparation that drives outcomes</h3>
              </div>
              <p className="mt-3 text-sm leading-relaxed text-slate-300">
                FluenzyAI is a modern AI Interview Coach for candidates who want structured, measurable growth in interviews.
              </p>
              <details className="group mt-4">
                <summary className="cursor-pointer text-sm font-semibold text-slate-200">Read full context</summary>
                <p className="mt-3 text-sm leading-relaxed text-slate-300">
                  The platform combines mock interviews with AI, targeted HR interview preparation, and technical interview training
                  in a single workflow. Instead of generic practice, FluenzyAI adapts each session to your role, experience level,
                  and target companies so you can move from practice to performance. Whether you are aiming for FAANG interview practice
                  or preparing for your next startup role, the system provides realistic prompts, immediate feedback, and a measurable
                  improvement path.
                </p>
              </details>
            </div>
            <div className="rounded-2xl border border-slate-800/70 bg-slate-900/60 p-6 shadow-lg transition hover:-translate-y-1 hover:shadow-purple-500/10">
              <p className="text-xs uppercase tracking-[0.2em] text-slate-400">How FluenzyAI helps</p>
              <div className="mt-4 flex items-center gap-3">
                <span className="flex h-9 w-9 items-center justify-center rounded-full bg-cyan-500/10 text-cyan-300">
                  <Target className="h-4 w-4" />
                </span>
                <h3 className="text-lg font-semibold text-white">Communication and technical depth together</h3>
              </div>
              <p className="mt-3 text-sm leading-relaxed text-slate-300">
                Each session blends spoken English evaluation with interview scoring to improve clarity, confidence, and structure.
              </p>
              <details className="group mt-4">
                <summary className="cursor-pointer text-sm font-semibold text-slate-200">See the full approach</summary>
                <p className="mt-3 text-sm leading-relaxed text-slate-300">
                  You can train for behavioral rounds, technical screenings, and group discussion style conversations while the AI
                  Interview Coach highlights strengths, flags gaps, and recommends follow-up drills. For learners who want English
                  speaking practice with AI, the platform provides guided speech practice, vocabulary refinement, and grammar insights
                  that map directly to professional interview scenarios. This approach makes FluenzyAI a practical technical interview
                  training solution rather than a surface-level quiz tool.
                </p>
              </details>
            </div>
            <div className="rounded-2xl border border-slate-800/70 bg-slate-900/60 p-6 shadow-lg transition hover:-translate-y-1 hover:shadow-purple-500/10">
              <p className="text-xs uppercase tracking-[0.2em] text-slate-400">FAANG interview format</p>
              <div className="mt-4 flex items-center gap-3">
                <span className="flex h-9 w-9 items-center justify-center rounded-full bg-emerald-500/10 text-emerald-300">
                  <Compass className="h-4 w-4" />
                </span>
                <h3 className="text-lg font-semibold text-white">Designed to be crawlable and discoverable</h3>
              </div>
              <p className="mt-3 text-sm leading-relaxed text-slate-300">
                The experience is designed to be crawlable and discoverable with clear navigation, contextual internal links, and
                focused content.
              </p>
              <details className="group mt-4">
                <summary className="cursor-pointer text-sm font-semibold text-slate-200">Explore the structure</summary>
                <p className="mt-3 text-sm leading-relaxed text-slate-300">
                  You can explore the full set of modules on the <a href="/features" className="text-slate-100 underline underline-offset-4 hover:text-white">features page</a>,
                  compare plan options on the <a href="/pricing" className="text-slate-100 underline underline-offset-4 hover:text-white">pricing page</a>,
                  or jump directly into <a href="/login" className="text-slate-100 underline underline-offset-4 hover:text-white">training</a>.
                  If you are building momentum toward a job change, the internal skill tracking and report insights help you connect
                  daily practice with real hiring milestones.
                </p>
              </details>
            </div>
          </div>

          <div className="flex flex-wrap gap-3">
            <a
              href="/features"
              className="rounded-full border border-slate-700 px-4 py-2 text-sm font-semibold text-slate-200 transition hover:border-slate-400"
            >
              Explore Features
            </a>
            <a
              href="/blog/prepare-for-faang-interviews-with-ai"
              className="rounded-full border border-slate-700 px-4 py-2 text-sm font-semibold text-slate-200 transition hover:border-slate-400"
            >
              How to Prepare for FAANG Interviews with AI
            </a>
            <a
              href="/u/anjha1"
              className="rounded-full border border-slate-700 px-4 py-2 text-sm font-semibold text-slate-200 transition hover:border-slate-400"
            >
              Achhuta Nand Jha – AI Interview Profile
            </a>
          </div>

          <div className="space-y-4">
            <h2 className="text-2xl font-semibold text-white">Frequently asked questions</h2>
            <div className="space-y-4">
              {[
                {
                  q: "How does FluenzyAI improve interview readiness?",
                  a: "FluenzyAI pairs mock interviews with AI with targeted feedback on structure, clarity, and confidence so you can focus practice on the skills that move interview performance the fastest.",
                },
                {
                  q: "Is FluenzyAI suitable for FAANG interview practice?",
                  a: "Yes. The platform includes technical interview training, company-specific question sets, and readiness insights to support FAANG interview practice goals.",
                },
                {
                  q: "Does it cover HR interview preparation?",
                  a: "The HR interview preparation modules focus on behavioral storytelling, leadership prompts, and situational scenarios with coaching feedback.",
                },
                {
                  q: "Can I practice English speaking with AI?",
                  a: "FluenzyAI provides English speaking practice with AI through guided conversations, grammar correction, and vocabulary coaching tailored to interview contexts.",
                },
              ].map((item) => (
                <details key={item.q} className="rounded-2xl border border-slate-800/70 bg-slate-900/60 p-5 transition">
                  <summary className="cursor-pointer text-sm font-semibold text-slate-100">
                    {item.q}
                  </summary>
                  <p className="mt-3 text-sm leading-relaxed text-slate-300">{item.a}</p>
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
                "name": "How does FluenzyAI improve interview readiness?",
                "acceptedAnswer": {
                  "@type": "Answer",
                  "text": "FluenzyAI pairs mock interviews with AI with targeted feedback on structure, clarity, and confidence so you can focus practice on the skills that move interview performance the fastest."
                }
              },
              {
                "@type": "Question",
                "name": "Is FluenzyAI suitable for FAANG interview practice?",
                "acceptedAnswer": {
                  "@type": "Answer",
                  "text": "Yes. The platform includes technical interview training, company-specific question sets, and readiness insights to support FAANG interview practice goals."
                }
              },
              {
                "@type": "Question",
                "name": "Does it cover HR interview preparation?",
                "acceptedAnswer": {
                  "@type": "Answer",
                  "text": "The HR interview preparation modules focus on behavioral storytelling, leadership prompts, and situational scenarios with coaching feedback."
                }
              },
              {
                "@type": "Question",
                "name": "Can I practice English speaking with AI?",
                "acceptedAnswer": {
                  "@type": "Answer",
                  "text": "FluenzyAI provides English speaking practice with AI through guided conversations, grammar correction, and vocabulary coaching tailored to interview contexts."
                }
              }
            ]
          })
        }}
      />
    </>
  );
}
