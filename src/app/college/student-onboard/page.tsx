"use client";
import { useEffect, useState, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { Eye, EyeOff, CheckCircle, XCircle, Loader2, Lock, Building2 } from "lucide-react";

interface StudentInfo {
  studentName: string;
  email: string;
  department?: string;
  collegeAdmin: { collegeName: string; domain: string };
}

function OnboardContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const token = searchParams.get("token");

  const [student, setStudent] = useState<StudentInfo | null>(null);
  const [tokenStatus, setTokenStatus] = useState<"loading" | "valid" | "invalid" | "used">("loading");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [showPwd, setShowPwd] = useState(false);
  const [showCon, setShowCon] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    if (!token) { setTokenStatus("invalid"); return; }
    fetch(`/api/college/student-onboard?token=${token}`)
      .then(async (res) => {
        if (res.status === 409) { setTokenStatus("used"); return; }
        if (!res.ok) { setTokenStatus("invalid"); return; }
        const d = await res.json();
        setStudent(d.student);
        setTokenStatus("valid");
      })
      .catch(() => setTokenStatus("invalid"));
  }, [token]);

  const handleActivate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (password.length < 8) { setError("Password must be at least 8 characters."); return; }
    if (password !== confirm) { setError("Passwords do not match."); return; }
    setLoading(true);
    setError("");
    try {
      const res = await fetch("/api/college/student-onboard", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token, newPassword: password }),
      });
      const data = await res.json();
      if (!res.ok) { setError(data.error ?? "Activation failed."); return; }
      setSuccess(true);
      setTimeout(() => router.push("/login"), 3000);
    } catch {
      setError("Network error. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center px-4 bg-gradient-to-br from-[#0a0f1e] via-[#0d1427] to-[#0a0f1e]">
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        <div className="absolute top-1/3 left-1/3 w-96 h-96 bg-indigo-600/10 rounded-full blur-3xl" />
      </div>

      <div className="relative w-full max-w-md">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-br from-indigo-500 to-purple-600 mb-4 shadow-lg shadow-indigo-500/30">
            <Building2 className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-3xl font-bold text-white">Activate Your Account</h1>
          <p className="text-slate-400 mt-2 text-sm">Set up your Fluenzy AI student account</p>
        </div>

        <div className="bg-[#111827]/80 border border-slate-700/50 rounded-2xl p-8 backdrop-blur-sm shadow-2xl">
          {tokenStatus === "loading" && (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="w-8 h-8 text-indigo-400 animate-spin" />
            </div>
          )}

          {tokenStatus === "invalid" && (
            <div className="text-center py-8 space-y-3">
              <XCircle className="w-12 h-12 text-red-400 mx-auto" />
              <h2 className="text-white font-semibold text-xl">Invalid Invite Link</h2>
              <p className="text-slate-400 text-sm">This invitation link is invalid or has expired. Please contact your college admin for a new invite.</p>
            </div>
          )}

          {tokenStatus === "used" && (
            <div className="text-center py-8 space-y-3">
              <CheckCircle className="w-12 h-12 text-green-400 mx-auto" />
              <h2 className="text-white font-semibold text-xl">Already Activated</h2>
              <p className="text-slate-400 text-sm">Your account is already active. Please log in with your email and password.</p>
              <a href="/login" className="inline-block mt-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-indigo-500 to-purple-600 text-white font-semibold text-sm hover:from-indigo-600 hover:to-purple-700 transition-all">
                Go to Login
              </a>
            </div>
          )}

          {tokenStatus === "valid" && student && !success && (
            <>
              {/* Student info */}
              <div className="mb-6 p-4 rounded-xl bg-slate-800/50 border border-slate-700/50">
                <p className="text-xs text-slate-400 font-medium uppercase tracking-wide mb-2">Invitation For</p>
                <p className="text-white font-semibold">{student.studentName}</p>
                <p className="text-slate-400 text-sm">{student.email}</p>
                <p className="text-indigo-300 text-xs mt-1">🎓 {student.collegeAdmin.collegeName}</p>
                {student.department && <p className="text-slate-500 text-xs">{student.department}</p>}
              </div>

              {error && (
                <div className="mb-4 p-3 rounded-lg bg-red-500/10 border border-red-500/30 text-red-400 text-sm">{error}</div>
              )}

              <form onSubmit={handleActivate} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-1.5">Create Password</label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                    <input type={showPwd ? "text" : "password"} value={password}
                      onChange={(e) => { setPassword(e.target.value); setError(""); }}
                      placeholder="Min. 8 characters" required minLength={8}
                      className="w-full bg-slate-800/60 border border-slate-600/60 rounded-lg pl-10 pr-10 py-3 text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500/30 transition-all" />
                    <button type="button" onClick={() => setShowPwd(!showPwd)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-200">
                      {showPwd ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-1.5">Confirm Password</label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                    <input type={showCon ? "text" : "password"} value={confirm}
                      onChange={(e) => { setConfirm(e.target.value); setError(""); }}
                      placeholder="Repeat password" required
                      className="w-full bg-slate-800/60 border border-slate-600/60 rounded-lg pl-10 pr-10 py-3 text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500/30 transition-all" />
                    <button type="button" onClick={() => setShowCon(!showCon)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-200">
                      {showCon ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>
                <button type="submit" disabled={loading}
                  className="w-full py-3 rounded-xl bg-gradient-to-r from-indigo-500 to-purple-600 text-white font-semibold text-sm hover:from-indigo-600 hover:to-purple-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-lg shadow-indigo-500/25">
                  {loading ? "Activating…" : "Activate Account & Start Learning →"}
                </button>
              </form>
            </>
          )}

          {success && (
            <div className="text-center py-6 space-y-3">
              <CheckCircle className="w-16 h-16 text-green-400 mx-auto" />
              <h2 className="text-white font-bold text-2xl">Account Activated! 🎉</h2>
              <p className="text-slate-400 text-sm">Your Fluenzy AI account is ready. Redirecting to login…</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default function StudentOnboardPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center bg-[#0a0f1e]">
        <Loader2 className="w-8 h-8 text-indigo-400 animate-spin" />
      </div>
    }>
      <OnboardContent />
    </Suspense>
  );
}
