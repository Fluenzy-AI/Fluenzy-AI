"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { motion } from "framer-motion";
import {
  Lock,
  Eye,
  EyeOff,
  ArrowRight,
  ArrowLeft,
  ShieldCheck,
  KeyRound,
  Building2,
  CheckCircle2,
  XCircle,
  RefreshCw,
} from "lucide-react";
import { toast } from "sonner";

const Bg = () => (
  <>
    <div className="pointer-events-none fixed inset-0 bg-gradient-to-br from-[#0a0f1e] via-[#111c3a] to-[#0a0f1e]" />
    <div className="pointer-events-none fixed left-1/2 top-1/2 h-[560px] w-[560px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-indigo-600/12 blur-[130px]" />
    <div className="pointer-events-none fixed right-10 top-16 h-72 w-72 rounded-full bg-indigo-500/8 blur-[90px]" />
    <div className="pointer-events-none fixed left-8 bottom-16 h-80 w-80 rounded-full bg-purple-600/6 blur-[110px]" />
    <div className="pointer-events-none fixed inset-0 bg-[linear-gradient(rgba(255,255,255,0.015)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.015)_1px,transparent_1px)] bg-[size:60px_60px] [mask-image:radial-gradient(ellipse_80%_60%_at_50%_50%,black,transparent)]" />
  </>
);

function OtpInput({
  value,
  onChange,
  error,
  disabled,
}: {
  value: string;
  onChange: (v: string) => void;
  error?: string;
  disabled?: boolean;
}) {
  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);

  const handleChange = (index: number, digit: string) => {
    if (!/^\d*$/.test(digit)) return;
    const newValue = value.split("");
    newValue[index] = digit;
    const result = newValue.join("").slice(0, 6);
    onChange(result);

    if (digit && index < 5) {
      inputRefs.current[index + 1]?.focus();
    }
  };

  const handleKeyDown = (index: number, e: React.KeyboardEvent) => {
    if (e.key === "Backspace" && !value[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
  };

  const handlePaste = (e: React.ClipboardEvent) => {
    e.preventDefault();
    const pasted = e.clipboardData.getData("text").replace(/\D/g, "").slice(0, 6);
    onChange(pasted);
    const focusIndex = Math.min(pasted.length, 5);
    inputRefs.current[focusIndex]?.focus();
  };

  return (
    <div className="space-y-2">
      <div className="flex justify-center gap-2">
        {[0, 1, 2, 3, 4, 5].map((i) => (
          <input
            key={i}
            ref={(el) => { inputRefs.current[i] = el; }}
            type="text"
            inputMode="numeric"
            maxLength={1}
            value={value[i] || ""}
            onChange={(e) => handleChange(i, e.target.value)}
            onKeyDown={(e) => handleKeyDown(i, e)}
            onPaste={handlePaste}
            disabled={disabled}
            className={`h-14 w-11 rounded-xl border text-center text-xl font-bold transition-all outline-none ${
              error
                ? "border-red-500/60 bg-red-500/5 text-red-400"
                : "border-white/10 bg-slate-800/60 text-slate-100 focus:border-indigo-500/70 focus:bg-slate-800/80 focus:shadow-[0_0_0_3px_rgba(99,102,241,0.12)]"
            } ${disabled ? "opacity-60 cursor-not-allowed" : ""}`}
          />
        ))}
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

function PasswordStrength({ password }: { password: string }) {
  const checks = [
    { label: "8+ characters", valid: password.length >= 8 },
    { label: "Uppercase letter", valid: /[A-Z]/.test(password) },
    { label: "Lowercase letter", valid: /[a-z]/.test(password) },
    { label: "Number", valid: /\d/.test(password) },
    { label: "Special character", valid: /[!@#$%^&*()_+\-=[\]{};':"\\|,.<>/?]/.test(password) },
  ];

  const strength = checks.filter((c) => c.valid).length;
  const strengthColor =
    strength <= 2 ? "bg-red-500" : strength <= 3 ? "bg-yellow-500" : strength <= 4 ? "bg-blue-500" : "bg-green-500";
  const strengthLabel =
    strength <= 2 ? "Weak" : strength <= 3 ? "Fair" : strength <= 4 ? "Good" : "Strong";

  if (!password) return null;

  return (
    <motion.div
      initial={{ opacity: 0, height: 0 }}
      animate={{ opacity: 1, height: "auto" }}
      className="space-y-3 pt-2"
    >
      <div className="space-y-1">
        <div className="flex justify-between items-center">
          <span className="text-[10px] text-slate-500 uppercase tracking-wider">Strength</span>
          <span className={`text-[10px] font-semibold ${strength <= 2 ? "text-red-400" : strength <= 3 ? "text-yellow-400" : strength <= 4 ? "text-blue-400" : "text-green-400"}`}>
            {strengthLabel}
          </span>
        </div>
        <div className="h-1.5 w-full rounded-full bg-slate-700/50 overflow-hidden">
          <motion.div
            initial={{ width: 0 }}
            animate={{ width: `${(strength / 5) * 100}%` }}
            className={`h-full rounded-full transition-all ${strengthColor}`}
          />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-1.5">
        {checks.map((check, i) => (
          <div
            key={i}
            className={`flex items-center gap-1.5 text-[10px] ${
              check.valid ? "text-green-400" : "text-slate-500"
            }`}
          >
            {check.valid ? (
              <CheckCircle2 size={11} />
            ) : (
              <XCircle size={11} className="opacity-50" />
            )}
            {check.label}
          </div>
        ))}
      </div>
    </motion.div>
  );
}

export default function CollegeResetPasswordPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [otp, setOtp] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPw, setShowPw] = useState(false);
  const [showConfirmPw, setShowConfirmPw] = useState(false);

  const [otpError, setOtpError] = useState("");
  const [passwordError, setPasswordError] = useState("");
  const [confirmError, setConfirmError] = useState("");

  const [loading, setLoading] = useState(false);
  const [resending, setResending] = useState(false);
  const [resendCooldown, setResendCooldown] = useState(0);
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    const storedEmail = sessionStorage.getItem("resetEmail");
    if (storedEmail) {
      setEmail(storedEmail);
    }
  }, []);

  useEffect(() => {
    if (resendCooldown > 0) {
      const timer = setTimeout(() => setResendCooldown((c) => c - 1), 1000);
      return () => clearTimeout(timer);
    }
  }, [resendCooldown]);

  const isStrongPassword = (password: string): boolean => {
    return /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[!@#$%^&*()_+\-=[\]{};':"\\|,.<>/?]).{8,}$/.test(
      password
    );
  };

  const handleResendOtp = async () => {
    if (resendCooldown > 0 || resending || !email) return;

    setResending(true);
    try {
      const res = await fetch("/api/college/forgot-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });

      const data = await res.json();

      if (!res.ok) {
        toast.error(data.error || "Failed to resend OTP.");
        return;
      }

      toast.success("New OTP sent to your email!");
      setResendCooldown(60);
      setOtp("");
      setOtpError("");
    } catch {
      toast.error("Failed to resend OTP. Please try again.");
    } finally {
      setResending(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setOtpError("");
    setPasswordError("");
    setConfirmError("");

    let hasError = false;

    if (!email) {
      toast.error("Email not found. Please start from the forgot password page.");
      router.push("/college/forgot-password");
      return;
    }

    if (otp.length !== 6) {
      setOtpError("Please enter the 6-digit OTP.");
      hasError = true;
    }

    if (!isStrongPassword(newPassword)) {
      setPasswordError(
        "Password must be at least 8 characters with uppercase, lowercase, number, and special character."
      );
      hasError = true;
    }

    if (newPassword !== confirmPassword) {
      setConfirmError("Passwords do not match.");
      hasError = true;
    }

    if (hasError) return;

    setLoading(true);
    try {
      const res = await fetch("/api/college/reset-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email,
          otp,
          newPassword,
          confirmPassword,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        if (data.attemptsRemaining !== undefined) {
          setOtpError(data.error);
        } else {
          toast.error(data.error || "Failed to reset password.");
        }
        return;
      }

      setSuccess(true);
      toast.success("Password reset successfully!");
      sessionStorage.removeItem("resetEmail");

      setTimeout(() => {
        router.push("/college/login");
      }, 2000);
    } catch {
      toast.error("Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="relative min-h-screen overflow-hidden text-white flex items-center justify-center px-4 py-12">
      <Bg />

      <div className="relative z-10 w-full max-w-[420px]">
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
              className="h-9 w-9 rounded-xl shadow-lg shadow-indigo-500/30 group-hover:shadow-indigo-500/50 transition-shadow"
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
          {success ? (
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="text-center py-8"
            >
              <div className="mx-auto mb-4 flex h-20 w-20 items-center justify-center rounded-full bg-green-500/10 border border-green-500/20">
                <ShieldCheck className="h-10 w-10 text-green-400" />
              </div>
              <h2 className="text-lg font-semibold mb-2">Password Reset Successfully!</h2>
              <p className="text-sm text-slate-400 mb-6">You can now sign in with your new password.</p>
              <p className="text-xs text-slate-500">Redirecting to login...</p>
            </motion.div>
          ) : (
            <>
              <div className="mb-7">
                <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-indigo-400/25 bg-indigo-500/10 px-3.5 py-1.5 text-[11px] font-semibold uppercase tracking-widest text-indigo-300">
                  <Building2 size={11} />
                  College Admin
                </div>
                <h1 className="text-[22px] font-bold leading-tight tracking-tight">
                  Reset your password
                </h1>
                <p className="mt-1.5 text-sm text-slate-500">
                  Enter the code from your email and create a new password.
                </p>
              </div>

              <form onSubmit={handleSubmit} className="space-y-5" noValidate>
                <div>
                  <label className="text-sm font-medium text-slate-300 mb-2 block">Verification Code</label>
                  <OtpInput
                    value={otp}
                    onChange={setOtp}
                    error={otpError}
                    disabled={loading}
                  />
                </div>

                <div>
                  <label className="text-sm font-medium text-slate-300 mb-2 block">New Password</label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                    <input
                      type={showPw ? "text" : "password"}
                      value={newPassword}
                      onChange={(e) => {
                        setNewPassword(e.target.value);
                        setPasswordError("");
                      }}
                      disabled={loading}
                      placeholder="••••••••"
                      className={`w-full bg-slate-800/60 border ${
                        passwordError ? "border-red-500/60" : "border-slate-600/60"
                      } rounded-xl pl-10 pr-10 py-3.5 text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500/30 transition-all ${
                        loading ? "opacity-60 cursor-not-allowed" : ""
                      }`}
                    />
                    <button
                      type="button"
                      onClick={() => setShowPw(!showPw)}
                      disabled={loading}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-200 transition-colors disabled:opacity-50"
                    >
                      {showPw ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                  {passwordError && (
                    <motion.p
                      initial={{ opacity: 0, y: -4 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="text-[11px] text-red-400 pl-1 mt-1"
                    >
                      {passwordError}
                    </motion.p>
                  )}
                  <PasswordStrength password={newPassword} />
                </div>

                <div>
                  <label className="text-sm font-medium text-slate-300 mb-2 block">Confirm Password</label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                    <input
                      type={showConfirmPw ? "text" : "password"}
                      value={confirmPassword}
                      onChange={(e) => {
                        setConfirmPassword(e.target.value);
                        setConfirmError("");
                      }}
                      disabled={loading}
                      placeholder="••••••••"
                      className={`w-full bg-slate-800/60 border ${
                        confirmError ? "border-red-500/60" : "border-slate-600/60"
                      } rounded-xl pl-10 pr-10 py-3.5 text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500/30 transition-all ${
                        loading ? "opacity-60 cursor-not-allowed" : ""
                      }`}
                    />
                    <button
                      type="button"
                      onClick={() => setShowConfirmPw(!showConfirmPw)}
                      disabled={loading}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-200 transition-colors disabled:opacity-50"
                    >
                      {showConfirmPw ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                  {confirmError && (
                    <motion.p
                      initial={{ opacity: 0, y: -4 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="text-[11px] text-red-400 pl-1 mt-1"
                    >
                      {confirmError}
                    </motion.p>
                  )}
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full rounded-xl bg-gradient-to-r from-indigo-500 to-purple-600 px-5 py-3.5 text-sm font-semibold text-white shadow-lg shadow-indigo-500/25 transition-all hover:from-indigo-600 hover:to-purple-700 hover:shadow-indigo-500/40 disabled:cursor-not-allowed disabled:opacity-60 active:scale-95"
                >
                  {loading ? (
                    <span className="flex items-center justify-center gap-2">
                      <div className="h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white" />
                      Resetting...
                    </span>
                  ) : (
                    <span className="flex items-center justify-center gap-2">
                      Reset Password
                      <ArrowRight size={15} />
                    </span>
                  )}
                </button>

                {otp && (
                  <button
                    type="button"
                    onClick={handleResendOtp}
                    disabled={resendCooldown > 0 || resending}
                    className="w-full text-sm text-indigo-400 hover:text-indigo-300 transition-colors disabled:opacity-50 flex items-center justify-center gap-1.5"
                  >
                    <RefreshCw size={14} />
                    {resendCooldown > 0 ? `Resend in ${resendCooldown}s` : "Resend Code"}
                  </button>
                )}
              </form>
            </>
          )}

          <div className="mt-7 flex justify-center">
            <Link
              href="/college/login"
              className="inline-flex items-center gap-1.5 rounded-xl border border-white/10 bg-white/4 px-5 py-2.5 text-sm font-semibold text-slate-200 transition-all hover:border-indigo-500/40 hover:bg-indigo-500/10 hover:text-indigo-300"
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
