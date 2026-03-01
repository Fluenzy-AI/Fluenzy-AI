"use client";

import { useSession } from "next-auth/react";
import { useEffect } from "react";

/**
 * LoginTracker
 * - After sign-in: calls /api/auth/track-login to persist device/OS/browser/IP
 *   Uses sessionStorage so it fires exactly ONCE per browser session (survives Next.js
 *   route changes which would reset useRef).
 * - On page close: calls /api/auth/track-logout via sendBeacon to record logoutTime + duration
 * Include this ONCE in the root layout.
 */
export default function LoginTracker() {
  const { data: session, status } = useSession();

  // Track login device info once per browser session
  useEffect(() => {
    if (status !== "authenticated" || !session?.user) return;

    // Key is scoped to this user so switching accounts works correctly
    const key = `login_tracked_${(session.user as any).id ?? session.user.email}`;
    if (typeof sessionStorage !== "undefined" && sessionStorage.getItem(key)) return;

    // Delay 2s to let NextAuth's signIn event finish writing the login log to DB
    const timer = setTimeout(() => {
      fetch("/api/auth/track-login", { method: "POST" })
        .then(() => {
          if (typeof sessionStorage !== "undefined") sessionStorage.setItem(key, "1");
        })
        .catch((e) => console.warn("[LoginTracker] track-login failed:", e));
    }, 2000);

    return () => clearTimeout(timer);
  }, [status, session]);

  // Track logout on tab/window close using sendBeacon (best-effort)
  useEffect(() => {
    if (status !== "authenticated") return;

    const handleUnload = () => {
      // Use sendBeacon so the request survives the page unload.
      // Send userId in the body as a fallback since cookies may not be
      // attached to sendBeacon requests on some browsers.
      if (typeof navigator !== "undefined" && navigator.sendBeacon) {
        const userId = (session?.user as any)?.id;
        const blob = new Blob(
          [JSON.stringify({ userId })],
          { type: "application/json" }
        );
        navigator.sendBeacon("/api/auth/track-logout", blob);
      }
    };

    window.addEventListener("beforeunload", handleUnload);
    return () => window.removeEventListener("beforeunload", handleUnload);
  }, [status]);

  return null;
}
