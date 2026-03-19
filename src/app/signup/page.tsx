"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { signIn, useSession } from "next-auth/react";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import {
  Eye,
  EyeOff,
  ArrowRight,
  CheckCircle2,
  Sparkles,
  Lock,
  Mail,
  User,
  ShieldCheck,
  RotateCcw,
  ChevronLeft,
} from "lucide-react";
import { toast } from "sonner";

/* ─────────────────────────────────────────────────────────────────────────── */
/*  Types                                                                      */
/* ─────────────────────────────────────────────────────────────────────────── */

interface FormData {
  firstName: string;
  lastName: string;
  email: string;
  password: string;
  confirmPassword: string;
  terms: boolean;
}

interface FormErrors {
  firstName?: string;
  lastName?: string;
  email?: string;
  password?: string;
  confirmPassword?: string;
  terms?: string;
}

/* ─────────────────────────────────────────────────────────────────────────── */
/*  Helpers                                                                    */
/* ─────────────────────────────────────────────────────────────────────────── */

const isValidEmail = (e: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(e);

function getPasswordStrength(pw: string): { score: number; label: string; color: string } {
  let score = 0;
  if (pw.length >= 8) score++;
  if (/[A-Z]/.test(pw)) score++;
  if (/[a-z]/.test(pw)) score++;
  if (/\d/.test(pw)) score++;
  if (/[!@#$%^&*()_+\-=[\]{};':"\\|,.<>/?]/.test(pw)) score++;
  const levels = [
    { label: "", color: "" },
    { label: "Weak", color: "bg-red-500" },
    { label: "Fair", color: "bg-orange-500" },
    { label: "Good", color: "bg-yellow-500" },
    { label: "Strong", color: "bg-emerald-500" },
    { label: "Very Strong", color: "bg-emerald-400" },
  ];
  return { score, ...levels[score] };
}

const isStrongPassword = (pw: string) =>
  /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[!@#$%^&*()_+\-=[\]{};':"\\|,.<>/?]).{8,}$/.test(pw);

/* ─────────────────────────────────────────────────────────────────────────── */
/*  Google Icon                                                                 */
/* ─────────────────────────────────────────────────────────────────────────── */
const GoogleIcon = () => (
  <svg viewBox="0 0 24 24" className="h-[17px] w-[17px] flex-shrink-0" aria-hidden="true">
    <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4" />
    <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
    <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05" />
    <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
  </svg>
);

/* ─────────────────────────────────────────────────────────────────────────── */
/*  Background orbs                                                            */
/* ─────────────────────────────────────────────────────────────────────────── */

const Bg = () => (
  <>
    <div className="pointer-events-none fixed inset-0 bg-gradient-to-br from-slate-950 via-[#0d0a2e] to-slate-950" />
    <div className="pointer-events-none fixed left-1/4 top-1/4 h-[500px] w-[500px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-violet-600/15 blur-[120px]" />
    <div className="pointer-events-none fixed right-1/4 bottom-1/3 h-96 w-96 rounded-full bg-indigo-600/10 blur-[100px]" />
    <div className="pointer-events-none fixed right-10 top-10 h-64 w-64 rounded-full bg-cyan-500/8 blur-3xl" />
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
              className={`transition-colors ${
                focused ? "text-violet-400" : "text-slate-500"
              }`}
            />
          </div>
        )}
        <label
          htmlFor={id}
          className={`absolute transition-all duration-200 pointer-events-none font-medium ${
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
          className={`w-full bg-transparent pb-2 pt-6 text-sm text-slate-100 outline-none placeholder-transparent ${
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
/*  OTP Input Row                                                              */
/* ─────────────────────────────────────────────────────────────────────────── */

function OtpInputRow({
  value,
  onChange,
  disabled,
}: {
  value: string[];
  onChange: (v: string[]) => void;
  disabled?: boolean;
}) {
  const refs = useRef<(HTMLInputElement | null)[]>([]);

  const handleKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Backspace" && !value[index] && index > 0) {
      refs.current[index - 1]?.focus();
    }
    if (e.key === "ArrowLeft" && index > 0) refs.current[index - 1]?.focus();
    if (e.key === "ArrowRight" && index < 5) refs.current[index + 1]?.focus();
  };

  const handleChange = (index: number, raw: string) => {
    const digit = raw.replace(/\D/g, "").slice(-1);
    const next = [...value];
    next[index] = digit;
    onChange(next);
    if (digit && index < 5) refs.current[index + 1]?.focus();
  };

  const handlePaste = (e: React.ClipboardEvent) => {
    e.preventDefault();
    const pasted = e.clipboardData.getData("text").replace(/\D/g, "").slice(0, 6);
    const next = Array(6).fill("");
    pasted.split("").forEach((c, i) => (next[i] = c));
    onChange(next);
    const lastIdx = Math.min(pasted.length, 5);
    refs.current[lastIdx]?.focus();
  };

  return (
    <div className="flex items-center justify-center gap-3" onPaste={handlePaste}>
      {Array.from({ length: 6 }).map((_, i) => (
        <motion.input
          key={i}
          ref={(el) => { refs.current[i] = el; }}
          type="text"
          inputMode="numeric"
          maxLength={1}
          value={value[i] || ""}
          onChange={(e) => handleChange(i, e.target.value)}
          onKeyDown={(e) => handleKeyDown(i, e)}
          disabled={disabled}
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ delay: i * 0.05 }}
          className={`w-12 h-14 rounded-xl border text-center text-xl font-bold outline-none transition-all duration-200 bg-slate-800/80 text-slate-100 caret-violet-400
            ${value[i]
              ? "border-violet-500 shadow-[0_0_0_3px_rgba(124,58,237,0.18)]"
              : "border-white/15 hover:border-white/25 focus:border-violet-500 focus:shadow-[0_0_0_3px_rgba(124,58,237,0.18)]"
            }
            ${disabled ? "opacity-50 cursor-not-allowed" : ""}
          `}
        />
      ))}
    </div>
  );
}

/* ─────────────────────────────────────────────────────────────────────────── */
/*  Main Component                                                             */
/* ─────────────────────────────────────────────────────────────────────────── */

export default function SignupPage() {
  const router = useRouter();
  const { data: session } = useSession();

  useEffect(() => {
    if (session?.user) router.replace("/train");
  }, [session, router]);

  /* ── Page step ────────────────────────────────────────────────────────────── */
  const [step, setStep] = useState<"register" | "otp" | "success">("register");

  /* ── Registration form ────────────────────────────────────────────────────── */
  const [form, setForm] = useState<FormData>({
    firstName: "",
    lastName: "",
    email: "",
    password: "",
    confirmPassword: "",
    terms: false,
  });
  const [errors, setErrors] = useState<FormErrors>({});
  const [showPw, setShowPw] = useState(false);
  const [showCpw, setShowCpw] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  /* ── OTP step ─────────────────────────────────────────────────────────────── */
  const [otpDigits, setOtpDigits] = useState<string[]>(Array(6).fill(""));
  const [verifying, setVerifying] = useState(false);
  const [otpEmail, setOtpEmail] = useState("");

  // Countdown timer (300 seconds = 5 min)
  const [countdown, setCountdown] = useState(300);
  const [canResend, setCanResend] = useState(false);
  const [resendCooldown, setResendCooldown] = useState(30);
  const [resending, setResending] = useState(false);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const resendRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // ── Start countdown when step changes to otp ────────────────────────────────
  useEffect(() => {
    if (step === "otp") {
      setCountdown(300);
      setCanResend(false);
      setResendCooldown(30);

      timerRef.current = setInterval(() => {
        setCountdown((c) => {
          if (c <= 1) {
            clearInterval(timerRef.current!);
            return 0;
          }
          return c - 1;
        });
      }, 1000);

      resendRef.current = setInterval(() => {
        setResendCooldown((c) => {
          if (c <= 1) {
            clearInterval(resendRef.current!);
            setCanResend(true);
            return 0;
          }
          return c - 1;
        });
      }, 1000);
    }
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
      if (resendRef.current) clearInterval(resendRef.current);
    };
  }, [step]);

  const formatTime = (secs: number) => {
    const m = Math.floor(secs / 60)
      .toString()
      .padStart(2, "0");
    const s = (secs % 60).toString().padStart(2, "0");
    return `${m}:${s}`;
  };

  /* ─────────────────────────────────────────────────────────────────────────  */
  /*  Form validation                                                           */
  /* ─────────────────────────────────────────────────────────────────────────  */

  const setField = <K extends keyof FormData>(key: K, val: FormData[K]) => {
    setForm((p) => ({ ...p, [key]: val }));
    setErrors((p) => ({ ...p, [key]: undefined }));
  };

  const validate = (): boolean => {
    const e: FormErrors = {};
    if (!form.firstName.trim()) e.firstName = "First name is required.";
    if (!form.lastName.trim()) e.lastName = "Last name is required.";
    if (!isValidEmail(form.email)) e.email = "Enter a valid email address.";
    if (!isStrongPassword(form.password))
      e.password =
        "Min 8 chars with uppercase, lowercase, number & special character.";
    if (form.password !== form.confirmPassword)
      e.confirmPassword = "Passwords do not match.";
    if (!form.terms) e.terms = "You must accept the terms to continue.";
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  /* ─────────────────────────────────────────────────────────────────────────  */
  /*  Step 1: Submit registration form → send OTP                              */
  /* ─────────────────────────────────────────────────────────────────────────  */

  const handleRegisterSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;
    setSubmitting(true);
    try {
      const res = await fetch("/api/auth/send-otp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          firstName: form.firstName.trim(),
          lastName: form.lastName.trim(),
          email: form.email.trim().toLowerCase(),
          password: form.password,
          confirmPassword: form.confirmPassword,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        if (res.status === 409) setErrors({ email: data.error });
        else toast.error(data.error ?? "Failed to send OTP.");
        return;
      }
      setOtpEmail(form.email.trim().toLowerCase());
      toast.success("OTP sent! Check your email inbox.");
      setStep("otp");
    } catch {
      toast.error("Network error. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  /* ─────────────────────────────────────────────────────────────────────────  */
  /*  Step 2: Verify OTP                                                        */
  /* ─────────────────────────────────────────────────────────────────────────  */

  const handleVerifyOtp = async () => {
    const otp = otpDigits.join("");
    if (otp.length < 6) {
      toast.error("Please enter all 6 digits.");
      return;
    }
    setVerifying(true);
    try {
      const res = await fetch("/api/auth/verify-otp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: otpEmail, otp }),
      });
      const data = await res.json();
      if (!res.ok) {
        toast.error(data.error ?? "Verification failed.");
        if (data.attemptsRemaining === 0) {
          setOtpDigits(Array(6).fill(""));
        }
        return;
      }
      setStep("success");
    } catch {
      toast.error("Network error. Please try again.");
    } finally {
      setVerifying(false);
    }
  };

  /* ─────────────────────────────────────────────────────────────────────────  */
  /*  Resend OTP                                                                */
  /* ─────────────────────────────────────────────────────────────────────────  */

  const handleResend = async () => {
    if (!canResend) return;
    setResending(true);
    try {
      const res = await fetch("/api/auth/resend-otp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: otpEmail }),
      });
      const data = await res.json();
      if (!res.ok) {
        toast.error(data.error ?? "Failed to resend OTP.");
        return;
      }
      toast.success("New OTP sent!");
      setOtpDigits(Array(6).fill(""));
      setCountdown(300);
      setCanResend(false);
      setResendCooldown(30);

      if (timerRef.current) clearInterval(timerRef.current);
      if (resendRef.current) clearInterval(resendRef.current);

      timerRef.current = setInterval(() => {
        setCountdown((c) => {
          if (c <= 1) { clearInterval(timerRef.current!); return 0; }
          return c - 1;
        });
      }, 1000);
      resendRef.current = setInterval(() => {
        setResendCooldown((c) => {
          if (c <= 1) { clearInterval(resendRef.current!); setCanResend(true); return 0; }
          return c - 1;
        });
      }, 1000);
    } catch {
      toast.error("Network error.");
    } finally {
      setResending(false);
    }
  };

  const pwStrength = getPasswordStrength(form.password);

  /* ─────────────────────────────────────────────────────────────────────────  */
  /*  Render                                                                    */
  /* ─────────────────────────────────────────────────────────────────────────  */

  return (
    <main className="relative min-h-screen overflow-hidden px-4 py-12 text-white">
      <Bg />

      <div className="relative z-10 mx-auto w-full max-w-md">
        {/* Logo */}
        <motion.div
          initial={{ opacity: 0, y: -12 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8 flex justify-center"
        >
          <Link href="/" className="flex items-center gap-2">
            <img 
              src="/favicon/apple-touch-icon.png" 
              alt="Fluenzy AI Logo" 
              className="h-8 w-8 rounded-full"
            />
            <span className="text-lg font-bold text-white">Fluenzy AI</span>
          </Link>
        </motion.div>

        <AnimatePresence mode="wait">
          {/* ══════════════════════════════════════════════════════════════ */}
          {/*  STEP 1 – Registration Form                                    */}
          {/* ══════════════════════════════════════════════════════════════ */}
          {step === "register" && (
            <motion.div
              key="register"
              initial={{ opacity: 0, y: 24 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.4 }}
              className="rounded-3xl border border-white/10 bg-slate-900/70 p-8 shadow-2xl backdrop-blur-xl"
            >
              {/* Header */}
              <div className="mb-6">
                <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-violet-400/30 bg-violet-500/10 px-4 py-1.5 text-xs font-semibold uppercase tracking-wider text-violet-200">
                  <ShieldCheck size={12} />
                  Secure Signup
                </div>
                <h1 className="mb-1.5 text-2xl font-bold leading-tight">
                  Create your account
                </h1>
                <p className="text-sm text-slate-400">
                  Join thousands of learners on Fluenzy AI.
                </p>
              </div>

              <form onSubmit={handleRegisterSubmit} className="space-y-4" noValidate>
                {/* Name row */}
                <div className="grid grid-cols-2 gap-3">
                  <FloatingInput
                    id="firstName"
                    label="First Name"
                    value={form.firstName}
                    onChange={(v) => setField("firstName", v)}
                    error={errors.firstName}
                    icon={User}
                    autoComplete="given-name"
                  />
                  <FloatingInput
                    id="lastName"
                    label="Last Name"
                    value={form.lastName}
                    onChange={(v) => setField("lastName", v)}
                    error={errors.lastName}
                    autoComplete="family-name"
                  />
                </div>

                {/* Email */}
                <FloatingInput
                  id="email"
                  label="Email Address"
                  type="email"
                  value={form.email}
                  onChange={(v) => setField("email", v)}
                  error={errors.email}
                  icon={Mail}
                  autoComplete="email"
                />

                {/* Password */}
                <div>
                  <FloatingInput
                    id="password"
                    label="Password"
                    type={showPw ? "text" : "password"}
                    value={form.password}
                    onChange={(v) => setField("password", v)}
                    error={errors.password}
                    icon={Lock}
                    autoComplete="new-password"
                    suffix={
                      <button
                        type="button"
                        onClick={() => setShowPw((v) => !v)}
                        className="text-slate-500 hover:text-slate-300 transition-colors"
                      >
                        {showPw ? <EyeOff size={15} /> : <Eye size={15} />}
                      </button>
                    }
                  />
                  {/* Strength bar */}
                  {form.password && (
                    <div className="mt-2 space-y-1">
                      <div className="flex gap-1">
                        {[1, 2, 3, 4, 5].map((i) => (
                          <div
                            key={i}
                            className={`h-1 flex-1 rounded-full transition-all duration-300 ${
                              i <= pwStrength.score ? pwStrength.color : "bg-white/10"
                            }`}
                          />
                        ))}
                      </div>
                      {pwStrength.label && (
                        <p className="text-[11px] text-slate-500">
                          Strength:{" "}
                          <span
                            className={
                              pwStrength.score <= 2
                                ? "text-red-400"
                                : pwStrength.score === 3
                                ? "text-yellow-400"
                                : "text-emerald-400"
                            }
                          >
                            {pwStrength.label}
                          </span>
                        </p>
                      )}
                    </div>
                  )}
                </div>

                {/* Confirm Password */}
                <FloatingInput
                  id="confirmPassword"
                  label="Confirm Password"
                  type={showCpw ? "text" : "password"}
                  value={form.confirmPassword}
                  onChange={(v) => setField("confirmPassword", v)}
                  error={errors.confirmPassword}
                  icon={Lock}
                  autoComplete="new-password"
                  suffix={
                    <button
                      type="button"
                      onClick={() => setShowCpw((v) => !v)}
                      className="text-slate-500 hover:text-slate-300 transition-colors"
                    >
                      {showCpw ? <EyeOff size={15} /> : <Eye size={15} />}
                    </button>
                  }
                />

                {/* Terms */}
                <div className="space-y-1">
                  <label className="flex cursor-pointer items-start gap-3">
                    <div className="relative mt-0.5 flex-shrink-0">
                      <input
                        type="checkbox"
                        checked={form.terms}
                        onChange={(e) => setField("terms", e.target.checked)}
                        className="sr-only"
                      />
                      <div
                        className={`h-4 w-4 rounded border transition-all ${
                          form.terms
                            ? "border-violet-500 bg-violet-600"
                            : "border-white/20 bg-slate-800"
                        }`}
                      >
                        {form.terms && (
                          <svg viewBox="0 0 10 8" className="w-full p-0.5" fill="none">
                            <path
                              d="M1 4L3.5 6.5L9 1"
                              stroke="white"
                              strokeWidth="1.5"
                              strokeLinecap="round"
                              strokeLinejoin="round"
                            />
                          </svg>
                        )}
                      </div>
                    </div>
                    <span className="text-sm text-slate-400 leading-relaxed">
                      I agree to the{" "}
                      <Link href="/terms-and-conditions" className="text-violet-400 hover:underline">
                        Terms of Service
                      </Link>{" "}
                      and{" "}
                      <Link href="/privacy-policy" className="text-violet-400 hover:underline">
                        Privacy Policy
                      </Link>
                    </span>
                  </label>
                  {errors.terms && (
                    <p className="text-[11px] text-red-400 pl-7">{errors.terms}</p>
                  )}
                </div>

                {/* Submit */}
                <motion.button
                  type="submit"
                  disabled={submitting}
                  whileTap={{ scale: 0.98 }}
                  className="relative mt-2 w-full overflow-hidden rounded-xl bg-gradient-to-r from-violet-600 to-indigo-600 px-5 py-3.5 text-sm font-semibold text-white transition-all hover:from-violet-700 hover:to-indigo-700 disabled:cursor-not-allowed disabled:opacity-70 shadow-lg shadow-violet-500/25"
                >
                  {submitting ? (
                    <span className="flex items-center justify-center gap-2">
                      <div className="h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white" />
                      Sending OTP…
                    </span>
                  ) : (
                    <span className="flex items-center justify-center gap-2">
                      Create Account
                      <ArrowRight size={16} />
                    </span>
                  )}
                  {/* Shine */}
                  <span className="absolute inset-0 -translate-x-full bg-gradient-to-r from-transparent via-white/10 to-transparent transition-transform duration-700 hover:translate-x-full" />
                </motion.button>
              </form>

              {/* OR divider */}
              <div className="my-5 flex items-center gap-3">
                <div className="h-px flex-1 bg-white/8" />
                <span className="text-[11px] font-semibold uppercase tracking-widest text-slate-600">OR</span>
                <div className="h-px flex-1 bg-white/8" />
              </div>

              {/* Sign Up with Google */}
              <motion.button
                whileTap={{ scale: 0.975 }}
                onClick={() => signIn("google", { callbackUrl: "/train" })}
                className="flex w-full items-center justify-center gap-3 rounded-xl border border-white/10 bg-white/5 px-5 py-3.5 text-sm font-semibold text-slate-100 shadow-sm transition-all hover:bg-white/10 hover:border-white/20"
              >
                <GoogleIcon />
                Sign Up with Google
              </motion.button>

              {/* Already have account */}
              <div className="mt-5 flex items-center gap-3">
                <div className="h-px flex-1 bg-white/6" />
                <span className="text-[11px] text-slate-600">Have an account?</span>
                <div className="h-px flex-1 bg-white/6" />
              </div>
              <div className="mt-4 flex flex-col items-center gap-2">
                <p className="text-sm text-slate-500">Already have an account?</p>
                <Link
                  href="/login"
                  className="inline-flex items-center gap-1.5 rounded-xl border border-white/10 bg-white/4 px-5 py-2.5 text-sm font-semibold text-slate-200 transition-all hover:border-violet-500/40 hover:bg-violet-500/10 hover:text-violet-300"
                >
                  Sign In
                </Link>
              </div>
            </motion.div>
          )}

          {/* ══════════════════════════════════════════════════════════════ */}
          {/*  STEP 2 – OTP Verification                                     */}
          {/* ══════════════════════════════════════════════════════════════ */}
          {step === "otp" && (
            <motion.div
              key="otp"
              initial={{ opacity: 0, x: 40 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -40 }}
              transition={{ duration: 0.4 }}
              className="rounded-3xl border border-white/10 bg-slate-900/70 p-8 shadow-2xl backdrop-blur-xl"
            >
              {/* Back */}
              <button
                onClick={() => setStep("register")}
                className="mb-5 flex items-center gap-1.5 text-xs text-slate-500 hover:text-slate-300 transition-colors"
              >
                <ChevronLeft size={14} />
                Back to registration
              </button>

              {/* Header */}
              <div className="mb-7 text-center">
                <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-violet-600/20 border border-violet-500/30">
                  <Mail size={28} className="text-violet-400" />
                </div>
                <h2 className="mb-2 text-2xl font-bold">Check your email</h2>
                <p className="text-sm text-slate-400">
                  We sent a 6-digit code to
                </p>
                <p className="mt-1 font-semibold text-violet-300">{otpEmail}</p>
              </div>

              {/* OTP Inputs */}
              <div className="mb-6">
                <OtpInputRow
                  value={otpDigits}
                  onChange={setOtpDigits}
                  disabled={verifying}
                />
              </div>

              {/* Timer */}
              <div className="mb-5 text-center">
                {countdown > 0 ? (
                  <p className="text-sm text-slate-500">
                    Code expires in{" "}
                    <span
                      className={`font-mono font-bold ${
                        countdown < 60 ? "text-red-400" : "text-violet-300"
                      }`}
                    >
                      {formatTime(countdown)}
                    </span>
                  </p>
                ) : (
                  <p className="text-sm text-red-400 font-medium">
                    OTP expired. Please request a new one.
                  </p>
                )}
              </div>

              {/* Verify button */}
              <motion.button
                onClick={handleVerifyOtp}
                disabled={verifying || otpDigits.join("").length < 6 || countdown === 0}
                whileTap={{ scale: 0.98 }}
                className="w-full rounded-xl bg-gradient-to-r from-violet-600 to-indigo-600 px-5 py-3.5 text-sm font-semibold text-white transition-all hover:from-violet-700 hover:to-indigo-700 disabled:cursor-not-allowed disabled:opacity-50 shadow-lg shadow-violet-500/25"
              >
                {verifying ? (
                  <span className="flex items-center justify-center gap-2">
                    <div className="h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white" />
                    Verifying…
                  </span>
                ) : (
                  <span className="flex items-center justify-center gap-2">
                    <ShieldCheck size={16} />
                    Verify & Create Account
                  </span>
                )}
              </motion.button>

              {/* Resend */}
              <div className="mt-4 text-center">
                {canResend ? (
                  <button
                    onClick={handleResend}
                    disabled={resending}
                    className="inline-flex items-center gap-1.5 text-sm text-violet-400 hover:text-violet-300 transition-colors disabled:opacity-50"
                  >
                    <RotateCcw size={13} className={resending ? "animate-spin" : ""} />
                    {resending ? "Sending…" : "Resend OTP"}
                  </button>
                ) : (
                  <p className="text-sm text-slate-600">
                    Resend available in{" "}
                    <span className="font-mono text-slate-500">{resendCooldown}s</span>
                  </p>
                )}
              </div>

              <p className="mt-5 text-center text-xs text-slate-600">
                Didn't receive the email? Check your spam folder.
              </p>
            </motion.div>
          )}

          {/* ══════════════════════════════════════════════════════════════ */}
          {/*  STEP 3 – Success                                              */}
          {/* ══════════════════════════════════════════════════════════════ */}
          {step === "success" && (
            <motion.div
              key="success"
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              transition={{ duration: 0.4, type: "spring", stiffness: 200, damping: 20 }}
              className="rounded-3xl border border-emerald-500/20 bg-slate-900/70 p-10 shadow-2xl backdrop-blur-xl text-center"
            >
              <motion.div
                initial={{ scale: 0, rotate: -30 }}
                animate={{ scale: 1, rotate: 0 }}
                transition={{ delay: 0.15, type: "spring", stiffness: 260, damping: 18 }}
                className="mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-full bg-emerald-500/20 border-2 border-emerald-500/40"
              >
                <CheckCircle2 size={40} className="text-emerald-400" />
              </motion.div>

              <motion.div
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 }}
              >
                <h2 className="mb-2 text-2xl font-bold">Account Created! 🎉</h2>
                <p className="mb-8 text-slate-400">
                  Your account has been verified and created successfully. You can now sign in.
                </p>

                <motion.button
                  whileTap={{ scale: 0.97 }}
                  onClick={() => router.push("/login")}
                  className="w-full rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 px-5 py-3.5 text-sm font-semibold text-white transition-all hover:from-emerald-700 hover:to-teal-700 shadow-lg shadow-emerald-500/25"
                >
                  <span className="flex items-center justify-center gap-2">
                    Sign In to Your Account
                    <ArrowRight size={16} />
                  </span>
                </motion.button>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </main>
  );
}
