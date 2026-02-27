"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { signIn, useSession } from "next-auth/react";
import { motion } from "framer-motion";
import { Sparkles } from "lucide-react";

export default function LoginPage() {
  const router = useRouter();
  const { data: session, status } = useSession();

  useEffect(() => {
    if (session?.user) {
      router.replace("/train");
    }
  }, [session, router]);

  return (
    <main className="relative min-h-screen overflow-hidden bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 px-4 py-24 text-white">
      <div className="absolute left-1/2 top-1/2 h-[420px] w-[420px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-purple-500/20 blur-3xl" />
      <div className="absolute right-16 top-20 h-56 w-56 rounded-full bg-cyan-500/10 blur-3xl" />

      <motion.div
        initial={{ opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="relative z-10 mx-auto w-full max-w-md rounded-3xl border border-white/10 bg-slate-900/70 p-8 backdrop-blur-xl"
      >
        <div className="mb-5 inline-flex items-center gap-2 rounded-full border border-purple-400/30 bg-purple-500/10 px-4 py-1.5 text-xs font-semibold uppercase tracking-wider text-purple-200">
          <Sparkles className="h-4 w-4" />
          Secure Login
        </div>
        <h1 className="mb-2 text-3xl font-bold">Continue to Fluenzy AI</h1>
        <p className="mb-7 text-sm text-slate-300">
          Sign in to start training, access interview analytics, and generate smart interview guides.
        </p>

        <button
          onClick={() => signIn("google", { callbackUrl: "/train" })}
          disabled={status === "loading"}
          className="w-full rounded-xl bg-gradient-to-r from-purple-600 to-blue-600 px-5 py-3 text-sm font-semibold text-white transition hover:from-purple-700 hover:to-blue-700 disabled:cursor-not-allowed disabled:opacity-70"
        >
          {status === "loading" ? "Loading..." : "Continue with Google"}
        </button>
      </motion.div>
    </main>
  );
}
