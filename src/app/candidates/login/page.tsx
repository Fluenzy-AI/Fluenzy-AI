"use client";

import { useState, useEffect, Suspense } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [form, setForm] = useState({ email: "", password: "" });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [redirect, setRedirect] = useState("/candidates/dashboard");

  useEffect(() => {
    const r = searchParams.get("redirect");
    if (r) setRedirect(r);
  }, [searchParams]);

  function set(k: string, v: string) { setForm(p => ({ ...p, [k]: v })); }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");
    const res = await fetch("/api/candidates/auth/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    });
    const data = await res.json();
    if (!res.ok) { setError(data.error || "Login failed"); setLoading(false); return; }
    router.push(redirect);
  }

  return (
    <div className="min-h-screen bg-background flex items-center justify-center px-4">
      <div className="w-full max-w-md">
        {/* Logo */}
        <div className="text-center mb-8">
          <Link href="/" className="inline-flex items-center gap-2 mb-6">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-violet-500 to-purple-600 flex items-center justify-center text-white font-bold text-sm">F</div>
            <span className="text-white font-semibold text-lg">Fluenzy AI</span>
          </Link>
          <h1 className="text-2xl font-bold text-foreground">Candidate Login</h1>
          <p className="text-muted-foreground text-sm mt-1">Track your applications and manage your profile</p>
        </div>

        <div className="bg-card border border-border rounded-2xl p-8 shadow-2xl">
          {error && (
            <div className="bg-red-500/10 border border-red-500/20 text-red-400 text-sm px-4 py-3 rounded-xl mb-5">{error}</div>
          )}
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-medium text-muted-foreground mb-1.5">Email Address</label>
              <input required type="email" value={form.email} onChange={e => set("email", e.target.value)}
                placeholder="you@example.com"
                className="w-full bg-background border border-border text-foreground placeholder:text-muted-foreground rounded-xl px-3.5 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/40" />
            </div>
            <div>
              <label className="block text-xs font-medium text-muted-foreground mb-1.5">Password</label>
              <input required type="password" value={form.password} onChange={e => set("password", e.target.value)}
                placeholder="••••••••"
                className="w-full bg-background border border-border text-foreground placeholder:text-muted-foreground rounded-xl px-3.5 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/40" />
            </div>
            <button type="submit" disabled={loading}
              className="w-full py-2.5 bg-primary text-primary-foreground font-semibold text-sm rounded-xl hover:bg-primary/90 disabled:opacity-60 transition mt-2">
              {loading ? "Signing in..." : "Sign In"}
            </button>
          </form>

          <p className="text-center text-sm text-muted-foreground mt-5">
            Don't have an account?{" "}
            <Link href="/candidates/signup" className="text-primary hover:underline font-medium">Create one</Link>
          </p>
        </div>

        <p className="text-center text-xs text-muted-foreground mt-4">
          <Link href="/careers" className="hover:text-foreground transition">← Back to Careers</Link>
        </p>
      </div>
    </div>
  );
}

export default function CandidateLoginPage() {
  return (
    <Suspense fallback={null}>
      <LoginForm />
    </Suspense>
  );
}
