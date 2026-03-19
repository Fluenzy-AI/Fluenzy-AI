"use client";
// ── redesigned login page ──
import { useState, useEffect } from "react";
import { signIn, useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { motion } from "framer-motion";
import { Eye, EyeOff, Mail, Lock, Sparkles, ShieldCheck, ArrowRight, KeyRound } from "lucide-react";
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
/*  FloatingInput                                                               */
/* ─────────────────────────────────────────────────────────────────────────── */
function FloatingInput({
  id,
  label,
  type = "text",
  value,
  onChange,
  error,
  icon: Icon,
  suffix,
  autoComplete,
}: {
  id: string;
  label: string;
  type?: string;
  value: string;
  onChange: (v: string) => void;
  error?: string;
  icon?: React.ElementType;
  suffix?: React.ReactNode;
  autoComplete?: string;
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
        }`}
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
          onFocus={() => setFocused(true)}
          onBlur={() => setFocused(false)}
          onChange={(e) => onChange(e.target.value)}
          autoComplete={autoComplete}
          className={`w-full bg-transparent pb-2 pt-6 text-sm text-slate-100 outline-none ${
            Icon ? "pl-9" : "pl-3.5"
          } ${suffix ? "pr-10" : "pr-3.5"}`}
        />
        {suffix && (
          <div className="absolute right-3 top-1/2 -translate-y-1/2">{suffix}</div>
        )}
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
/*  Google Icon SVG                                                             */
/* ─────────────────────────────────────────────────────────────────────────── */
const GoogleIcon = () => (
  <svg viewBox="0 0 24 24" className="h-4 w-4" aria-hidden="true">
    <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4" />
    <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
    <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05" />
    <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
  </svg>
);

/* ─────────────────────────────────────────────────────────────────────────── */
/*  Main Component                                                             */
/* ─────────────────────────────────────────────────────────────────────────── */
export default function LoginPage() {
  const router = useRouter();
  const { data: session, status } = useSession();

  useEffect(() => {
    if (session?.user) router.replace("/train");
  }, [session, router]);

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPw, setShowPw] = useState(false);
  const [emailError, setEmailError] = useState("");
  const [passwordError, setPasswordError] = useState("");
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);

  const handleGoogleSignIn = async () => {
    setGoogleLoading(true);
    try {
      await signIn("google", { callbackUrl: "/train" });
    } catch {
      toast.error("Google sign-in failed. Please try again.");
      setGoogleLoading(false);
    }
  };

  const handleEmailLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setEmailError("");
    setPasswordError("");

    let hasError = false;
    if (!email.trim() || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      setEmailError("Enter a valid email address.");
      hasError = true;
    }
    if (!password.trim()) {
      setPasswordError("Password is required.");
      hasError = true;
    }
    if (hasError) return;

    setLoading(true);
    try {
      const result = await signIn("credentials", {
        email: email.trim().toLowerCase(),
        password,
        redirect: false,
      });
      if (result?.error) {
        toast.error("Invalid email or password. Please try again.");
      } else if (result?.ok) {
        toast.success("Welcome back!");
        router.replace("/train");
      }
    } catch {
      toast.error("Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  if (status === "loading") return null;

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
              <ShieldCheck size={11} />
              Secure Login
            </div>
            <h1 className="text-[22px] font-bold leading-tight tracking-tight">
              Continue to Fluenzy AI
            </h1>
            <p className="mt-1.5 text-sm text-slate-500">
              Sign in to access AI interview training and analytics.
            </p>
          </div>

          {/* ── Google (Primary CTA) ─────────────────────────────────────── */}
          <motion.button
            whileTap={{ scale: 0.975 }}
            onClick={handleGoogleSignIn}
            disabled={googleLoading || loading}
            className="flex w-full items-center justify-center gap-3 rounded-xl border border-white/10 bg-white/5 px-5 py-3.5 text-sm font-semibold text-slate-100 shadow-sm transition-all duration-200 hover:bg-white/10 hover:border-white/20 hover:shadow-md disabled:cursor-not-allowed disabled:opacity-60"
          >
            {googleLoading ? (
              <div className="h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white" />
            ) : (
              <GoogleIcon />
            )}
            <span>{googleLoading ? "Redirecting…" : "Continue with Google"}</span>
          </motion.button>

          {/* OR divider */}
          <div className="flex items-center gap-3 my-6">
            <div className="h-px flex-1 bg-white/8" />
            <span className="text-[11px] font-semibold uppercase tracking-widest text-slate-600">OR</span>
            <div className="h-px flex-1 bg-white/8" />
          </div>

          {/* ── Email / Password form ────────────────────────────────────── */}
          <form onSubmit={handleEmailLogin} className="space-y-4" noValidate>
            <FloatingInput
              id="login-email"
              label="Email Address"
              type="email"
              value={email}
              onChange={(v) => { setEmail(v); setEmailError(""); }}
              error={emailError}
              icon={Mail}
              autoComplete="email"
            />

            <div className="space-y-1.5">
              <FloatingInput
                id="login-password"
                label="Password"
                type={showPw ? "text" : "password"}
                value={password}
                onChange={(v) => { setPassword(v); setPasswordError(""); }}
                error={passwordError}
                icon={Lock}
                autoComplete="current-password"
                suffix={
                  <button
                    type="button"
                    tabIndex={-1}
                    onClick={() => setShowPw((p) => !p)}
                    className="text-slate-500 hover:text-slate-300 transition-colors"
                    aria-label={showPw ? "Hide password" : "Show password"}
                  >
                    {showPw ? <EyeOff size={15} /> : <Eye size={15} />}
                  </button>
                }
              />
              <div className="flex justify-end">
                <Link
                  href="/forgot-password"
                  className="text-[11px] text-slate-500 hover:text-violet-400 transition-colors"
                >
                  Forgot Password?
                </Link>
              </div>
            </div>

            <motion.button
              type="submit"
              disabled={loading || googleLoading}
              whileTap={{ scale: 0.975 }}
              className="w-full rounded-xl bg-gradient-to-r from-violet-600 to-indigo-600 px-5 py-3.5 text-sm font-semibold text-white shadow-lg shadow-violet-500/25 transition-all hover:from-violet-700 hover:to-indigo-700 hover:shadow-violet-500/40 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {loading ? (
                <span className="flex items-center justify-center gap-2">
                  <div className="h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white" />
                  Signing in…
                </span>
              ) : (
                <span className="flex items-center justify-center gap-2">
                  <KeyRound size={15} />
                  Sign In
                  <ArrowRight size={15} />
                </span>
              )}
            </motion.button>
          </form>

          {/* ── Register link ────────────────────────────────────────────── */}
          <div className="mt-7 flex items-center gap-3">
            <div className="h-px flex-1 bg-white/6" />
            <span className="text-[11px] text-slate-600">New here?</span>
            <div className="h-px flex-1 bg-white/6" />
          </div>

          <div className="mt-4 flex flex-col items-center gap-2">
            <p className="text-sm text-slate-500">Don&apos;t have an account?</p>
            <Link
              href="/signup"
              className="inline-flex items-center gap-1.5 rounded-xl border border-white/10 bg-white/4 px-5 py-2.5 text-sm font-semibold text-slate-200 transition-all hover:border-violet-500/40 hover:bg-violet-500/10 hover:text-violet-300"
            >
              Register — it&apos;s free
              <ArrowRight size={14} />
            </Link>
          </div>
        </motion.div>

        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5 }}
          className="mt-5 text-center text-[11px] text-slate-700"
        >
          🔒 Secured with industry-standard encryption
        </motion.p>
      </div>
    </main>
  );
}
