"use client";

import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { CheckCircle, XCircle, Loader2, Building2, ArrowRight } from "lucide-react";

type VerifyState = "loading" | "success" | "error";

export default function VerifyMagicLinkPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = searchParams.get("token");

  const [state, setState] = useState<VerifyState>("loading");
  const [error, setError] = useState("");
  const [countdown, setCountdown] = useState(3);

  useEffect(() => {
    if (!token) {
      setState("error");
      setError("Invalid or missing magic link token.");
      return;
    }

    const verifyToken = async () => {
      try {
        const res = await fetch("/api/company/verify-magic-link", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ token }),
        });

        const data = await res.json();

        if (!res.ok) {
          setState("error");
          setError(data.error || "Failed to verify magic link.");
          return;
        }

        setState("success");

        // Start countdown for redirect
        const interval = setInterval(() => {
          setCountdown((prev) => {
            if (prev <= 1) {
              clearInterval(interval);
              router.push("/company/portal");
              return 0;
            }
            return prev - 1;
          });
        }, 1000);

        return () => clearInterval(interval);
      } catch {
        setState("error");
        setError("Network error. Please try again.");
      }
    };

    verifyToken();
  }, [token, router]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#080d1a] px-4">
      {/* Ambient glows */}
      <div className="fixed -top-32 -left-32 w-[500px] h-[500px] bg-indigo-700/20 rounded-full blur-3xl pointer-events-none" />
      <div className="fixed bottom-0 right-0 w-80 h-80 bg-purple-700/15 rounded-full blur-3xl pointer-events-none" />

      <div className="relative z-10 w-full max-w-md">
        <div className="bg-[#0d1427]/70 border border-slate-700/40 rounded-2xl p-8 backdrop-blur-sm shadow-2xl text-center">
          {/* Loading State */}
          {state === "loading" && (
            <>
              <div className="w-16 h-16 mx-auto rounded-full bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center mb-6">
                <Loader2 className="w-8 h-8 text-indigo-400 animate-spin" />
              </div>
              <h2 className="text-xl font-bold text-white mb-2">Verifying Magic Link</h2>
              <p className="text-slate-400 text-sm">Please wait while we sign you in...</p>
            </>
          )}

          {/* Success State */}
          {state === "success" && (
            <>
              <div className="w-16 h-16 mx-auto rounded-full bg-green-500/10 border border-green-500/20 flex items-center justify-center mb-6">
                <CheckCircle className="w-8 h-8 text-green-400" />
              </div>
              <h2 className="text-xl font-bold text-white mb-2">Successfully Signed In!</h2>
              <p className="text-slate-400 text-sm mb-6">
                Redirecting to your dashboard in {countdown} seconds...
              </p>
              <button
                onClick={() => router.push("/company/portal")}
                className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-gradient-to-r from-indigo-500 to-purple-600 text-white font-semibold text-sm hover:from-indigo-600 hover:to-purple-700 transition-all shadow-lg shadow-indigo-500/25"
              >
                <Building2 className="w-4 h-4" />
                Go to Dashboard
                <ArrowRight className="w-4 h-4" />
              </button>
            </>
          )}

          {/* Error State */}
          {state === "error" && (
            <>
              <div className="w-16 h-16 mx-auto rounded-full bg-red-500/10 border border-red-500/20 flex items-center justify-center mb-6">
                <XCircle className="w-8 h-8 text-red-400" />
              </div>
              <h2 className="text-xl font-bold text-white mb-2">Verification Failed</h2>
              <p className="text-red-400 text-sm mb-6">{error}</p>
              <div className="space-y-3">
                <Link
                  href="/company/login"
                  className="block w-full py-3 rounded-xl bg-gradient-to-r from-indigo-500 to-purple-600 text-white font-semibold text-sm hover:from-indigo-600 hover:to-purple-700 transition-all shadow-lg shadow-indigo-500/25"
                >
                  Back to Login
                </Link>
                <p className="text-slate-500 text-xs">
                  Magic links expire after 15 minutes. Please request a new one.
                </p>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
