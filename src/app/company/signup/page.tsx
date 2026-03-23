"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  Eye, EyeOff, Building2, Mail, Lock, User, Phone, Briefcase,
  CheckCircle, ArrowLeft, Zap, Globe, Users, BarChart3,
} from "lucide-react";

type Step = "form" | "otp" | "success";

const BLOCKED_DOMAINS = [
  "gmail.com", "yahoo.com", "outlook.com", "hotmail.com", "icloud.com",
  "protonmail.com", "zoho.com", "aol.com", "live.com", "msn.com",
];

const ORG_TYPES = ["Startup", "MNC", "Agency", "NGO", "SME", "Other"];
const MEMBER_ROLES = ["HR Recruiter", "Hiring Manager", "Talent Acquisition Lead", "Admin / Founder"];

const BENEFITS = [
  {
    icon: <Globe className="w-5 h-5 text-indigo-400" />,
    title: "Reach Thousands of Candidates",
    desc: "Post jobs to our growing network of trained, interview-ready candidates.",
  },
  {
    icon: <Zap className="w-5 h-5 text-purple-400" />,
    title: "Auto-Apply Engine",
    desc: "Let our AI match your jobs with qualified candidates automatically.",
  },
  {
    icon: <Users className="w-5 h-5 text-cyan-400" />,
    title: "Team Collaboration",
    desc: "Invite your HR team with role-based access control.",
  },
  {
    icon: <BarChart3 className="w-5 h-5 text-emerald-400" />,
    title: "AI-Powered Analytics",
    desc: "View Fluenzy scores, communication ratings, and interview readiness.",
  },
];

export default function CompanySignupPage() {
  const router = useRouter();
  const [step, setStep] = useState<Step>("form");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [otp, setOtp] = useState("");
  const [resendLoading, setResendLoading] = useState(false);
  const [resendMsg, setResendMsg] = useState("");
  const [domain, setDomain] = useState("");

  const [form, setForm] = useState({
    companyName: "",
    memberName: "",
    email: "",
    password: "",
    confirmPassword: "",
    phone: "",
    orgType: "",
    memberRole: "",
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setForm({ ...form, [e.target.name]: e.target.value });
    setError("");
  };

  const validateEmail = () => {
    const emailDomain = form.email.split("@")[1]?.toLowerCase();
    if (!emailDomain) return "Enter a valid email address.";
    if (BLOCKED_DOMAINS.includes(emailDomain))
      return "Personal emails are not allowed. Please use your official work email.";
    return null;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const emailErr = validateEmail();
    if (emailErr) { setError(emailErr); return; }
    if (form.password !== form.confirmPassword) { setError("Passwords do not match."); return; }
    if (!form.orgType) { setError("Please select your organization type."); return; }
    if (!form.memberRole) { setError("Please select your role in the organization."); return; }
    setLoading(true);
    setError("");
    try {
      const res = await fetch("/api/company/send-otp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const data = await res.json();
      if (!res.ok) { setError(data.error ?? "Something went wrong."); return; }
      setDomain(data.domain || form.email.split("@")[1]);
      setStep("otp");
    } catch {
      setError("Network error. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (otp.length !== 6) { setError("Please enter the 6-digit OTP."); return; }
    setLoading(true);
    setError("");
    try {
      const res = await fetch("/api/company/verify-otp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: form.email, otp }),
      });
      const data = await res.json();
      if (!res.ok) { setError(data.error ?? "OTP verification failed."); return; }
      setStep("success");
      // Auto-redirect to dashboard after 2 seconds
      setTimeout(() => router.push("/company/portal"), 2000);
    } catch {
      setError("Network error. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleResend = async () => {
    setResendLoading(true);
    setResendMsg("");
    try {
      const res = await fetch("/api/company/send-otp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const data = await res.json();
      setResendMsg(data.message ?? (res.ok ? "OTP resent!" : data.error));
    } catch {
      setResendMsg("Failed to resend. Try again.");
    } finally {
      setResendLoading(false);
    }
  };

  const currentStepIndex = step === "form" ? 0 : step === "otp" ? 1 : 2;

  const inputCls =
    "w-full bg-[#0f172a]/80 border border-slate-700/60 rounded-xl pl-11 pr-4 py-3 text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500/30 transition-all";

  const selectCls =
    "w-full bg-[#0f172a]/80 border border-slate-700/60 rounded-xl pl-11 pr-4 py-3 text-sm text-slate-100 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500/30 transition-all appearance-none cursor-pointer";

  return (
    <div className="min-h-screen flex bg-[#080d1a]">
      {/* ── LEFT BRANDING PANEL ── */}
      <div className="hidden lg:flex lg:w-[48%] flex-col justify-between bg-gradient-to-br from-[#0d1330] via-[#0f1840] to-[#0a0f28] p-12 relative overflow-hidden">
        {/* Ambient glows */}
        <div className="absolute -top-32 -left-32 w-[500px] h-[500px] bg-indigo-700/20 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 right-0 w-80 h-80 bg-purple-700/15 rounded-full blur-3xl pointer-events-none" />

        {/* Logo */}
        <div className="relative z-10 flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center font-bold text-white text-lg shadow-lg shadow-indigo-500/30">
            F
          </div>
          <span className="text-white font-semibold text-lg tracking-tight">Fluenzy AI</span>
        </div>

        {/* Hero */}
        <div className="relative z-10 space-y-8">
          <div>
            <span className="inline-block text-xs font-semibold tracking-widest text-indigo-400 uppercase bg-indigo-500/10 border border-indigo-500/20 px-3 py-1 rounded-full mb-5">
              Career Portal for Companies
            </span>
            <h1 className="text-4xl xl:text-5xl font-bold text-white leading-tight">
              Hire{" "}
              <span className="bg-gradient-to-r from-indigo-400 to-purple-400 bg-clip-text text-transparent">
                interview-ready
              </span>{" "}
              talent
            </h1>
            <p className="text-slate-400 mt-4 text-base leading-relaxed max-w-sm">
              Post jobs, access AI-assessed candidates, and streamline your hiring with Fluenzy AI&apos;s Global Career Portal.
            </p>
          </div>

          {/* Benefits */}
          <div className="space-y-4">
            {BENEFITS.map((b) => (
              <div key={b.title} className="flex items-start gap-4 bg-white/[0.03] border border-white/[0.06] rounded-xl p-4">
                <div className="w-9 h-9 rounded-lg bg-white/[0.05] flex items-center justify-center flex-shrink-0">
                  {b.icon}
                </div>
                <div>
                  <p className="text-sm font-semibold text-slate-200">{b.title}</p>
                  <p className="text-xs text-slate-500 mt-0.5 leading-relaxed">{b.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Footer note */}
        <div className="relative z-10">
          <div className="flex items-center gap-2 text-slate-500 text-xs">
            <Briefcase className="w-4 h-4" />
            <span>
              Looking for a job?{" "}
              <Link href="/jobs" className="text-indigo-400 hover:underline">
                Browse Jobs
              </Link>
            </span>
          </div>
        </div>
      </div>

      {/* ── RIGHT FORM PANEL ── */}
      <div className="flex-1 flex flex-col min-h-screen bg-[#080d1a] overflow-y-auto">
        {/* Mobile back link */}
        <div className="lg:hidden px-6 pt-6">
          <Link href="/" className="inline-flex items-center gap-1.5 text-slate-400 hover:text-slate-200 text-sm transition-colors">
            <ArrowLeft className="w-4 h-4" /> Back to Fluenzy AI
          </Link>
        </div>

        <div className="flex-1 flex items-start justify-center px-6 py-10 lg:py-12">
          <div className="w-full max-w-lg">
            {/* Header */}
            <div className="flex items-center gap-4 mb-8">
              <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center shadow-xl shadow-indigo-500/25 flex-shrink-0">
                <Building2 className="w-7 h-7 text-white" />
              </div>
              <div>
                <h2 className="text-2xl font-bold text-white">Register Your Company</h2>
                <p className="text-slate-400 text-sm mt-0.5">Free to sign up — Start posting jobs in minutes</p>
              </div>
            </div>

            {/* Step Indicator */}
            <div className="flex items-center gap-2 mb-8">
              {["Company Details", "Verify Email", "Complete"].map((label, i) => {
                const done = i < currentStepIndex;
                const active = i === currentStepIndex;
                return (
                  <div key={label} className="flex items-center gap-2 flex-1">
                    <div className="flex items-center gap-2 flex-shrink-0">
                      <div className={`flex items-center justify-center w-8 h-8 rounded-full text-xs font-bold transition-all ${
                        done ? "bg-green-500 text-white" : active ? "bg-indigo-500 text-white" : "bg-slate-800 text-slate-500 border border-slate-700"
                      }`}>
                        {done ? <CheckCircle className="w-4 h-4" /> : i + 1}
                      </div>
                      <span className={`text-xs font-medium hidden sm:block ${active ? "text-indigo-300" : done ? "text-green-400" : "text-slate-600"}`}>{label}</span>
                    </div>
                    {i < 2 && <div className={`flex-1 h-px mx-1 ${done ? "bg-green-500/50" : "bg-slate-700/60"}`} />}
                  </div>
                );
              })}
            </div>

            {/* Error */}
            {error && (
              <div className="mb-5 p-4 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-sm flex items-start gap-2">
                <span className="mt-0.5 text-red-400">!</span>
                {error}
              </div>
            )}

            {/* Card */}
            <div className="bg-[#0d1427]/70 border border-slate-700/40 rounded-2xl p-8 backdrop-blur-sm shadow-2xl">

              {/* ── STEP 1: Registration Form ── */}
              {step === "form" && (
                <form onSubmit={handleSubmit} className="space-y-5">
                  <div>
                    <label className="block text-sm font-medium text-slate-300 mb-2">Company / Organization Name *</label>
                    <div className="relative">
                      <Building2 className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                      <input name="companyName" type="text" value={form.companyName} onChange={handleChange}
                        placeholder="Acme Corp" required className={inputCls} />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                    <div>
                      <label className="block text-sm font-medium text-slate-300 mb-2">Organization Type *</label>
                      <div className="relative">
                        <Briefcase className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                        <select name="orgType" value={form.orgType} onChange={handleChange} required className={selectCls}>
                          <option value="" disabled>Select type</option>
                          {ORG_TYPES.map((t) => <option key={t} value={t}>{t}</option>)}
                        </select>
                      </div>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-slate-300 mb-2">Your Role *</label>
                      <div className="relative">
                        <User className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                        <select name="memberRole" value={form.memberRole} onChange={handleChange} required className={selectCls}>
                          <option value="" disabled>Select role</option>
                          {MEMBER_ROLES.map((r) => <option key={r} value={r}>{r}</option>)}
                        </select>
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                    <div>
                      <label className="block text-sm font-medium text-slate-300 mb-2">Your Name *</label>
                      <div className="relative">
                        <User className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                        <input name="memberName" type="text" value={form.memberName} onChange={handleChange}
                          placeholder="John Doe" required className={inputCls} />
                      </div>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-slate-300 mb-2">Phone (optional)</label>
                      <div className="relative">
                        <Phone className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                        <input name="phone" type="tel" value={form.phone} onChange={handleChange}
                          placeholder="+91 9876543210" className={inputCls} />
                      </div>
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-slate-300 mb-2">Work Email *</label>
                    <div className="relative">
                      <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                      <input name="email" type="email" value={form.email} onChange={handleChange}
                        placeholder="hr@company.com" required className={inputCls} />
                    </div>
                    <p className="text-xs text-slate-500 mt-1.5">
                      Use your official work email (e.g., @company.com). Personal emails are not allowed.
                    </p>
                  </div>

                  <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                    <div>
                      <label className="block text-sm font-medium text-slate-300 mb-2">Password *</label>
                      <div className="relative">
                        <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                        <input name="password" type={showPassword ? "text" : "password"} value={form.password} onChange={handleChange}
                          placeholder="Min. 8 characters" required minLength={8}
                          className="w-full bg-[#0f172a]/80 border border-slate-700/60 rounded-xl pl-11 pr-10 py-3 text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500/30 transition-all" />
                        <button type="button" onClick={() => setShowPassword(!showPassword)}
                          className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-200 transition-colors">
                          {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                        </button>
                      </div>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-slate-300 mb-2">Confirm Password *</label>
                      <div className="relative">
                        <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                        <input name="confirmPassword" type={showConfirm ? "text" : "password"} value={form.confirmPassword} onChange={handleChange}
                          placeholder="Repeat password" required
                          className="w-full bg-[#0f172a]/80 border border-slate-700/60 rounded-xl pl-11 pr-10 py-3 text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500/30 transition-all" />
                        <button type="button" onClick={() => setShowConfirm(!showConfirm)}
                          className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-200 transition-colors">
                          {showConfirm ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                        </button>
                      </div>
                    </div>
                  </div>

                  <button type="submit" disabled={loading}
                    className="w-full py-3.5 rounded-xl bg-gradient-to-r from-indigo-500 to-purple-600 text-white font-semibold text-sm hover:from-indigo-600 hover:to-purple-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-lg shadow-indigo-500/25 mt-1">
                    {loading ? "Sending verification..." : "Continue & Verify Email"}
                  </button>

                  <p className="text-center text-sm text-slate-500 pt-1">
                    Already have an account?{" "}
                    <Link href="/company/login" className="text-indigo-400 hover:text-indigo-300 font-medium transition-colors">
                      Sign in
                    </Link>
                  </p>
                </form>
              )}

              {/* ── STEP 2: OTP Verification ── */}
              {step === "otp" && (
                <form onSubmit={handleVerifyOtp} className="space-y-6">
                  <div className="text-center space-y-2">
                    <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-indigo-500/15 border border-indigo-500/25 mb-1">
                      <Mail className="w-8 h-8 text-indigo-400" />
                    </div>
                    <p className="text-white font-semibold text-lg">Check your email</p>
                    <p className="text-slate-400 text-sm">We sent a 6-digit code to</p>
                    <p className="text-indigo-300 font-semibold text-base">{form.email}</p>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-slate-300 mb-3 text-center">Enter Verification Code</label>
                    <input
                      type="text"
                      value={otp}
                      onChange={(e) => { setOtp(e.target.value.replace(/\D/g, "").slice(0, 6)); setError(""); }}
                      placeholder="000000"
                      maxLength={6}
                      className="w-full bg-[#0f172a]/80 border border-slate-700/60 rounded-xl px-4 py-5 text-4xl font-bold text-center text-indigo-300 tracking-[0.6em] placeholder-slate-700 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500/30 transition-all"
                    />
                    <p className="text-center text-xs text-slate-500 mt-2">Code expires in 10 minutes</p>
                  </div>

                  <button type="submit" disabled={loading || otp.length !== 6}
                    className="w-full py-3.5 rounded-xl bg-gradient-to-r from-indigo-500 to-purple-600 text-white font-semibold text-sm hover:from-indigo-600 hover:to-purple-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-lg shadow-indigo-500/25">
                    {loading ? "Verifying..." : "Verify & Complete Setup"}
                  </button>

                  <div className="text-center text-sm text-slate-500">
                    Didn&apos;t receive it?{" "}
                    <button type="button" onClick={handleResend} disabled={resendLoading}
                      className="text-indigo-400 hover:text-indigo-300 disabled:opacity-50 transition-colors">
                      {resendLoading ? "Sending..." : "Resend code"}
                    </button>
                    {resendMsg && <p className="text-green-400 text-xs mt-1.5">{resendMsg}</p>}
                  </div>

                  <button type="button" onClick={() => setStep("form")}
                    className="w-full text-center text-xs text-slate-600 hover:text-slate-400 transition-colors">
                    Back to registration form
                  </button>
                </form>
              )}

              {/* ── STEP 3: Success ── */}
              {step === "success" && (
                <div className="text-center space-y-6">
                  <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-green-500/15 border border-green-500/25">
                    <CheckCircle className="w-10 h-10 text-green-400" />
                  </div>
                  <div>
                    <h2 className="text-2xl font-bold text-white">Welcome to Fluenzy AI!</h2>
                    <p className="text-slate-400 text-sm mt-2 leading-relaxed">
                      Your company has been registered successfully.<br />
                      Redirecting to your dashboard...
                    </p>
                  </div>

                  <div className="bg-slate-800/40 rounded-xl p-5 border border-slate-700/40 text-left space-y-3">
                    <p className="text-xs text-slate-500 font-semibold uppercase tracking-widest mb-1">Company Details</p>
                    <div className="space-y-2">
                      <div className="flex justify-between items-center">
                        <span className="text-xs text-slate-500">Company</span>
                        <span className="text-sm text-slate-200 font-medium">{form.companyName}</span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-xs text-slate-500">Domain</span>
                        <span className="text-sm text-indigo-300">@{domain}</span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-xs text-slate-500">Admin</span>
                        <span className="text-sm text-slate-200">{form.memberName}</span>
                      </div>
                    </div>
                  </div>

                  <Link href="/company/portal"
                    className="inline-block w-full py-3.5 rounded-xl bg-gradient-to-r from-indigo-500 to-purple-600 text-white font-semibold text-sm hover:from-indigo-600 hover:to-purple-700 transition-all text-center shadow-lg shadow-indigo-500/25">
                    Go to Dashboard
                  </Link>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
