import type { Metadata } from "next";
import Pricing from "@/modules/pricing";
import Footer from "@/components/footer";

export const metadata: Metadata = {
  title: "Pricing - FluenzyAI: AI Interview Coach & English Practice",
  description: "Select the ideal FluenzyAI plan for AI-driven interview preparation and English fluency training. Flexible pricing for HR interviews, technical mock tests, group discussions, and career advancement.",
  keywords: "AI interview coach, interview preparation platform, spoken English for jobs, career growth using AI",
  alternates: {
    canonical: "https://www.fluenzyai.app/pricing",
  },
  openGraph: {
    title: "Pricing - FluenzyAI: AI Interview Coach & English Practice",
    description: "Select the ideal FluenzyAI plan for AI-driven interview preparation and English fluency training.",
    url: "https://www.fluenzyai.app/pricing",
    type: "website",
    images: [
      {
        url: "https://www.fluenzyai.app/og-image.jpg",
        width: 1200,
        height: 630,
        alt: "FluenzyAI Pricing",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Pricing - FluenzyAI: AI Interview Coach & English Practice",
    description: "Select the ideal FluenzyAI plan for AI-driven interview preparation and English fluency training.",
    images: ["https://www.fluenzyai.app/og-image.jpg"],
  },
};

export default function PricingPage() {
  return (
    <div className="min-h-screen bg-background text-foreground">
      <section className="pt-32 pb-12 bg-background border-b border-border">
        <div className="container mx-auto px-4 text-center">
          <h1 className="text-4xl lg:text-6xl font-black mb-4 tracking-tight">
            <span className="text-foreground">FluenzyAI </span>
            <span className="bg-gradient-to-r from-purple-400 via-indigo-300 to-purple-400 !bg-clip-text text-transparent">
              Pricing Plans
            </span>
          </h1>
          <p className="text-base sm:text-xl text-muted-foreground max-w-3xl mx-auto leading-relaxed font-medium">
            Select the ideal plan to unlock unlimited AI-powered interview preparation and English fluency training. Start free and upgrade as you progress toward career success.
          </p>
        </div>
      </section>
      <Pricing />
      <section className="relative overflow-hidden bg-background text-foreground">
        <div className="container mx-auto px-4 py-16 space-y-12 relative z-10">
          <nav aria-label="Breadcrumb" className="text-sm text-muted-foreground">
            <ol className="flex flex-wrap gap-2 font-medium">
              <li>
                <a href="/" className="hover:text-foreground">Home</a>
              </li>
              <li aria-hidden="true">/</li>
              <li className="text-foreground font-semibold">Pricing</li>
            </ol>
          </nav>

          <div className="space-y-5 max-w-4xl">
            <p className="text-xs uppercase tracking-[0.25em] text-slate-400">Plans & Pricing</p>
            <h2 className="text-3xl md:text-4xl font-semibold text-white">Pricing built for continuous interview practice</h2>
            <p className="text-base leading-relaxed text-slate-300">
              FluenzyAI offers flexible pricing so you can match your preparation intensity to your goals. Whether you are starting
              with mock interviews with AI or preparing for a high-stakes transition, each plan includes core AI Interview Coach
              capabilities. You get guided HR interview preparation, targeted technical interview training, and English speaking
              practice with AI that mirrors real interview scenarios. This makes FluenzyAI a practical AI interview preparation
              platform for candidates who want consistent progress rather than sporadic practice.
            </p>
          </div>

          <div className="grid gap-6 md:grid-cols-2">
            <div className="rounded-2xl border border-slate-800/70 bg-slate-900/60 p-6 shadow-lg transition hover:-translate-y-1 hover:shadow-purple-500/10">
              <h3 className="text-lg font-semibold text-white">Plans for every preparation timeline</h3>
              <p className="mt-3 text-sm leading-relaxed text-slate-300">
                The Free plan helps you explore the experience, while Standard and Pro plans unlock more advanced analytics, additional
                training sessions, and deeper feedback loops. If you are focused on FAANG interview practice, the higher tiers provide
                the repetition and insights required to refine problem-solving and communication at scale. Each plan is structured to
                support daily practice and measurable improvement across HR interview preparation, technical interview training, and
                mock interviews with AI.
              </p>
            </div>
            <div className="rounded-2xl border border-slate-800/70 bg-slate-900/60 p-6 shadow-lg transition hover:-translate-y-1 hover:shadow-purple-500/10">
              <h3 className="text-lg font-semibold text-white">Upgrade without losing momentum</h3>
              <p className="mt-3 text-sm leading-relaxed text-slate-300">
                Choose a plan that aligns with your schedule and hiring timeline. You can upgrade as your goals evolve, and you will
                keep your training history so progress is never lost. For a full overview of features and module coverage, visit the
                features page or return to the home page for a complete platform summary.
              </p>
            </div>
          </div>

          <div className="flex flex-wrap gap-3">
            <a href="/train" className="rounded-full bg-gradient-to-r from-purple-500 to-cyan-400 px-5 py-2.5 text-sm font-semibold text-slate-950">
              Start Training
            </a>
            <a href="/features" className="rounded-full border border-slate-700 px-5 py-2.5 text-sm font-semibold text-slate-200 transition hover:border-slate-400">
              View Features
            </a>
            <a href="/" className="rounded-full border border-slate-700 px-5 py-2.5 text-sm font-semibold text-slate-200 transition hover:border-slate-400">
              Back to Home
            </a>
          </div>

          <div className="space-y-4">
            <h2 className="text-2xl font-semibold text-white">Pricing FAQs</h2>
            <div className="space-y-4">
              {[
                {
                  q: "Which plan is best for FAANG interview practice?",
                  a: "Standard and Pro plans are ideal for FAANG interview practice because they provide more sessions, deeper analytics, and advanced mock interviews with AI.",
                },
                {
                  q: "Do all plans include English speaking practice with AI?",
                  a: "Yes. Every plan includes English speaking practice with AI, grammar feedback, and communication improvement tools.",
                },
                {
                  q: "Can I upgrade my plan later?",
                  a: "You can upgrade at any time without losing your practice history, analytics, or completed training sessions.",
                },
                {
                  q: "Is there a free option to test the platform?",
                  a: "The Free plan lets you explore the AI Interview Coach, sample mock interviews with AI, and begin HR interview preparation.",
                },
              ].map((item) => (
                <details key={item.q} className="rounded-2xl border border-slate-800/70 bg-slate-900/60 p-5">
                  <summary className="cursor-pointer text-sm font-semibold text-slate-100">{item.q}</summary>
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
            "@type": "Product",
            "name": "FluenzyAI Plans",
            "description": "Pricing plans for FluenzyAI AI Interview Coach and English practice platform.",
            "brand": { "@type": "Organization", "name": "FluenzyAI" },
            "offers": [
              {
                "@type": "Offer",
                "name": "Free",
                "price": "0",
                "priceCurrency": "INR",
                "availability": "https://schema.org/InStock",
                "url": "https://www.fluenzyai.app/pricing"
              },
              {
                "@type": "Offer",
                "name": "Standard",
                "price": "150",
                "priceCurrency": "INR",
                "availability": "https://schema.org/InStock",
                "url": "https://www.fluenzyai.app/pricing"
              },
              {
                "@type": "Offer",
                "name": "Pro",
                "price": "20",
                "priceCurrency": "INR",
                "availability": "https://schema.org/InStock",
                "url": "https://www.fluenzyai.app/pricing"
              }
            ]
          })
        }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            "@context": "https://schema.org",
            "@type": "FAQPage",
            "mainEntity": [
              {
                "@type": "Question",
                "name": "Which plan is best for FAANG interview practice?",
                "acceptedAnswer": {
                  "@type": "Answer",
                  "text": "Standard and Pro plans are ideal for FAANG interview practice because they provide more sessions, deeper analytics, and advanced mock interviews with AI."
                }
              },
              {
                "@type": "Question",
                "name": "Do all plans include English speaking practice with AI?",
                "acceptedAnswer": {
                  "@type": "Answer",
                  "text": "Yes. Every plan includes English speaking practice with AI, grammar feedback, and communication improvement tools."
                }
              },
              {
                "@type": "Question",
                "name": "Can I upgrade my plan later?",
                "acceptedAnswer": {
                  "@type": "Answer",
                  "text": "You can upgrade at any time without losing your practice history, analytics, or completed training sessions."
                }
              },
              {
                "@type": "Question",
                "name": "Is there a free option to test the platform?",
                "acceptedAnswer": {
                  "@type": "Answer",
                  "text": "The Free plan lets you explore the AI Interview Coach, sample mock interviews with AI, and begin HR interview preparation."
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