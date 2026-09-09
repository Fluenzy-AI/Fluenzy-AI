"use client";

import Link from "next/link";
import { ArrowLeft, CheckCircle2, Smartphone, Monitor, Share2, Copy, Check } from "lucide-react";
import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { useTheme, ThemeName } from "@/contexts/ThemeContext";
import { motion, AnimatePresence } from "framer-motion";
import PWAInstallButton from "@/components/PWAInstallButton";
import { Menu, Bell, Sun, Moon, Sparkles, Leaf, Coffee, Terminal } from "lucide-react";

const installButtonClass =
  "inline-flex min-h-12 items-center justify-center gap-2 rounded-xl px-6 py-3 text-sm font-bold shadow-lg transition";

const themeOptions: { value: ThemeName; label: string; icon: typeof Moon }[] = [
  { value: "light", label: "Light", icon: Sun },
  { value: "dark", label: "Dark", icon: Moon },
  { value: "midnight", label: "Night", icon: Sparkles },
  { value: "forest", label: "Forest", icon: Leaf },
  { value: "parchment", label: "Parchment", icon: Coffee },
  { value: "codeterm", label: "Code", icon: Terminal },
];

const MOBILE_THEME_COLORS: Record<ThemeName, {
  page: string;
  card: string;
  border: string;
  text: string;
  muted: string;
  accent: string;
  header: string;
}> = {
  light: { page: "#FFFFFF", card: "#F8FAFC", border: "#E5E7EB", text: "#0F0B2E", muted: "#6B7280", accent: "#5A2D82", header: "#FFFFFF" },
  parchment: { page: "#E7E0D4", card: "#F1ECE3", border: "#D8D0C2", text: "#29241D", muted: "#665F54", accent: "#5A2D82", header: "#E7E0D4" },
  dark: { page: "#0D0F1A", card: "#161B2E", border: "rgba(255,255,255,0.08)", text: "#F1F5F9", muted: "#94A3B8", accent: "#7C3AED", header: "#161B2E" },
  midnight: { page: "#0a1929", card: "rgba(15,39,68,0.9)", border: "rgba(255,255,255,0.08)", text: "#F1F5F9", muted: "#94A3B8", accent: "#7C3AED", header: "rgba(15,39,68,0.9)" },
  forest: { page: "#0b140e", card: "rgba(17,28,20,0.9)", border: "rgba(180,120,30,0.2)", text: "#e8e4d9", muted: "#9aad8e", accent: "#F59E0B", header: "rgba(17,28,20,0.9)" },
  codeterm: { page: "#0D0D0D", card: "#141414", border: "rgba(204,65,37,0.25)", text: "#F0EDE8", muted: "#888580", accent: "#CC4125", header: "#141414" },
};

export default function InstallPage() {
  const router = useRouter();
  const { data: session, status } = useSession();
  const { theme, setTheme, resolvedTheme } = useTheme();
  const [linkCopied, setLinkCopied] = useState(false);
  const [canShare, setCanShare] = useState(false);
  const [themeMenuOpen, setThemeMenuOpen] = useState(false);
  const installLink = "https://www.fluenzyai.app/install";
  const colors = MOBILE_THEME_COLORS[resolvedTheme] ?? MOBILE_THEME_COLORS.dark;
  const isLight = resolvedTheme === "light" || resolvedTheme === "parchment";
  const themeIcon = themeOptions.find((option) => option.value === theme)?.icon ?? Moon;
  const signInStyles = resolvedTheme === "light"
    ? { background: "linear-gradient(90deg, #5B21B6, #7C3AED)", color: "#FFFFFF" }
    : resolvedTheme === "parchment"
      ? { background: "linear-gradient(90deg, #D97706, #F59E0B)", color: "#211A0E" }
      : { background: "linear-gradient(90deg, #FBBF24, #84CC16)", color: "#0F172A" };
  const installStyles = resolvedTheme === "light"
    ? { background: "linear-gradient(90deg, #5B21B6, #7C3AED)", color: "#FFFFFF", boxShadow: "0 10px 25px rgba(91,33,182,0.25)" }
    : { background: colors.accent, color: isLight ? "#FFFFFF" : colors.text, boxShadow: `0 10px 25px ${colors.accent}35` };
  const shareStyles = resolvedTheme === "light" || resolvedTheme === "parchment"
    ? { background: "linear-gradient(90deg, #5B21B6, #7C3AED)", color: "#FFFFFF", borderColor: "#7C3AED", boxShadow: "0 10px 25px rgba(91,33,182,0.2)" }
    : { color: colors.accent, borderColor: `${colors.accent}66`, background: isLight ? "rgba(255,255,255,0.5)" : `${colors.accent}08` };

  const handlePostInstallRedirect = useCallback(() => {
    if (session?.user) {
      router.replace("/train");
    } else {
      router.replace("/");
    }
  }, [session, router]);

  useEffect(() => {
    if (typeof window === "undefined" || status === "loading") return;

    const isStandalone =
      window.matchMedia("(display-mode: standalone)").matches ||
      Boolean((window.navigator as Navigator & { standalone?: boolean }).standalone) ||
      document.referrer.includes("android-app://");

    if (isStandalone) {
      handlePostInstallRedirect();
    }
  }, [session, status, handlePostInstallRedirect]);

  useEffect(() => {
    setCanShare(typeof navigator.share === "function");
  }, []);

  const shareInstallLink = async () => {
    if (typeof navigator.share === "function") {
      await navigator.share({
        title: "Install FluenzyAI",
        text: "Install FluenzyAI as an app on your device.",
        url: installLink,
      });
      return;
    }

    await navigator.clipboard.writeText(installLink);
    setLinkCopied(true);
    window.setTimeout(() => setLinkCopied(false), 2500);
  };

  return (
    <main
      className="relative min-h-screen overflow-hidden px-5 py-8 sm:px-8"
      style={{
        background: `radial-gradient(circle at 50% -10%, ${colors.accent}18 0, transparent 38%), ${colors.page}`,
        color: colors.text,
      }}
    >
      <div
        className="pointer-events-none absolute -left-24 top-40 h-64 w-64 rounded-full blur-3xl"
        style={{ background: `${colors.accent}12` }}
      />
      <div
        className="pointer-events-none absolute -right-24 bottom-20 h-72 w-72 rounded-full blur-3xl"
        style={{ background: `${colors.accent}10` }}
      />
      <header
        className="fixed inset-x-0 top-0 z-40 flex h-14 items-center justify-between px-4 shadow-lg backdrop-blur-xl sm:hidden"
        style={{ background: colors.header, borderBottom: isLight ? "none" : `1px solid ${colors.border}` }}
      >
        <div className="flex items-center gap-2.5">
          <button
            type="button"
            onClick={() => router.push("/train")}
            className="rounded-xl p-2 active:opacity-60"
            style={{ color: colors.text, background: isLight ? "rgba(0,0,0,0.06)" : "rgba(255,255,255,0.08)" }}
            aria-label="Open training"
          >
            <Menu className="h-[22px] w-[22px]" style={{ color: colors.text, stroke: colors.text }} />
          </button>
          <img src="/white-removebg-preview1.png" alt="Fluenzy AI Logo" className="h-9 w-9 object-contain" />
        </div>
        <div className="flex items-center gap-2">
          <div className="relative">
            <button
              type="button"
              onClick={() => setThemeMenuOpen((open) => !open)}
              className="flex rounded-xl border p-2"
              style={{ color: colors.text, background: isLight ? "#FFFFFF" : "rgba(255,255,255,0.08)", borderColor: colors.border }}
              aria-label="Change theme"
            >
              {themeIcon === Moon ? <Moon className="h-[18px] w-[18px]" style={{ color: colors.text, stroke: colors.text }} /> : (() => {
                const Icon = themeIcon;
                return <Icon className="h-[18px] w-[18px]" style={{ color: colors.text, stroke: colors.text }} />;
              })()}
            </button>
            <AnimatePresence>
              {themeMenuOpen && (
                <>
                  <button type="button" className="fixed inset-0 z-40" onClick={() => setThemeMenuOpen(false)} aria-label="Close theme menu" />
                  <motion.div
                    initial={{ opacity: 0, y: 8, scale: 0.95 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: 8, scale: 0.95 }}
                    className="absolute right-0 top-full z-50 mt-1 w-52 overflow-hidden rounded-xl border shadow-2xl"
                    style={{ background: colors.card, borderColor: colors.border }}
                  >
                    {themeOptions.map(({ value, label, icon: Icon }) => (
                      <button
                        key={value}
                        type="button"
                        onClick={() => { setTheme(value); setThemeMenuOpen(false); }}
                        className="flex w-full items-center gap-3 px-4 py-3 text-left text-sm font-extrabold"
                        style={{
                          color: theme === value ? colors.accent : colors.text,
                          background: theme === value ? `${colors.accent}25` : "transparent",
                        }}
                      >
                        <Icon className="h-4 w-4" style={{ color: theme === value ? colors.accent : colors.text, stroke: theme === value ? colors.accent : colors.text }} />
                        {label}
                      </button>
                    ))}
                  </motion.div>
                </>
              )}
            </AnimatePresence>
          </div>
          {session?.user ? (
            <>
              <button
                type="button"
                onClick={() => router.push("/notifications")}
                className="rounded-xl p-2"
                style={{ color: colors.text, background: isLight ? "rgba(0,0,0,0.06)" : "rgba(255,255,255,0.08)" }}
                aria-label="Notifications"
              >
                <Bell className="h-5 w-5" />
              </button>
              <button
                type="button"
                onClick={() => router.push("/profile")}
                className="flex h-9 w-9 items-center justify-center overflow-hidden rounded-xl border-2 font-black"
                style={{ borderColor: `${colors.accent}80`, background: `linear-gradient(135deg, ${colors.accent}, #4F46E5)`, color: "#FFFFFF" }}
                aria-label="Open profile"
              >
                {session.user.image ? (
                  <img src={session.user.image} alt="Profile" className="h-full w-full object-cover" referrerPolicy="no-referrer" />
                ) : (
                  session.user.name?.charAt(0).toUpperCase() || "U"
                )}
              </button>
            </>
          ) : (
            <button
              type="button"
              onClick={() => router.push("/login")}
              className="rounded-full px-5 py-2 text-xs font-black tracking-[0.2em] shadow-sm"
              style={signInStyles}
            >
              SIGN IN
            </button>
          )}
        </div>
      </header>
      <div className="mx-auto max-w-4xl">
        <Link href="/" className="inline-flex items-center gap-2 text-sm transition" style={{ color: colors.muted }}>
          <ArrowLeft className="h-4 w-4" />
          Back to FluenzyAI
        </Link>

        <section
          className="relative mt-16 block rounded-[2rem] border p-6 text-center shadow-2xl min-[641px]:hidden"
          style={{ background: colors.card, borderColor: colors.border, boxShadow: "0 25px 50px rgba(15,23,42,0.16)" }}
        >
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl border shadow-inner" style={{ color: colors.accent, borderColor: `${colors.accent}35`, background: `${colors.accent}12` }}>
            <Smartphone className="h-9 w-9" />
          </div>
          <p className="mt-5 text-xs font-bold uppercase tracking-[0.24em]" style={{ color: colors.accent }}>Mobile installation</p>
          <h1 className="mt-3 text-3xl font-extrabold">Install FluenzyAI</h1>
          <p className="mx-auto mt-4 max-w-sm text-sm leading-6" style={{ color: colors.muted }}>
            Get quick access to your interview practice from your home screen.
          </p>
          <div className="mt-7">
            <PWAInstallButton
              className={installButtonClass}
              style={installStyles}
              onInstalled={handlePostInstallRedirect}
            />
          </div>
          <p className="mx-auto mt-6 max-w-sm text-xs leading-5" style={{ color: colors.muted }}>
            If no prompt appears, open your browser menu and tap <strong style={{ color: colors.text }}>Install app</strong> or{" "}
            <strong style={{ color: colors.text }}>Add to Home screen</strong>.
          </p>
        </section>

        <section
          className={`relative mt-20 hidden p-10 min-[641px]:block ${
            resolvedTheme === "light"
              ? ""
              : "rounded-[2rem] border shadow-2xl"
          }`}
          style={resolvedTheme === "light"
            ? undefined
            : { background: colors.card, borderColor: colors.border, boxShadow: "0 25px 50px rgba(15,23,42,0.16)" }}
        >
          <div className="mx-auto max-w-2xl text-center">
            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl border shadow-inner" style={{ color: colors.accent, borderColor: `${colors.accent}35`, background: `${colors.accent}12` }}>
              <Monitor className="h-9 w-9" />
            </div>
            <p className="mt-5 text-xs font-bold uppercase tracking-[0.24em]" style={{ color: colors.accent }}>Desktop installation</p>
            <h1 className="mt-3 text-4xl font-extrabold">Install FluenzyAI on your desktop</h1>
            <p className="mx-auto mt-4 max-w-xl text-base leading-7" style={{ color: colors.muted }}>
              Use the native browser install prompt to launch FluenzyAI like a desktop app, with the same account and features.
            </p>
            <div className="mt-8">
              <PWAInstallButton className={installButtonClass} style={installStyles} onInstalled={handlePostInstallRedirect} />
            </div>
            <div className="mt-8 flex flex-wrap justify-center gap-2.5 text-xs sm:text-sm" style={{ color: colors.muted }}>
              <span className="inline-flex items-center gap-2 rounded-full border px-3 py-2" style={{ borderColor: colors.border, background: `${colors.accent}08` }}><CheckCircle2 className="h-4 w-4 text-emerald-400" />No separate download</span>
              <span className="inline-flex items-center gap-2 rounded-full border px-3 py-2" style={{ borderColor: colors.border, background: `${colors.accent}08` }}><CheckCircle2 className="h-4 w-4 text-emerald-400" />Uses the existing PWA</span>
              <span className="inline-flex items-center gap-2 rounded-full border px-3 py-2" style={{ borderColor: colors.border, background: `${colors.accent}08` }}><CheckCircle2 className="h-4 w-4 text-emerald-400" />No new tab</span>
            </div>
            <p className="mt-7 text-xs" style={{ color: colors.muted }}>
              If the prompt is unavailable, use your browser menu and choose <strong style={{ color: colors.text }}>Install FluenzyAI</strong> or{" "}
              <strong style={{ color: colors.text }}>Install app</strong>.
            </p>
          </div>
        </section>

        <div
          className={`mt-6 flex flex-col items-center gap-3 text-center ${
            resolvedTheme === "light"
              ? "min-[641px]:rounded-2xl min-[641px]:border min-[641px]:px-6 min-[641px]:py-5"
              : ""
          }`}
          style={resolvedTheme === "light"
            ? {
                background: "linear-gradient(135deg, rgba(250,249,255,0.96), rgba(243,240,255,0.82))",
                borderColor: "rgba(124,58,237,0.22)",
                boxShadow: "0 8px 24px rgba(91,33,182,0.08), inset 0 1px 0 rgba(255,255,255,0.9)",
              }
            : undefined}
        >
          <button
            type="button"
            onClick={shareInstallLink}
            className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl border px-5 py-2.5 text-sm font-semibold transition"
            style={shareStyles}
          >
            {linkCopied ? <Check className="h-4 w-4 text-emerald-400" /> : canShare ? <Share2 className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
            {linkCopied ? "Install link copied" : "Share install link"}
          </button>
          <p className="break-all text-xs" style={{ color: colors.muted }}>{installLink}</p>
        </div>
      </div>
    </main>
  );
}
