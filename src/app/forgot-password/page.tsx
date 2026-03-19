"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { motion } from "framer-motion";
import { Mail, ArrowRight, ArrowLeft, ShieldCheck, KeyRound } from "lucide-react";
import { toast } from "sonner";

/* ─────────────────────────────────────────────────────────────────────────── */
/*  Background                                                                 */
/* ─────────────────────────────────────────────────────────────────────────── */
const Bg = () => (
  <>
    <div className="pointer-events-none fixed inset-0 bg-gradient-to-br from-[#06040f] via-[#0d0a2e] to-[#06040f]" />
    <div className="pointer-events-none fixed left-1/2 top-1/2 h-[560px] w-[560px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-violet-700/18 blur-[130px]" />
    <div className="pointer-events-none fixed right-10 top-16 h-72 w-72 rounded-full bg-indigo-500/10 blur-[90px]" />
    <div className="pointer-events-none fixed left-8 bottom-16 h-80 w-80 rounded-full bg-cyan-600/8 blur-[110px]" />
    <div className="pointer-events-none fixed inset-0 bg-[linear-gradient(rgba(255,255,255,0.015)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.015)_1px,transparent_1px)] bg-[size:60px_60px] [mask-image:radial-gradient(ellipse_80%_60%_at_50%_50%,black,transparent)]" />
  </>
);

/* ─────────────────────────────────────────────────────────────────────────── */
/*  FloatingInput                                                              */
/* ─────────────────────────────────────────────────────────────────────────── */
function FloatingInput({
  id,
  label,
  type = "text",
  value,
  onChange,
  error,
  icon: Icon,
  autoComplete,
  disabled,
}: {
  id: string;
  label: string;
  type?: string;
  value: string;
  onChange: (v: string) => void;
  error?: string;
  icon?: React.ElementType;
  autoComplete?: string;
  disabled?: boolean;
}) {
  const [focused, setFocused] = useState(false);
  const floated = focused || value.length > 0;

  return (
    <div className="space-y-1">
      <div
        className={`relative rounded-xl border transition-all duration-200 ${
          error
            ? "border-red-500/60 bg-red-500/5"
            : focused
            ? "border-violet-500/70 bg-slate-800/80 shadow-[0_0_0_3px_rgba(124,58,237,0.12)]"
            : "border-white/10 bg-slate-800/60 hover:border-white/20"
        } ${disabled ? "opacity-60 cursor-not-allowed" : ""}`}
      >
        {Icon && (
          <div className="absolute left-3 top-1/2 -translate-y-1/2">
            <Icon
              size={15}
              className={`transition-colors ${focused ? "text-violet-400" : "text-slate-500"}`}
            />
          </div>
        )}
        <label
          htmlFor={id}
          className={`absolute pointer-events-none font-medium transition-all duration-200 ${
            Icon ? "left-9" : "left-3.5"
          } ${
            floated
              ? "top-1.5 text-[10px] text-violet-400"
              : "top-1/2 -translate-y-1/2 text-sm text-slate-500"
          }`}
        >
          {label}
        </label>
        <input
          id={id}
          type={type}
          value={value}
          disabled={disabled}
          onFocus={() => setFocused(true)}
          onBlur={() => setFocused(false)}
          onChange={(e) => onChange(e.target.value)}
          autoComplete={autoComplete}
          className={`w-full bg-transparent pb-2 pt-6 text-sm text-slate-100 outline-none ${
            Icon ? "pl-9" : "pl-3.5"
          } pr-3.5 ${disabled ? "cursor-not-allowed" : ""}`}
        />
      </div>
      {error && (
        <motion.p
          initial={{ opacity: 0, y: -4 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-[11px] text-red-400 pl-1"
        >
          {error}
        </motion.p>
      )}
    </div>
  );
}

/* ─────────────────────────────────────────────────────────────────────────── */
/*  Main Component                                                             */
/* ─────────────────────────────────────────────────────────────────────────── */
export default function ForgotPasswordPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [emailError, setEmailError] = useState("");
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setEmailError("");

    // Validate email
    if (!email.trim() || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      setEmailError("Please enter a valid email address.");
      return;
    }

    setLoading(true);
    try {
      const res = await fetch("/api/auth/forgot-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: email.trim().toLowerCase() }),
      });

      const data = await res.json();

      if (!res.ok) {
        toast.error(data.error || "Something went wrong.");
        return;
      }

      setSubmitted(true);
      toast.success("Check your email for the reset code!");
      
      // Store email for reset-password page
      sessionStorage.setItem("resetEmail", email.trim().toLowerCase());
      
      // Redirect to reset password page after a brief delay
      setTimeout(() => {
        router.push("/reset-password");
      }, 1500);
    } catch (error) {
      toast.error("Failed to send reset email. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="relative min-h-screen overflow-hidden text-white flex items-center justify-center px-4 py-12">
      <Bg />

      <div className="relative z-10 w-full max-w-[420px]">
        {/* Logo */}
        <motion.div
          initial={{ opacity: 0, y: -14 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
          className="mb-8 flex justify-center"
        >
          <Link href="/" className="flex items-center gap-2.5 group">
            <img
              src="/favicon/apple-touch-icon.png"
              alt="Fluenzy AI Logo"
              className="h-9 w-9 rounded-xl shadow-lg shadow-violet-500/30 group-hover:shadow-violet-500/50 transition-shadow"
            />
            <span className="text-xl font-bold tracking-tight">Fluenzy AI</span>
          </Link>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 28 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.45, delay: 0.06 }}
          className="rounded-2xl border border-white/[0.07] bg-slate-900/80 p-8 shadow-2xl shadow-black/60 backdrop-blur-2xl"
        >
          {/* Badge + heading */}
          <div className="mb-7">
            <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-violet-400/25 bg-violet-500/10 px-3.5 py-1.5 text-[11px] font-semibold uppercase tracking-widest text-violet-300">
              <KeyRound size={11} />
              Password Recovery
            </div>
            <h1 className="text-[22px] font-bold leading-tight tracking-tight">
              Forgot your password?
            </h1>
            <p className="mt-1.5 text-sm text-slate-500">
              {submitted
                ? "Check your email for the verification code."
                : "Enter your email and we'll send you a reset code."}
            </p>
          </div>

          {!submitted ? (
            <form onSubmit={handleSubmit} className="space-y-5" noValidate>
              <FloatingInput
                id="reset-email"
                label="Email Address"
                type="email"
                value={email}
                onChange={(v) => {
                  setEmail(v);
                  setEmailError("");
                }}
                error={emailError}
                icon={Mail}
                autoComplete="email"
                disabled={loading}
              />

              <motion.button
                type="submit"
                disabled={loading}
                whileTap={{ scale: 0.975 }}
                className="w-full rounded-xl bg-gradient-to-r from-violet-600 to-indigo-600 px-5 py-3.5 text-sm font-semibold text-white shadow-lg shadow-violet-500/25 transition-all hover:from-violet-700 hover:to-indigo-700 hover:shadow-violet-500/40 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {loading ? (
                  <span className="flex items-center justify-center gap-2">
                    <div className="h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white" />
                    Sending...
                  </span>
                ) : (
                  <span className="flex items-center justify-center gap-2">
                    Send Reset Code
                    <ArrowRight size={15} />
                  </span>
                )}
              </motion.button>
            </form>
          ) : (
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="text-center py-4"
            >
              <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-green-500/10 border border-green-500/20">
                <ShieldCheck className="h-8 w-8 text-green-400" />
              </div>
              <p className="text-sm text-slate-400">
                Redirecting to password reset...
              </p>
            </motion.div>
          )}

          {/* Back to login */}
          <div className="mt-7 flex items-center gap-3">
            <div className="h-px flex-1 bg-white/6" />
            <span className="text-[11px] text-slate-600">Remember password?</span>
            <div className="h-px flex-1 bg-white/6" />
          </div>

          <div className="mt-4 flex justify-center">
            <Link
              href="/login"
              className="inline-flex items-center gap-1.5 rounded-xl border border-white/10 bg-white/4 px-5 py-2.5 text-sm font-semibold text-slate-200 transition-all hover:border-violet-500/40 hover:bg-violet-500/10 hover:text-violet-300"
            >
              <ArrowLeft size={14} />
              Back to Login
            </Link>
          </div>
        </motion.div>

        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5 }}
          className="mt-5 text-center text-[11px] text-slate-700"
        >
          🔒 Your account security is our priority
        </motion.p>
      </div>
    </main>
  );
}
