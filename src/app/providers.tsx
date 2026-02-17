"use client";
import { SessionProvider } from "next-auth/react";
import { ThemeProvider } from "next-themes";

export default function Provider({ children }: { children: React.ReactNode }) {
  return (
    <ThemeProvider
      attribute="class"
      forcedTheme="dark"
      storageKey="fluenzyai-theme"
      disableTransitionOnChange={false}
    >
      <SessionProvider>{children}</SessionProvider>
    </ThemeProvider>
  );
}
