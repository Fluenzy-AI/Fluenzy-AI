import type { Metadata } from "next";
import { MessageSquare, Sparkles, Target } from "lucide-react";

export const metadata: Metadata = {
  title: "Fluenzy AI Blog – Interview Preparation with AI",
  description:
    "Insights and guides on AI-powered interview preparation, FAANG interview practice, and technical interview preparation with AI for confident hiring outcomes.",
  alternates: {
    canonical: "https://www.fluenzyai.app/blog",
  },
  openGraph: {
    title: "Fluenzy AI Blog – Interview Preparation with AI",
    description:
      "Explore AI interview preparation strategies, FAANG interview practice guidance, and technical interview preparation with AI.",
    url: "https://www.fluenzyai.app/blog",
    type: "website",
    images: [
      {
        url: "https://www.fluenzyai.app/og-image.jpg",
        width: 1200,
        height: 630,
        alt: "Fluenzy AI Blog",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Fluenzy AI Blog – Interview Preparation with AI",
    description:
      "Explore AI interview preparation strategies, FAANG interview practice guidance, and technical interview preparation with AI.",
    images: ["https://www.fluenzyai.app/og-image.jpg"],
  },
};

const posts = [
  {
    title: "How to Prepare for FAANG Interviews with AI",
    href: "/blog/prepare-for-faang-interviews-with-ai",
    description:
      "A complete guide to AI interview preparation, FAANG interview practice, and technical interview preparation with AI.",
  },
];

export default function BlogIndexPage() {
  return (
    <main className="bg-background text-foreground min-h-screen pt-24 pb-16">
      <div className="container mx-auto px-4 space-y-12">
        <nav aria-label="Breadcrumb" className="text-sm text-muted-foreground font-medium">
          <ol className="flex flex-wrap gap-2">
            <li>
              <a href="/" className="hover:text-foreground">Home</a>
            </li>
            <li aria-hidden="true">/</li>
            <li className="text-foreground font-semibold">Blog</li>
          </ol>
        </nav>

        <header className="relative overflow-hidden rounded-3xl border border-border bg-card p-8 sm:p-12 shadow-md">
          <div className="absolute -top-16 right-0 h-56 w-56 rounded-full bg-red-500/10 blur-3xl pointer-events-none" />
          <div className="relative space-y-5 max-w-4xl">
            <p className="text-xs uppercase tracking-[0.25em] font-bold text-red-500">Fluenzy AI Blog</p>
            <h1 className="text-3xl md:text-5xl font-black text-foreground tracking-tight">
              Fluenzy AI Blog – <span className="bg-gradient-to-r from-red-600 to-rose-600 !bg-clip-text text-transparent">Interview Preparation with AI</span>
            </h1>
            <p className="text-base leading-relaxed text-muted-foreground font-medium max-w-3xl">
              The Fluenzy AI blog is your resource hub for AI interview preparation, FAANG interview practice, and practical
              guidance across communication, HR, and technical interview preparation with AI. Our goal is to share clear,
              actionable strategies that help candidates build confidence and perform at their best in real interviews. Each
              guide is built around measurable improvement: strong reasoning, concise storytelling, and structured problem
              solving that mirror modern hiring expectations.
            </p>
            <div className="flex flex-wrap gap-3">
              <a
                href="/blog/prepare-for-faang-interviews-with-ai"
                className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-red-600 to-rose-600 px-5 py-2.5 text-sm font-bold text-white shadow-md hover:scale-[1.02] transition-all"
              >
                Read the Guide
              </a>
              <a
                href="/pricing"
                className="inline-flex items-center gap-2 rounded-xl border border-border bg-card px-5 py-2.5 text-sm font-bold text-foreground hover:bg-muted transition-all"
              >
                View Pricing
              </a>
            </div>
          </div>
        </header>

          <div className="grid gap-6 md:grid-cols-3">
            <div className="rounded-2xl border border-slate-800/70 bg-slate-900/60 p-6 shadow-lg transition hover:-translate-y-1 hover:shadow-purple-500/10">
            <p className="text-xs uppercase tracking-[0.2em] text-slate-400">AI interview preparation</p>
              <div className="mt-4 flex items-center gap-3">
                <span className="flex h-9 w-9 items-center justify-center rounded-full bg-purple-500/10 text-purple-300">
                  <Sparkles className="h-4 w-4" />
                </span>
                <h2 className="text-lg font-semibold text-white">Build measurable interview momentum</h2>
              </div>
            <p className="mt-3 text-sm leading-relaxed text-slate-300">
              As interview processes evolve, AI interview coaches provide faster feedback loops than traditional practice.
            </p>
            <details className="group mt-4">
              <summary className="cursor-pointer text-sm font-semibold text-slate-200">Read the full perspective</summary>
              <p className="mt-3 text-sm leading-relaxed text-slate-300">
                The articles here break down how to use mock interviews with AI, how to approach FAANG interview practice with
                a structured plan, and how to combine communication training with technical depth. Whether you are preparing for
                your first screen or refining leadership stories for onsite rounds, this blog offers practical, repeatable
                guidance that supports long-term growth.
              </p>
            </details>
          </div>
            <div className="rounded-2xl border border-slate-800/70 bg-slate-900/60 p-6 shadow-lg transition hover:-translate-y-1 hover:shadow-purple-500/10">
            <p className="text-xs uppercase tracking-[0.2em] text-slate-400">FAANG strategy</p>
              <div className="mt-4 flex items-center gap-3">
                <span className="flex h-9 w-9 items-center justify-center rounded-full bg-cyan-500/10 text-cyan-300">
                  <Target className="h-4 w-4" />
                </span>
                <h2 className="text-lg font-semibold text-white">Structured FAANG interview practice</h2>
              </div>
            <p className="mt-3 text-sm leading-relaxed text-slate-300">
              Learn how to structure daily practice for FAANG interview loops, from behavioral storytelling to technical depth.
            </p>
          </div>
            <div className="rounded-2xl border border-slate-800/70 bg-slate-900/60 p-6 shadow-lg transition hover:-translate-y-1 hover:shadow-purple-500/10">
            <p className="text-xs uppercase tracking-[0.2em] text-slate-400">Communication + HR</p>
              <div className="mt-4 flex items-center gap-3">
                <span className="flex h-9 w-9 items-center justify-center rounded-full bg-emerald-500/10 text-emerald-300">
                  <MessageSquare className="h-4 w-4" />
                </span>
                <h2 className="text-lg font-semibold text-white">Clarity, confidence, and storytelling</h2>
              </div>
            <p className="mt-3 text-sm leading-relaxed text-slate-300">
              Explore guidance on HR interview preparation and communication improvements that influence hiring decisions.
            </p>
          </div>
        </div>

        <div className="h-px bg-gradient-to-r from-transparent via-slate-800 to-transparent" />

        <section className="space-y-4">
          <h2 className="text-2xl font-semibold text-white">Latest AI interview preparation guides</h2>
          <ul className="space-y-4">
            {posts.map((post) => (
              <li key={post.href} className="rounded-2xl border border-slate-800/70 bg-slate-900/60 p-5 transition hover:-translate-y-1 hover:shadow-purple-500/10">
                <h3 className="text-lg font-semibold text-slate-100">
                  <a href={post.href} className="hover:text-white">
                    {post.title}
                  </a>
                </h3>
                <p className="mt-2 text-sm text-slate-300 max-w-3xl">{post.description}</p>
                <div className="mt-4 flex flex-wrap gap-3">
                  <a
                    href={post.href}
                    className="rounded-full bg-gradient-to-r from-purple-500 to-cyan-400 px-4 py-2 text-xs font-semibold text-slate-950"
                  >
                    Read the guide
                  </a>
                  <a
                    href="/train"
                    className="rounded-full border border-slate-700 px-4 py-2 text-xs font-semibold text-slate-200 transition hover:border-slate-400"
                  >
                    Start Training
                  </a>
                </div>
              </li>
            ))}
          </ul>
        </section>
      </div>

      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            "@context": "https://schema.org",
            "@type": "Blog",
            "name": "Fluenzy AI Blog",
            "url": "https://www.fluenzyai.app/blog",
            "description": "Insights on AI interview preparation, FAANG interview practice, and technical interview preparation with AI.",
            "publisher": {
              "@type": "Organization",
              "name": "FluenzyAI",
              "url": "https://www.fluenzyai.app"
            }
          })
        }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            "@context": "https://schema.org",
            "@type": "ItemList",
            "itemListElement": posts.map((post, index) => ({
              "@type": "ListItem",
              "position": index + 1,
              "url": `https://www.fluenzyai.app${post.href}`
            }))
          })
        }}
      />
    </main>
  );
}
