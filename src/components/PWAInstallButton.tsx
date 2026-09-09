"use client";

import { useEffect, useState, type CSSProperties } from "react";
import { Download, CheckCircle2 } from "lucide-react";

interface BeforeInstallPromptEvent extends Event {
  readonly platforms: string[];
  readonly userChoice: Promise<{ outcome: "accepted" | "dismissed"; platform: string }>;
  prompt: () => Promise<void>;
}

interface PWAInstallPromptEvent extends CustomEvent {
  detail: BeforeInstallPromptEvent;
}

interface PWAInstallButtonProps {
  className?: string;
  style?: CSSProperties;
  onInstalled?: () => void;
}

export default function PWAInstallButton({ className = "", style, onInstalled }: PWAInstallButtonProps) {
  const [installPrompt, setInstallPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [isInstalled, setIsInstalled] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  useEffect(() => {
    const mediaQuery = window.matchMedia("(display-mode: standalone)");
    const updateInstalledState = () => {
      setIsInstalled(mediaQuery.matches || Boolean((window.navigator as Navigator & { standalone?: boolean }).standalone));
    };
    const handleBeforeInstallPrompt = (event: Event) => {
      event.preventDefault();
      setInstallPrompt(event as BeforeInstallPromptEvent);
    };
    const handleStoredInstallPrompt = (event: Event) => {
      setInstallPrompt((event as PWAInstallPromptEvent).detail);
    };
    const handleAppInstalled = () => {
      setIsInstalled(true);
      setInstallPrompt(null);
      setMessage(null);
      if (onInstalled) {
        onInstalled();
      }
    };

    updateInstalledState();
    const pendingPrompt = (window as Window & { __fluenzyInstallPrompt?: Event }).__fluenzyInstallPrompt;
    if (pendingPrompt) {
      setInstallPrompt(pendingPrompt as BeforeInstallPromptEvent);
    }
    window.addEventListener("beforeinstallprompt", handleBeforeInstallPrompt);
    window.addEventListener("fluenzyai:beforeinstallprompt", handleStoredInstallPrompt);
    window.addEventListener("appinstalled", handleAppInstalled);
    mediaQuery.addEventListener("change", updateInstalledState);

    return () => {
      window.removeEventListener("beforeinstallprompt", handleBeforeInstallPrompt);
      window.removeEventListener("fluenzyai:beforeinstallprompt", handleStoredInstallPrompt);
      window.removeEventListener("appinstalled", handleAppInstalled);
      mediaQuery.removeEventListener("change", updateInstalledState);
    };
  }, [onInstalled]);

  const handleInstall = async () => {
    if (isInstalled) {
      if (onInstalled) {
        onInstalled();
      } else {
        setMessage("FluenzyAI is already installed on this device.");
      }
      return;
    }

    if (!installPrompt) {
      setMessage("To install FluenzyAI, open your browser menu and choose “Install app” or “Add to Home screen”.");
      return;
    }

    await installPrompt.prompt();
    const choice = await installPrompt.userChoice;
    setInstallPrompt(null);
    if (choice.outcome === "accepted") {
      setMessage("FluenzyAI is being installed.");
      if (onInstalled) {
        onInstalled();
      }
    }
  };

  return (
    <div className="flex flex-col items-center gap-2">
      <button type="button" onClick={handleInstall} className={className} style={style}>
        {isInstalled ? <CheckCircle2 className="h-4 w-4" /> : <Download className="h-4 w-4" />}
        {isInstalled ? "FluenzyAI Installed" : "Install FluenzyAI"}
      </button>
      {message && (
        <p role="status" className="max-w-sm text-center text-xs text-slate-300">
          {message}
        </p>
      )}
    </div>
  );
}
