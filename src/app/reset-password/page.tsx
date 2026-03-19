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
  CheckCircle2,
  XCircle,
  RefreshCw,
} from "lucide-react";
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
/*  OTP Input Component                                                        */
/* ─────────────────────────────────────────────────────────────────────────── */
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

    // Auto-focus next input
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
                : "border-white/10 bg-slate-800/60 text-slate-100 focus:border-violet-500/70 focus:bg-slate-800/80 focus:shadow-[0_0_0_3px_rgba(124,58,237,0.12)]"
            } ${disabled ? "opacity-60 cursor-not-allowed" : ""}`}
          />
        ))}
      </div>
      {error && (
        <motion.p
          initial={{ opacity: 0, y: -4 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center text-[11px] text-red-400"
        >
          {error}
        </motion.p>
      )}
    </div>
  );
}

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
  suffix,
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
  suffix?: React.ReactNode;
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
          } ${suffix ? "pr-10" : "pr-3.5"} ${disabled ? "cursor-not-allowed" : ""}`}
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
/*  Password Strength Indicator                                                */
/* ─────────────────────────────────────────────────────────────────────────── */
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
      {/* Strength bar */}
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

      {/* Requirements */}
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

/* ─────────────────────────────────────────────────────────────────────────── */
/*  Main Component                                                             */
/* ─────────────────────────────────────────────────────────────────────────── */
export default function ResetPasswordPage() {
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

  // Get email from sessionStorage on mount
  useEffect(() => {
    const storedEmail = sessionStorage.getItem("resetEmail");
    if (storedEmail) {
      setEmail(storedEmail);
    }
  }, []);

  // Resend cooldown timer
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
      const res = await fetch("/api/auth/resend-reset-otp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });

      const data = await res.json();

      if (!res.ok) {
        if (data.waitSeconds) {
          setResendCooldown(data.waitSeconds);
        }
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
      router.push("/forgot-password");
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
      const res = await fetch("/api/auth/reset-password", {
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

      // Redirect to login after brief delay
      setTimeout(() => {
        router.push("/login");
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
          {success ? (
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="text-center py-8"
            >
              <div className="mx-auto mb-4 flex h-20 w-20 items-center justify-center rounded-full bg-green-500/10 border border-green-500/20">
                <ShieldCheck className="h-10 w-10 text-green-400" />
              </div>
              <h2 className="text-xl font-bold mb-2">Password Reset!</h2>
              <p className="text-sm text-slate-400 mb-4">
                Your password has been successfully updated.
              </p>
              <p className="text-xs text-slate-500">Redirecting to login...</p>
            </motion.div>
          ) : (
            <>
              {/* Badge + heading */}
              <div className="mb-6">
                <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-violet-400/25 bg-violet-500/10 px-3.5 py-1.5 text-[11px] font-semibold uppercase tracking-widest text-violet-300">
                  <KeyRound size={11} />
                  Reset Password
                </div>
                <h1 className="text-[22px] font-bold leading-tight tracking-tight">
                  Create new password
                </h1>
                <p className="mt-1.5 text-sm text-slate-500">
                  Enter the OTP sent to{" "}
                  <span className="text-violet-400">{email || "your email"}</span> and set a new
                  password.
                </p>
              </div>

              <form onSubmit={handleSubmit} className="space-y-5" noValidate>
                {/* OTP Input */}
                <div>
                  <label className="block text-xs font-medium text-slate-400 mb-2">
                    Verification Code
                  </label>
                  <OtpInput
                    value={otp}
                    onChange={(v) => {
                      setOtp(v);
                      setOtpError("");
                    }}
                    error={otpError}
                    disabled={loading}
                  />

                  {/* Resend OTP */}
                  <div className="mt-3 flex justify-center">
                    <button
                      type="button"
                      onClick={handleResendOtp}
                      disabled={resendCooldown > 0 || resending || !email}
                      className={`inline-flex items-center gap-1.5 text-xs transition-colors ${
                        resendCooldown > 0 || resending
                          ? "text-slate-600 cursor-not-allowed"
                          : "text-violet-400 hover:text-violet-300"
                      }`}
                    >
                      <RefreshCw
                        size={12}
                        className={resending ? "animate-spin" : ""}
                      />
                      {resendCooldown > 0
                        ? `Resend in ${resendCooldown}s`
                        : resending
                        ? "Sending..."
                        : "Resend OTP"}
                    </button>
                  </div>
                </div>

                {/* New Password */}
                <div className="space-y-1">
                  <FloatingInput
                    id="new-password"
                    label="New Password"
                    type={showPw ? "text" : "password"}
                    value={newPassword}
                    onChange={(v) => {
                      setNewPassword(v);
                      setPasswordError("");
                    }}
                    error={passwordError}
                    icon={Lock}
                    autoComplete="new-password"
                    disabled={loading}
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
                  <PasswordStrength password={newPassword} />
                </div>

                {/* Confirm Password */}
                <FloatingInput
                  id="confirm-password"
                  label="Confirm Password"
                  type={showConfirmPw ? "text" : "password"}
                  value={confirmPassword}
                  onChange={(v) => {
                    setConfirmPassword(v);
                    setConfirmError("");
                  }}
                  error={confirmError}
                  icon={Lock}
                  autoComplete="new-password"
                  disabled={loading}
                  suffix={
                    <button
                      type="button"
                      tabIndex={-1}
                      onClick={() => setShowConfirmPw((p) => !p)}
                      className="text-slate-500 hover:text-slate-300 transition-colors"
                      aria-label={showConfirmPw ? "Hide password" : "Show password"}
                    >
                      {showConfirmPw ? <EyeOff size={15} /> : <Eye size={15} />}
                    </button>
                  }
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
                      Resetting...
                    </span>
                  ) : (
                    <span className="flex items-center justify-center gap-2">
                      Reset Password
                      <ArrowRight size={15} />
                    </span>
                  )}
                </motion.button>
              </form>

              {/* Back links */}
              <div className="mt-6 flex justify-between text-xs">
                <Link
                  href="/forgot-password"
                  className="text-slate-500 hover:text-violet-400 transition-colors inline-flex items-center gap-1"
                >
                  <ArrowLeft size={12} />
                  Change email
                </Link>
                <Link
                  href="/login"
                  className="text-slate-500 hover:text-violet-400 transition-colors"
                >
                  Back to login
                </Link>
              </div>
            </>
          )}
        </motion.div>

        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5 }}
          className="mt-5 text-center text-[11px] text-slate-700"
        >
          🔒 Your new password is encrypted and secure
        </motion.p>
      </div>
    </main>
  );
}
